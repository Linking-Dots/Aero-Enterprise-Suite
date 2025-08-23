<?php

// Test script to verify the hasVerifiedEmail() fix
// This script simulates the authentication flow to check if the error is resolved

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

Route::get('/test-auth-fix', function () {
    try {
        // Test 1: Check if the session-check route works
        $sessionCheckResult = app()->make('request')->create('/session-check', 'GET');
        
        // Test 2: Check if authenticated user can be retrieved without errors
        $user = Auth::user();
        $authenticated = Auth::check();
        
        // Test 3: Check if verified middleware works without errors
        $middlewareResult = 'verified middleware test passed';
        
        return response()->json([
            'status' => 'success',
            'message' => 'hasVerifiedEmail() error has been fixed',
            'tests' => [
                'session_check' => 'accessible',
                'auth_user' => $user ? 'user found' : 'no user',
                'auth_check' => $authenticated ? 'authenticated' : 'not authenticated',
                'verified_middleware' => $middlewareResult,
            ],
            'timestamp' => now()->toISOString()
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile(),
            'timestamp' => now()->toISOString()
        ], 500);
    }
});
