<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
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
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Only fetch detailed user data if session is valid and user is properly authenticated
        $userWithDesignation = null;
        $isAuthenticated = $user && $request->hasSession() && $request->session()->isStarted();

        if ($isAuthenticated) {
            $userWithDesignation = \App\Models\User::with('designation')->find($user->id);
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
