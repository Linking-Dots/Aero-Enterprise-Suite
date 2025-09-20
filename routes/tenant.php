<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
// Import all controllers needed for tenant operations
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider and are
| automatically tenant-aware. All the enterprise module functionality
| is available within each tenant's context.
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    // Include authentication routes for tenants with specific names
    Route::get('login', [LoginController::class, 'create'])->name('tenant.login');
    Route::post('login', [LoginController::class, 'store'])->name('tenant.login.store');
    Route::get('register', [RegisterController::class, 'create'])->name('tenant.register');
    Route::post('register', [RegisterController::class, 'store'])->name('tenant.register.store');
    Route::post('logout', [LoginController::class, 'destroy'])->name('tenant.logout');

    // Tenant dashboard homepage - only for tenant domains
    // Central domains should show landing page instead
    // Route::redirect('/', '/dashboard');

    // Test route to verify tenant context
    Route::get('/tenant-info', function () {
        $tenant = tenant();

        return response()->json([
            'tenant_id' => $tenant ? $tenant->id : null,
            'tenant_data' => $tenant ? $tenant->data : null,
            'database' => config('database.connections.tenant.database'),
            'domain' => request()->getHost(),
        ]);
    })->name('tenant.info');

    // Utility routes
    Route::get('/session-check', function () {
        return response()->json(['authenticated' => auth()->check()]);
    });

    Route::get('/csrf-token', function () {
        return response()->json(['csrf_token' => csrf_token()]);
    });

    // Conditionally apply single_device middleware only if the class exists
    $middlewareStack = ['auth', 'verified'];
    if (class_exists('\App\Http\Middleware\SingleDeviceLoginMiddleware')) {
        $middlewareStack[] = \App\Http\Middleware\SingleDeviceLoginMiddleware::class;
    }

    Route::middleware($middlewareStack)->group(function () {

        // CORE MODULE - Dashboard routes
        Route::middleware(['permission:core.dashboard.view'])->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::get('/stats', [DashboardController::class, 'stats'])->name('stats');
        });

        // Security Dashboard route
        Route::get('/security/dashboard', function () {
            return inertia('Security/Dashboard');
        })->name('security.dashboard');

        // Updates route
        Route::middleware(['permission:core.updates.view'])->get('/updates', [DashboardController::class, 'updates'])->name('updates');

        // All other tenant-specific routes will be added here...
        // This is a placeholder for now - we'll move the complete routes in the next step

    });
});
