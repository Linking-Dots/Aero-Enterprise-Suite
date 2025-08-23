<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Jenssegers\Agent\Agent;
use Carbon\Carbon;

class DeviceTrackingService
{
    protected Agent $agent;

    public function __construct()
    {
        $this->agent = new Agent();
    }

    /**
     * Generate a unique device identifier based on request data.
     */
    public function generateDeviceId(Request $request): string
    {
        $userAgent = $request->userAgent() ?? '';
        $ip = $request->ip() ?? '';
        
        // Create a more stable device fingerprint
        $fingerprint = [
            'user_agent' => $userAgent,
            'accept_language' => $request->header('Accept-Language', ''),
            'accept_encoding' => $request->header('Accept-Encoding', ''),
        ];

        $fingerprintString = json_encode($fingerprint);
        
        return hash('sha256', $fingerprintString . $ip);
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
        if (!$user->hasSingleDeviceLoginEnabled()) {
            return [
                'allowed' => true,
                'device_id' => $deviceId,
                'message' => 'Login allowed',
            ];
        }

        // Check if this device is already registered and active
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

        // Check if user has any active devices
        $activeDevice = $user->activeDevices()->first();

        if ($activeDevice) {
            return [
                'allowed' => false,
                'device_id' => $deviceId,
                'blocked_by_device' => $activeDevice,
                'message' => 'Login blocked: Account is active on another device',
            ];
        }

        // No active devices, allow login (first time or after reset)
        return [
            'allowed' => true,
            'device_id' => $deviceId,
            'message' => 'Login allowed: No active devices found',
        ];
    }

    /**
     * Register a new device for the user.
     */
    public function registerDevice(User $user, Request $request, string $sessionId): UserDevice
    {
        $deviceId = $this->generateDeviceId($request);
        $deviceInfo = $this->getDeviceInfo($request);

        // Check if device already exists
        $device = $user->devices()->where('device_id', $deviceId)->first();

        if ($device) {
            // Update existing device
            $device->update([
                'session_id' => $sessionId,
                'last_activity' => Carbon::now(),
                'is_active' => true,
                'ip_address' => $deviceInfo['ip_address'],
                'device_fingerprint' => $deviceInfo['device_fingerprint'],
            ]);
        } else {
            // Create new device
            $device = $user->devices()->create([
                'device_id' => $deviceId,
                'session_id' => $sessionId,
                'last_activity' => Carbon::now(),
                'is_active' => true,
                ...$deviceInfo,
            ]);
        }

        return $device;
    }

    /**
     * Update device activity.
     */
    public function updateDeviceActivity(User $user, Request $request, string $sessionId = null): void
    {
        $deviceId = $this->generateDeviceId($request);
        
        $device = $user->devices()
            ->where('device_id', $deviceId)
            ->active()
            ->first();

        if ($device) {
            $device->updateActivity($sessionId);
        }
    }

    /**
     * Deactivate device by session ID.
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
