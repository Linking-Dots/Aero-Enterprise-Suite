<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\DeviceTrackingService;
use App\Services\ModernAuthenticationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    protected ModernAuthenticationService $authService;

    protected DeviceTrackingService $deviceService;

    public function __construct(
        ModernAuthenticationService $authService,
        DeviceTrackingService $deviceService
    ) {
        $this->authService = $authService;
        $this->deviceService = $deviceService;
    }

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => true,
            'status' => session('status'),
            'deviceBlocked' => session('device_blocked', false),
            'deviceMessage' => session('device_message'),
            'blockedDeviceInfo' => session('blocked_device_info'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        $email = $request->email;
        $password = $request->password;
        $remember = $request->boolean('remember');

        // Check rate limiting
        $key = 'login.'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            $this->authService->logAuthenticationEvent(
                null,
                'login_rate_limited',
                'failure',
                $request,
                ['email' => $email, 'retry_after' => $seconds]
            );

            throw ValidationException::withMessages([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        // Check if account is locked
        if ($this->authService->isAccountLocked($email)) {
            $this->authService->logAuthenticationEvent(
                null,
                'login_account_locked',
                'failure',
                $request,
                ['email' => $email]
            );

            throw ValidationException::withMessages([
                'email' => 'This account has been temporarily locked due to multiple failed login attempts.',
            ]);
        }

        // Find user
        $user = User::where('email', $email)->first();

        // Validate credentials
        if (! $user || ! Hash::check($password, $user->password)) {
            RateLimiter::hit($key, 60); // 1 minute decay

            $this->authService->recordFailedAttempt(
                $email,
                $request,
                $user ? 'invalid_password' : 'invalid_email'
            );

            $this->authService->logAuthenticationEvent(
                $user,
                'login_failed',
                'failure',
                $request,
                ['email' => $email, 'reason' => 'invalid_credentials']
            );

            throw ValidationException::withMessages([
                'email' => 'The provided credentials are incorrect.',
            ]);
        }

        // Check if user account is active
        if (! $user->active) {
            $this->authService->logAuthenticationEvent(
                $user,
                'login_inactive_account',
                'failure',
                $request
            );

            throw ValidationException::withMessages([
                'email' => 'This account has been deactivated. Please contact your administrator.',
            ]);
        }

        // Check device restrictions if single device login is enabled
        if ($user->hasSingleDeviceLoginEnabled()) {
            $deviceCheck = $this->deviceService->canUserLoginFromDevice($user, $request);

            if (! $deviceCheck['allowed']) {
                $this->authService->logAuthenticationEvent(
                    $user,
                    'login_device_blocked',
                    'failure',
                    $request,
                    [
                        'device_id' => $deviceCheck['device_id'],
                        'blocked_by_device' => $deviceCheck['blocked_by_device']?->id,
                        'message' => $deviceCheck['message'],
                    ]
                );

                // Return JSON response for device blocking (no re-rendering)
                return response()->json([
                    'device_blocked' => true,
                    'device_message' => $deviceCheck['message'],
                    'blocked_device_info' => $deviceCheck['blocked_by_device'] ? [
                        'device_name' => $deviceCheck['blocked_by_device']->device_name,
                        'browser' => $deviceCheck['blocked_by_device']->browser_name,
                        'browser_version' => $deviceCheck['blocked_by_device']->browser_version,
                        'platform' => $deviceCheck['blocked_by_device']->platform,
                        'device_type' => $deviceCheck['blocked_by_device']->device_type,
                        'ip_address' => $deviceCheck['blocked_by_device']->ip_address,
                        'last_activity' => $deviceCheck['blocked_by_device']->last_activity ? 
                            $deviceCheck['blocked_by_device']->last_activity->format('M j, Y g:i A') : null,
                    ] : null,
                ], 422); // Unprocessable Entity status
            }
        }

        // Clear rate limiting on successful login
        RateLimiter::clear($key);

        // Login user
        Auth::login($user, $remember);

        // Register/update device if single device login is enabled
        if ($user->hasSingleDeviceLoginEnabled()) {
            $sessionId = $request->session()->getId();
            $this->deviceService->registerDevice($user, $request, $sessionId);
        }

        // Update login statistics
        $this->authService->updateLoginStats($user, $request);

        // Track session
        $this->authService->trackUserSession($user, $request);

        // Log successful login
        $this->authService->logAuthenticationEvent(
            $user,
            'login_success',
            'success',
            $request
        );

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            // Deactivate current device session
            $sessionId = session()->getId();
            $this->deviceService->deactivateDeviceBySession($sessionId);

            // Log logout event
            $this->authService->logAuthenticationEvent(
                $user,
                'logout',
                'success',
                $request
            );

            // Update session tracking
            DB::table('user_sessions')
                ->where('session_id', $sessionId)
                ->update([
                    'is_current' => false,
                    'updated_at' => now(),
                ]);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
