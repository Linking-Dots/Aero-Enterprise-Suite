<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;

class DeviceTrackingService
{
    protected Agent $agent;

    public function __construct()
    {
        $this->agent = new Agent;
    }

    /**
     * Generate a unique device identifier based on request data.
     * Note: IP address is excluded from fingerprint to handle dynamic IPs.
     */
    public function generateDeviceId(Request $request): string
    {
        $userAgent = $request->userAgent() ?? '';

        // Create a stable device fingerprint that doesn't include IP
        // This prevents issues with dynamic IPs, WiFi switching, VPN usage, etc.
        $fingerprint = [
            'user_agent' => $userAgent,
            'accept_language' => $request->header('Accept-Language', ''),
            'accept_encoding' => $request->header('Accept-Encoding', ''),
        ];

        $fingerprintString = json_encode($fingerprint);

        return hash('sha256', $fingerprintString);
    }

    /**
     * Generate a more flexible device identifier for compatibility checks.
     * This is used to identify similar devices even with minor differences.
     */
    public function generateCompatibleDeviceId(Request $request): string
    {
        $userAgent = $request->userAgent() ?? '';

        // Extract core browser and platform info, ignoring version details
        $this->agent->setUserAgent($userAgent);

        $coreFingerprint = [
            'browser' => $this->agent->browser(),
            'platform' => $this->agent->platform(),
            'device_type' => $this->agent->isMobile() ? 'mobile' : ($this->agent->isTablet() ? 'tablet' : 'desktop'),
        ];

        $fingerprintString = json_encode($coreFingerprint);

        return hash('sha256', $fingerprintString);
    }

    /**
     * Get device information from request.
     */
    public function getDeviceInfo(Request $request): array
    {
        $this->agent->setUserAgent($request->userAgent());

        $deviceType = 'desktop';
        if ($this->agent->isMobile()) {
            $deviceType = 'mobile';
        } elseif ($this->agent->isTablet()) {
            $deviceType = 'tablet';
        }

        return [
            'device_name' => $this->generateDeviceName(),
            'browser_name' => $this->agent->browser(),
            'browser_version' => $this->agent->version($this->agent->browser()),
            'platform' => $this->agent->platform(),
            'device_type' => $deviceType,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            // Optional hardware identifiers provided by native shells or browser extensions
            'device_model' => $request->header('X-Device-Model'),
            'device_serial' => $request->header('X-Device-Serial'),
            'device_mac' => $request->header('X-Device-Mac'),
            'device_fingerprint' => [
                'screen_resolution' => $request->header('Screen-Resolution'),
                'timezone' => $request->header('Timezone'),
                'language' => $request->header('Accept-Language'),
                'plugins' => $request->header('Plugins'),
            ],
        ];
    }

    /**
     * Generate a human-readable device name.
     */
    protected function generateDeviceName(): string
    {
        $browser = $this->agent->browser();
        $platform = $this->agent->platform();

        if ($this->agent->isMobile()) {
            return "{$browser} on {$platform} Mobile";
        }

        if ($this->agent->isTablet()) {
            return "{$browser} on {$platform} Tablet";
        }

        return "{$browser} on {$platform}";
    }

    /**
     * Check if user can login from the current device.
     */
    public function canUserLoginFromDevice(User $user, Request $request): array
    {
        $deviceId = $this->generateDeviceId($request);

        // If single device login is not enabled, allow login
        if (! $user->hasSingleDeviceLoginEnabled()) {
            return [
                'allowed' => true,
                'device_id' => $deviceId,
                'message' => 'Login allowed',
            ];
        }

        // First, check if this exact device is already registered and active
        $existingDevice = $user->devices()
            ->where('device_id', $deviceId)
            ->active()
            ->first();

        if ($existingDevice) {
            return [
                'allowed' => true,
                'device_id' => $deviceId,
                'existing_device' => $existingDevice,
                'message' => 'Login from registered device',
            ];
        }

        // If no exact match, check for compatible devices (same core browser/platform)
        // This handles cases where minor changes in user agent or headers occur
        $compatibleDeviceId = $this->generateCompatibleDeviceId($request);
        $compatibleDevice = $user->devices()
            ->where('compatible_device_id', $compatibleDeviceId)
            ->active()
            ->first();

        if ($compatibleDevice) {
            // Update the device with new device_id and hardware identity for future logins
            $info = $this->getDeviceInfo($request);
            $compatibleDevice->update([
                'device_id' => $deviceId,
                'device_model' => $info['device_model'] ?? $compatibleDevice->device_model,
                'device_serial' => $info['device_serial'] ?? $compatibleDevice->device_serial,
                'device_mac' => $info['device_mac'] ?? $compatibleDevice->device_mac,
            ]);

            return [
                'allowed' => true,
                'device_id' => $deviceId,
                'existing_device' => $compatibleDevice,
                'message' => 'Login from compatible device (updated fingerprint)',
            ];
        }

        // Check if user has ANY registered devices
        // Once a device is registered, it becomes the ONLY allowed device
        // If no devices exist (after reset), allow login from any device
        $registeredDevice = $user->devices()->first();

        if ($registeredDevice) {
            // Additional check: see if this might be the same physical device
            // by comparing core device characteristics
            $deviceInfo = $this->getDeviceInfo($request);
            $currentDeviceFingerprint = [
                'browser_name' => $deviceInfo['browser_name'],
                'platform' => $deviceInfo['platform'],
                'device_type' => $deviceInfo['device_type'],
            ];

            $registeredDeviceFingerprint = [
                'browser_name' => $registeredDevice->browser_name,
                'platform' => $registeredDevice->platform,
                'device_type' => $registeredDevice->device_type,
            ];

            // If the core characteristics match, this might be the same device
            // with changed network conditions (IP, headers, etc.)
            if ($currentDeviceFingerprint === $registeredDeviceFingerprint) {
                // Update the existing device with new fingerprint
                $registeredDevice->update([
                    'device_id' => $deviceId,
                    'compatible_device_id' => $compatibleDeviceId,
                    'ip_address' => $deviceInfo['ip_address'],
                    'user_agent' => $deviceInfo['user_agent'],
                    'device_model' => $deviceInfo['device_model'] ?? $registeredDevice->device_model,
                    'device_serial' => $deviceInfo['device_serial'] ?? $registeredDevice->device_serial,
                    'device_mac' => $deviceInfo['device_mac'] ?? $registeredDevice->device_mac,
                ]);

                return [
                    'allowed' => true,
                    'device_id' => $deviceId,
                    'existing_device' => $registeredDevice,
                    'message' => 'Login from registered device (updated network fingerprint)',
                ];
            }

            return [
                'allowed' => false,
                'device_id' => $deviceId,
                'blocked_by_device' => $registeredDevice,
                'message' => 'Login blocked: Account is locked to a specific device. Only the registered device can access this account.',
            ];
        }

        // No registered devices, allow login (first time setup or after admin reset)
        return [
            'allowed' => true,
            'device_id' => $deviceId,
            'message' => 'Login allowed: No registered devices found - new device registration',
        ];
    }

    /**
     * Register a new device for the user.
     */
    public function registerDevice(User $user, Request $request, string $sessionId): UserDevice
    {
        $deviceId = $this->generateDeviceId($request);
        $compatibleDeviceId = $this->generateCompatibleDeviceId($request);
        $deviceInfo = $this->getDeviceInfo($request);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($user, $deviceId, $compatibleDeviceId, $sessionId, $deviceInfo) {
            // If single device login is enabled, remove all other devices first
            if ($user->hasSingleDeviceLoginEnabled()) {
                // Delete all existing devices for this user to enforce single device policy
                $user->devices()->delete();
            }

            // Use updateOrCreate to handle potential race conditions
        $device = $user->devices()->updateOrCreate(
                [
                    'device_id' => $deviceId,
                ],
                [
                    'compatible_device_id' => $compatibleDeviceId,
            'device_model' => $deviceInfo['device_model'] ?? null,
            'device_serial' => $deviceInfo['device_serial'] ?? null,
            'device_mac' => $deviceInfo['device_mac'] ?? null,
                    'session_id' => $sessionId,
                    'last_activity' => Carbon::now(),
                    'is_active' => true,
                    'ip_address' => $deviceInfo['ip_address'],
                    'device_fingerprint' => $deviceInfo['device_fingerprint'],
                    'device_name' => $deviceInfo['device_name'],
                    'browser_name' => $deviceInfo['browser_name'],
                    'browser_version' => $deviceInfo['browser_version'],
                    'platform' => $deviceInfo['platform'],
                    'device_type' => $deviceInfo['device_type'],
                    'user_agent' => $deviceInfo['user_agent'],
                ]
            );

            return $device;
        });
    }

    /**
     * Update device activity.
     */
    public function updateDeviceActivity(User $user, Request $request, ?string $sessionId = null): void
    {
        $deviceId = $this->generateDeviceId($request);
        $compatibleDeviceId = $this->generateCompatibleDeviceId($request);

        // First try to find by exact device ID
        $device = $user->devices()
            ->where('device_id', $deviceId)
            ->active()
            ->first();

        // If not found, try to find by compatible device ID
        if (! $device) {
            $device = $user->devices()
                ->where('compatible_device_id', $compatibleDeviceId)
                ->active()
                ->first();

            // Update the device ID if found through compatible ID
            if ($device) {
                $device->update(['device_id' => $deviceId]);
            }
        }

        if ($device) {
            $device->updateActivity($sessionId);
        }
    }

    /**
     * Deactivate device by session ID (logout).
     * For single-device users, the device remains registered but becomes inactive.
     */
    public function deactivateDeviceBySession(string $sessionId): void
    {
        UserDevice::where('session_id', $sessionId)
            ->active()
            ->update([
                'is_active' => false,
                'session_id' => null,
            ]);
    }

    /**
     * Clean up inactive devices (older than 30 days).
     */
    public function cleanupInactiveDevices(): int
    {
        return UserDevice::where('is_active', false)
            ->where('updated_at', '<', Carbon::now()->subDays(30))
            ->delete();
    }

    /**
     * Reset/unlock devices for a user (Admin function).
     * This removes all registered devices, allowing the user to login from any device again.
     */
    public function resetUserDevices(User $user): bool
    {
        return $user->devices()->delete() > 0;
    }

    /**
     * Get device statistics for admin.
     */
    public function getDeviceStatistics(): array
    {
        $totalDevices = UserDevice::count();
        $activeDevices = UserDevice::active()->count();
        $onlineDevices = UserDevice::active()
            ->where('last_activity', '>', Carbon::now()->subMinutes(5))
            ->count();

        $usersWithSingleDevice = User::where('single_device_login_enabled', true)->count();

        return [
            'total_devices' => $totalDevices,
            'active_devices' => $activeDevices,
            'online_devices' => $onlineDevices,
            'inactive_devices' => $totalDevices - $activeDevices,
            'users_with_single_device_enabled' => $usersWithSingleDevice,
        ];
    }
}
