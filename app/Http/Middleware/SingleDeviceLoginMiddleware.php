<?php

namespace App\Http\Middleware;

use App\Services\DeviceTrackingService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SingleDeviceLoginMiddleware
{
    protected DeviceTrackingService $deviceService;

    public function __construct(DeviceTrackingService $deviceService)
    {
        $this->deviceService = $deviceService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip login route to avoid interference with authentication
        if ($request->routeIs('login')) {
            return $next($request);
        }

        // Only apply to authenticated users
        if (! Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // Skip if single device login is not enabled for this user
        if (! $user->hasSingleDeviceLoginEnabled()) {
            return $next($request);
        }

        // Update device activity for current session
        $sessionId = $request->session()->getId();
        $this->deviceService->updateDeviceActivity($user, $request, $sessionId);

        // Check if current device is valid
        $deviceCheck = $this->deviceService->canUserLoginFromDevice($user, $request);

        if (! $deviceCheck['allowed']) {
            // Log out user and redirect to login with message
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Use Inertia for SPA consistency
            return redirect()->route('login')->with([
                'device_blocked' => true,
                'device_message' => $deviceCheck['message'],
                'blocked_device_info' => $deviceCheck['blocked_by_device'] ? [
                    'device_name' => $deviceCheck['blocked_by_device']->device_name,
                    'browser' => $deviceCheck['blocked_by_device']->browser_name,
                    'browser_version' => $deviceCheck['blocked_by_device']->browser_version,
                    'platform' => $deviceCheck['blocked_by_device']->platform,
                    'device_type' => $deviceCheck['blocked_by_device']->device_type,
                    'ip_address' => $deviceCheck['blocked_by_device']->ip_address,
                    'last_activity' => $deviceCheck['blocked_by_device']->last_activity,
                ] : null,
            ]);
        }

        return $next($request);
    }
}
