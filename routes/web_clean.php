<?php

/*
|--------------------------------------------------------------------------
| Web Routes (Minimal - Most routes moved to tenant.php)
|--------------------------------------------------------------------------
|
| These routes are for basic functionality. Most operational routes have
| been moved to routes/tenant.php for multi-tenant access. This file now
| contains only essential routes that should be available everywhere.
|
*/

use Illuminate\Support\Facades\Route;

// Simple health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Simple session check for SPAs
Route::get('/session-check', function () {
    return response()->json(['authenticated' => auth()->check()]);
});

// CSRF token for frontend
Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Temporary fallback - will be updated once tenant routing is complete
Route::fallback(function () {
    return response()->json([
        'message' => 'This route may have been moved to tenant-specific routing.',
        'central_domains' => config('tenancy.central_domains'),
        'current_domain' => request()->getHost(),
    ], 404);
});
