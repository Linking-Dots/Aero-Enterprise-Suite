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
        // Only apply to authenticated users
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();
        
        // Skip if single device login is not enabled for this user
        if (!$user->hasSingleDeviceLoginEnabled()) {
            return $next($request);
        }

        // Update device activity for current session
        $sessionId = $request->session()->getId();
        $this->deviceService->updateDeviceActivity($user, $request, $sessionId);

        // Check if current device is valid
        $deviceCheck = $this->deviceService->canUserLoginFromDevice($user, $request);
        
        if (!$deviceCheck['allowed']) {
            // Log out user and redirect to login with message
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with([
                'device_blocked' => true,
                'device_message' => $deviceCheck['message'],
                'blocked_device_info' => $deviceCheck['blocked_by_device']?->formatted_device_info ?? 'Unknown Device',
            ]);
        }

        return $next($request);
    }
}
