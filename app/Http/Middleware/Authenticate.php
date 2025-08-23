<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For Inertia requests, return null to trigger the proper authentication error
        if ($request->expectsJson() || $request->hasHeader('X-Inertia')) {
            return null;
        }

        return route('login');
    }

    /**
     * Handle an unauthenticated user.
     */
    protected function unauthenticated($request, array $guards)
    {
        // For Inertia requests, redirect to login instead of returning JSON
        if ($request->hasHeader('X-Inertia')) {
            return redirect()->route('login');
        }

        return parent::unauthenticated($request, $guards);
    }
}
