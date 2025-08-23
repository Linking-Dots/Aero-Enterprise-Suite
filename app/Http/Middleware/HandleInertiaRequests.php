<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // For protected routes, ensure user is authenticated before processing Inertia
        if ($this->isProtectedRoute($request)) {
            if (! Auth::check() || ! $request->user()) {
                // Redirect unauthenticated users to login
                return redirect()->route('login');
            }
        }

        return parent::handle($request, $next);
    }

    /**
     * Check if the current route requires authentication
     */
    protected function isProtectedRoute(Request $request): bool
    {
        $path = $request->path();

        // List of routes that require authentication
        $protectedPaths = [
            'dashboard',
            'stats',
            'updates',
            'leaves-employee',
            'attendance-employee',
            'security/dashboard',
            'admin',
            'hr',
            'crm',
            'fms',
            'ims',
            'pos',
            'lms',
            'project-management',
            'quality',
            'compliance',
            'dms',
            'analytics',
        ];

        // Check if current path starts with any protected path
        foreach ($protectedPaths as $protectedPath) {
            if (str_starts_with($path, $protectedPath)) {
                return true;
            }
        }

        // Also check if the route has auth middleware
        $route = $request->route();
        if ($route) {
            $middleware = $route->middleware();

            return in_array('auth', $middleware) || in_array('auth:web', $middleware);
        }

        return false;
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Strict authentication validation - multiple checks to ensure user is truly authenticated
        $userWithDesignation = null;
        $isAuthenticated = $user &&
                          $request->hasSession() &&
                          $request->session()->isStarted() &&
                          Auth::check() &&
                          Auth::id() === $user->id &&
                          $request->session()->has('login_web_'.sha1('web'));

        if ($isAuthenticated) {
            // Double-check user exists in database and is active
            $userWithDesignation = \App\Models\User::where('id', $user->id)->first();
            if (! $userWithDesignation) {
                $isAuthenticated = false;
            }
        }

        // Get company settings for global use
        $companySettings = CompanySetting::first();
        $companyName = $companySettings?->companyName ?? config('app.name', 'DBEDC ERP');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $isAuthenticated ? $userWithDesignation : null,
                'roles' => $isAuthenticated && $user ? $user->roles->pluck('name')->toArray() : [],
                'permissions' => $isAuthenticated && $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
                'designation' => $isAuthenticated ? $userWithDesignation?->designation?->title : null,
                'check' => $isAuthenticated, // Explicit authentication status
            ],

            // Company Settings
            'companySettings' => $companySettings,

            // Theme and UI Configuration
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => 'pattern-1',
                'darkMode' => false,
                'animations' => true,
            ],

            // Application Configuration
            'app' => [
                'name' => $companyName,
                'version' => config('app.version', '1.0.0'),
                'debug' => config('app.debug', false),
                'environment' => config('app.env', 'production'),
            ],

            'url' => $request->getPathInfo(),
            'csrfToken' => session('csrfToken'),
        ];
    }
}
