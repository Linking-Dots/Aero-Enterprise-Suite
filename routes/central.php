<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Central\Admin\SubscriptionManagementController;
use App\Http\Controllers\Central\TenantRegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central Application Routes
|--------------------------------------------------------------------------
|
| Here you can register routes for your central application. These routes
| are loaded by the RouteServiceProvider. These routes are for tenant
| management, billing, landing pages, and other central functionality.
|
*/

// Central routes - accessible only from central domains
// Note: Middleware is applied in RouteServiceProvider

// Test route
Route::get('/test-central', function () {
    return 'Central route working!';
});

// Landing page and marketing routes
Route::get('/', function () {
    return inertia('Central/Landing', [
        'app_name' => config('app.name'),
        'app_version' => config('app.version'),
    ]);
})->name('central.home');

    // Tenant registration and management routes
    Route::get('/register-tenant', [TenantRegistrationController::class, 'index'])->name('central.tenant.register');
    Route::post('/register-tenant', [TenantRegistrationController::class, 'store'])->name('central.tenant.store');
    Route::get('/tenant/{tenant}/welcome', [TenantRegistrationController::class, 'welcome'])->name('tenant.welcome');

    // Slug availability check
    Route::get('/check-slug-availability', [TenantRegistrationController::class, 'checkSlugAvailability'])->name('central.tenant.check-slug');

    // Tenant login/selection for existing users
    Route::get('/tenant-login', function () {
        return inertia('Central/TenantLogin');
    })->name('central.tenant.login');

    // Billing and subscription management (for future implementation)
    Route::prefix('billing')->name('central.billing.')->group(function () {
        Route::get('/', function () {
            return inertia('Central/Billing/Dashboard');
        })->name('dashboard');

        Route::get('/plans', function () {
            return inertia('Central/Billing/Plans');
        })->name('plans');
    });

    // Super admin routes for managing all tenants
    Route::prefix('admin')->middleware(['auth', 'super-admin'])->name('admin.')->group(function () {
        // Subscription Management
        Route::get('/subscription-management', [SubscriptionManagementController::class, 'index'])->name('subscription.management');

        // Subscription Plans
        Route::post('/subscription-plans', [SubscriptionManagementController::class, 'storePlan'])->name('subscription-plans.store');
        Route::put('/subscription-plans/{plan}', [SubscriptionManagementController::class, 'updatePlan'])->name('subscription-plans.update');
        Route::delete('/subscription-plans/{plan}', [SubscriptionManagementController::class, 'destroyPlan'])->name('subscription-plans.destroy');

        // Modules
        Route::post('/modules', [SubscriptionManagementController::class, 'storeModule'])->name('modules.store');
        Route::put('/modules/{module}', [SubscriptionManagementController::class, 'updateModule'])->name('modules.update');
        Route::delete('/modules/{module}', [SubscriptionManagementController::class, 'destroyModule'])->name('modules.destroy');

        // Other admin routes
        Route::get('/tenants', function () {
            return inertia('Central/Admin/Tenants');
        })->name('tenants');

        Route::get('/system-health', function () {
            return inertia('Central/Admin/SystemHealth');
        })->name('system.health');
    });

    // Include auth routes for central app with specific names
    Route::get('central-login', [LoginController::class, 'create'])->name('central.login');
    Route::post('central-login', [LoginController::class, 'store'])->name('central.login.store');
    Route::get('central-register', [RegisterController::class, 'create'])->name('central.register');
    Route::post('central-register', [RegisterController::class, 'store'])->name('central.register.store');
    Route::post('central-logout', [LoginController::class, 'destroy'])->name('central.logout');
