<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserDevice;
use App\Services\DeviceTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserDeviceController extends Controller
{
    protected DeviceTrackingService $deviceService;

    public function __construct(DeviceTrackingService $deviceService)
    {
        $this->deviceService = $deviceService;
    }

    /**
     * Admin: Show device management page for a specific user
     */
    public function show(User $user)
    {
        $this->authorize('viewAny', User::class); // Ensure admin permissions

        $devices = $user->devices()
            ->orderBy('last_seen_at', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_name' => $device->device_name,
                    'user_agent' => $device->user_agent,
                    'ip_address' => $device->ip_address,
                    'location' => $device->location,
                    'last_seen_at' => $device->last_seen_at,
                    'is_active' => $device->is_active,
                    'created_at' => $device->created_at,
                ];
            });

        return Inertia::render('UserDeviceManagement', [
            'title' => "Device Management - {$user->name}",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'single_device_login' => $user->single_device_login,
                'active_device' => $user->activeDevice ? [
                    'id' => $user->activeDevice->id,
                    'device_name' => $user->activeDevice->device_name,
                    'last_seen_at' => $user->activeDevice->last_seen_at,
                ] : null,
            ],
            'devices' => $devices,
        ]);
    }

    /**
     * API: Get devices list for a user
     */
    public function list(User $user)
    {
        $this->authorize('viewAny', User::class); // Ensure admin permissions

        $devices = $user->devices()
            ->orderBy('last_seen_at', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_name' => $device->device_name,
                    'user_agent' => $device->user_agent,
                    'ip_address' => $device->ip_address,
                    'location' => $device->location,
                    'last_seen_at' => $device->last_seen_at,
                    'is_active' => $device->is_active,
                    'created_at' => $device->created_at,
                ];
            });

        return response()->json([
            'devices' => $devices,
            'count' => $devices->count(),
        ]);
    }

    /**
     * API: Toggle single device login for a user
     */
    public function toggleSingleDeviceLogin(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'enabled' => 'required|boolean',
        ]);

        $user = User::findOrFail($request->user_id);
        $this->authorize('update', $user); // Ensure admin permissions

        $enabled = $request->boolean('enabled');

        if ($enabled) {
            $user->enableSingleDeviceLogin();
        } else {
            $user->disableSingleDeviceLogin();
        }

        return response()->json([
            'success' => true,
            'message' => 'Single device login ' . ($enabled ? 'enabled' : 'disabled') . ' for user.',
            'user' => [
                'id' => $user->id,
                'single_device_login' => $user->single_device_login,
                'active_device' => $user->activeDevice ? [
                    'id' => $user->activeDevice->id,
                    'device_name' => $user->activeDevice->device_name,
                ] : null,
            ],
        ]);
    }

    /**
     * API: Reset user devices
     */
    public function resetUserDevices(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $this->authorize('update', $user); // Ensure admin permissions

        $user->resetDevices();

        return response()->json([
            'success' => true,
            'message' => 'User device has been reset. They can now login from a new device.',
            'user' => [
                'id' => $user->id,
                'single_device_login' => $user->single_device_login,
                'active_device' => null,
            ],
        ]);
    }

    /**
     * User: Display their own device information
     */
    public function userDevices()
    {
        $user = Auth::user();
        
        $devices = $user->devices()
            ->orderBy('last_seen_at', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_name' => $device->device_name,
                    'user_agent' => $device->user_agent,
                    'ip_address' => $device->ip_address,
                    'location' => $device->location,
                    'last_seen_at' => $device->last_seen_at,
                    'is_active' => $device->is_active,
                    'is_current' => $device->session_id === request()->session()->getId(),
                    'created_at' => $device->created_at,
                ];
            });

        return Inertia::render('Profile/UserDevices', [
            'title' => 'My Devices',
            'devices' => $devices,
            'deviceSummary' => [
                'total' => $devices->count(),
                'active' => $devices->where('is_active', true)->count(),
                'single_device_enabled' => $user->single_device_login,
            ],
        ]);
    }
}
