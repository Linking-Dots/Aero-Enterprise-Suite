<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ValidateUserSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Additional session validation - reject if session is invalid
        if ($user && ! $request->session()->has('login_web_'.sha1(get_class($user)))) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Redirect to login for web requests
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Session expired'], 401);
            }

            return redirect()->route('login')->with('message', 'Your session has expired. Please log in again.');
        }

        return $next($request);
    }
}
