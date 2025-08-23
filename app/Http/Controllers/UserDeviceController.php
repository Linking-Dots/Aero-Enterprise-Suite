<?php

namespace App\Http\Controllers;

use App\Models\User;
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

        // Load the current device relationship and other needed data
        $user->load('currentDevice', 'department', 'roles');

        $devices = $user->devices()
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_name' => $device->device_name,
                    'user_agent' => $device->user_agent,
                    'ip_address' => $device->ip_address,
                    'location' => $device->location,
                    'last_seen_at' => $device->last_activity,
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
                'phone' => $user->phone ?? null,
                'profile_image_url' => $user->profile_image_url ?? null,
                'department' => $user->department ? [
                    'id' => $user->department->id,
                    'name' => $user->department->name,
                    'code' => $user->department->code ?? null,
                ] : null,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                    ];
                }),
                'created_at' => $user->created_at,
                'single_device_login' => $user->single_device_login,
                'active_device' => $user->currentDevice ? [
                    'id' => $user->currentDevice->id,
                    'device_name' => $user->currentDevice->device_name,
                    'last_seen_at' => $user->currentDevice->last_activity,
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

        // Load the current device relationship and other needed data
        $user->load('currentDevice', 'department', 'roles');

        $devices = $user->devices()
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_name' => $device->device_name,
                    'user_agent' => $device->user_agent,
                    'ip_address' => $device->ip_address,
                    'location' => $device->location,
                    'last_seen_at' => $device->last_activity,
                    'is_active' => $device->is_active,
                    'created_at' => $device->created_at,
                ];
            });

        return response()->json([
            'devices' => $devices,
            'count' => $devices->count(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'profile_image_url' => $user->profile_image_url ?? null,
                'department' => $user->department ? [
                    'id' => $user->department->id,
                    'name' => $user->department->name,
                    'code' => $user->department->code ?? null,
                ] : null,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                    ];
                }),
                'created_at' => $user->created_at,
                'single_device_login' => $user->single_device_login,
                'active_device' => $user->currentDevice ? [
                    'id' => $user->currentDevice->id,
                    'device_name' => $user->currentDevice->device_name,
                    'last_seen_at' => $user->currentDevice->last_activity,
                ] : null,
            ],
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

        // Reload the user with current device relationship to get updated state
        $user->load('currentDevice');

        return response()->json([
            'success' => true,
            'message' => __('device.single_device_login.'.($enabled ? 'enabled' : 'disabled')),
            'user' => [
                'id' => $user->id,
                'single_device_login' => $user->single_device_login,
                'active_device' => $user->currentDevice ? [
                    'id' => $user->currentDevice->id,
                    'device_name' => $user->currentDevice->device_name,
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
            'message' => __('device.device_reset.success'),
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
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_name' => $device->device_name,
                    'user_agent' => $device->user_agent,
                    'ip_address' => $device->ip_address,
                    'location' => $device->location,
                    'last_seen_at' => $device->last_activity,
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

    /**
     * API: Force logout a specific device
     */
    public function forceLogoutDevice(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'device_id' => 'required|exists:user_devices,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $this->authorize('update', $user); // Ensure admin permissions

        $device = $user->devices()->findOrFail($request->device_id);

        // Deactivate the device
        $device->deactivate();

        return response()->json([
            'success' => true,
            'message' => __('device.device_logout.success'),
            'device' => [
                'id' => $device->id,
                'device_name' => $device->device_name,
                'is_active' => false,
            ],
        ]);
    }
}
