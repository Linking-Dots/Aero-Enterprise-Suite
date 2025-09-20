<?php

/*
|--------------------------------------------------------------------------
| Web Routes (Central App Only)
|--------------------------------------------------------------------------
|
| These routes are for the central application functionality that should
| not be tenant-specific. Most operational routes have been moved to
| routes/tenant.php for multi-tenant access.
|
*/

use Illuminate\Support\Facades\Route;

// Simple health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// API documentation route (could be central)
Route::get('/api/docs', function () {
    return view('api.docs');
})->name('api.docs');

// Temporary fallback - will be removed once all routes are properly organized
Route::fallback(function () {
    return response()->json([
        'message' => 'Route not found. Please check if you are accessing the correct domain.',
        'tenant_domains' => 'Tenant-specific routes should be accessed via tenant domains.',
        'central_domains' => config('tenancy.central_domains'),
    ], 404);
});
