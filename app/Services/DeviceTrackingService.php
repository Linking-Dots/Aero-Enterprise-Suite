<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        // Include hardware identifiers in fingerprint if available to improve uniqueness
        $deviceModel = $request->header('X-Device-Model')
            ?? $request->input('device_model')
            ?? $request->cookie('device_model');

        $deviceSerial = $request->header('X-Device-Serial')
            ?? $request->input('device_serial')
            ?? $request->cookie('device_serial');

        // Create a stable device fingerprint that doesn't include IP
        // This prevents issues with dynamic IPs, WiFi switching, VPN usage, etc.
        $fingerprint = [
            'user_agent' => $userAgent,
            'accept_language' => $request->header('Accept-Language', ''),
            'accept_encoding' => $request->header('Accept-Encoding', ''),
            // Include hardware info in fingerprint for better uniqueness when available
            'device_model' => $deviceModel,
            'device_serial' => $deviceSerial,
        ];

        $fingerprintString = json_encode($fingerprint);

        return hash('sha256', $fingerprintString);
    }

    /**
     * Generate a more flexible device identifier for compatibility checks.
     * This is used to identify similar devices even with minor differences.
     * CRITICAL: Now includes user_id to prevent cross-account device reuse.
     */
    public function generateCompatibleDeviceId(Request $request, ?int $userId = null): string
    {
        $userAgent = $request->userAgent() ?? '';

        // Extract core browser and platform info, ignoring version details
        $this->agent->setUserAgent($userAgent);

        // Include stable client hints for better device differentiation
        $clientHints = [
            'ua_platform' => $request->header('Sec-CH-UA-Platform'),
            'ua_mobile' => $request->header('Sec-CH-UA-Mobile'),
            'ua_model' => $request->header('Sec-CH-UA-Model'),
            'ua_full_version' => $request->header('Sec-CH-UA-Full-Version'),
        ];

        // Check for persistent device GUID cookie
        $deviceGuid = $request->cookie('device_guid');

        $coreFingerprint = [
            'browser' => $this->agent->browser(),
            'platform' => $this->agent->platform(),
            'device_type' => $this->agent->isMobile() ? 'mobile' : ($this->agent->isTablet() ? 'tablet' : 'desktop'),
            'client_hints' => array_filter($clientHints), // Only include non-null hints
            'device_guid' => $deviceGuid,
            // CRITICAL: Include user_id to scope devices per account
            'user_id' => $userId,
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

        // Try to read hardware identity from headers, then body input, then cookies
        $deviceModel = $request->header('X-Device-Model')
            ?? $request->input('device_model')
            ?? $request->cookie('device_model');

        $deviceSerial = $request->header('X-Device-Serial')
            ?? $request->input('device_serial')
            ?? $request->cookie('device_serial');

        $deviceMac = $request->header('X-Device-Mac')
            ?? $request->input('device_mac')
            ?? $request->cookie('device_mac');

        return [
            'device_name' => $this->generateDeviceName(),
            'browser_name' => $this->agent->browser(),
            'browser_version' => $this->agent->version($this->agent->browser()),
            'platform' => $this->agent->platform(),
            'device_type' => $deviceType,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            // Optional hardware identifiers provided by native shells or browser extensions
            'device_model' => $deviceModel,
            'device_serial' => $deviceSerial,
            'device_mac' => $deviceMac,
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
     * CRITICAL: All device queries are now scoped to user_id to prevent cross-account device reuse.
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

        // First, check if this exact device is already registered (active or inactive) FOR THIS USER
        $existingDevice = $user->devices()
            ->where('device_id', $deviceId)
            ->where('user_id', $user->id) // Explicit user scoping
            ->first(); // Check both active and inactive

        if ($existingDevice) {
            // If device was inactive, reactivate it
            if (! $existingDevice->is_active) {
                $existingDevice->update([
                    'is_active' => true,
                    'last_activity' => Carbon::now(),
                ]);
            }

            return [
                'allowed' => true,
                'device_id' => $deviceId,
                'existing_device' => $existingDevice->fresh(),
                'message' => 'Login from registered device',
            ];
        }

        // If no exact match, check for compatible devices (same core browser/platform)
        // This handles cases where minor changes in user agent or headers occur
        // CRITICAL: Include user_id in hash to prevent cross-account collisions
        $compatibleDeviceId = $this->generateCompatibleDeviceId($request, $user->id);
        $compatibleDevice = $user->devices()
            ->where('compatible_device_id', $compatibleDeviceId)
            ->where('user_id', $user->id) // Explicit user scoping
            ->first(); // Check both active and inactive

        if ($compatibleDevice) {
            // SECURITY CHECK: Verify the device actually belongs to this user
            if ($compatibleDevice->user_id !== $user->id) {
                // Log security event - attempted device takeover
                Log::warning('Device takeover attempt detected', [
                    'attempted_user_id' => $user->id,
                    'device_owner_id' => $compatibleDevice->user_id,
                    'device_id' => $deviceId,
                    'ip' => $request->ip(),
                ]);

                return [
                    'allowed' => false,
                    'device_id' => $deviceId,
                    'message' => 'Login blocked: Device verification failed.',
                ];
            }

            // Update the device with new device_id and hardware identity for future logins
            // CRITICAL: Reactivate the device if it was inactive
            $info = $this->getDeviceInfo($request);
            $compatibleDevice->update([
                'device_id' => $deviceId,
                'is_active' => true, // Explicitly reactivate
                'device_model' => $info['device_model'] ?? $compatibleDevice->device_model,
                'device_serial' => $info['device_serial'] ?? $compatibleDevice->device_serial,
                'device_mac' => $info['device_mac'] ?? $compatibleDevice->device_mac,
                'last_activity' => Carbon::now(),
            ]);

            return [
                'allowed' => true,
                'device_id' => $deviceId,
                'existing_device' => $compatibleDevice->fresh(),
                'message' => 'Login from compatible device (updated fingerprint)',
            ];
        }

        // Check if user has ANY registered devices
        // Once a device is registered, it becomes the ONLY allowed device
        // If no devices exist (after reset), allow login from any device
        $registeredDevice = $user->devices()
            ->where('user_id', $user->id) // Explicit user scoping
            ->first();

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
                // CRITICAL: Include user-scoped compatible device ID
                $registeredDevice->update([
                    'device_id' => $deviceId,
                    'compatible_device_id' => $this->generateCompatibleDeviceId($request, $user->id),
                    'is_active' => true, // Explicitly reactivate
                    'ip_address' => $deviceInfo['ip_address'],
                    'user_agent' => $deviceInfo['user_agent'],
                    'device_model' => $deviceInfo['device_model'] ?? $registeredDevice->device_model,
                    'device_serial' => $deviceInfo['device_serial'] ?? $registeredDevice->device_serial,
                    'device_mac' => $deviceInfo['device_mac'] ?? $registeredDevice->device_mac,
                    'last_activity' => Carbon::now(),
                ]);

                return [
                    'allowed' => true,
                    'device_id' => $deviceId,
                    'existing_device' => $registeredDevice->fresh(),
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
     * CRITICAL: Ensures device operations are scoped to the current user only.
     */
    public function registerDevice(User $user, Request $request, string $sessionId): UserDevice
    {
        $deviceId = $this->generateDeviceId($request);
        $compatibleDeviceId = $this->generateCompatibleDeviceId($request, $user->id); // Include user_id
        $deviceInfo = $this->getDeviceInfo($request);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($user, $deviceId, $compatibleDeviceId, $sessionId, $deviceInfo) {
            // If single device login is enabled, remove all other devices first
            // CRITICAL: Only delete devices belonging to THIS user
            if ($user->hasSingleDeviceLoginEnabled()) {
                // Delete all existing devices for this user to enforce single device policy
                $user->devices()
                    ->where('user_id', $user->id) // Explicit user scoping
                    ->delete();
            }

            // Use updateOrCreate to handle potential race conditions
            // CRITICAL: Ensure we only update devices that belong to this user
            $device = $user->devices()->updateOrCreate(
                [
                    'device_id' => $deviceId,
                    'user_id' => $user->id, // Explicit user scoping in match condition
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

            // Update user_sessions table with the regenerated session ID
            \Illuminate\Support\Facades\DB::table('user_sessions')
                ->where('user_id', $user->id)
                ->where('session_id', $sessionId)
                ->update([
                    'updated_at' => Carbon::now(),
                ]);

            return $device;
        });
    }

    /**
     * Update device activity.
     * CRITICAL: All device lookups are scoped to user_id to prevent cross-account device reassignment.
     */
    public function updateDeviceActivity(User $user, Request $request, ?string $sessionId = null): void
    {
        $deviceId = $this->generateDeviceId($request);
        $compatibleDeviceId = $this->generateCompatibleDeviceId($request, $user->id); // Include user_id

        // First try to find by exact device ID
        // CRITICAL: Scope to current user
        $device = $user->devices()
            ->where('device_id', $deviceId)
            ->where('user_id', $user->id) // Explicit user scoping
            ->active()
            ->first();

        // If not found, try to find by compatible device ID
        if (! $device) {
            $device = $user->devices()
                ->where('compatible_device_id', $compatibleDeviceId)
                ->where('user_id', $user->id) // Explicit user scoping
                ->active()
                ->first();

            // Update the device ID if found through compatible ID
            // CRITICAL: Only update if device belongs to this user (already verified above)
            if ($device) {
                // Verify ownership one more time before updating
                if ($device->user_id !== $user->id) {
                    Log::warning('Device ownership mismatch in updateDeviceActivity', [
                        'user_id' => $user->id,
                        'device_owner_id' => $device->user_id,
                        'device_id' => $deviceId,
                    ]);

                    return;
                }

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
