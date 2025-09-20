<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
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
Route::middleware(['web', 'central-domain'])->group(function () {

    // Landing page and marketing routes
    Route::get('/', function () {
        return inertia('Central/Landing', [
            'app_name' => config('app.name'),
            'app_version' => config('app.version'),
        ]);
    })->name('central.home');

    // Tenant registration and management routes
    Route::get('/register-tenant', function () {
        return inertia('Central/TenantRegistration');
    })->name('central.tenant.register');

    Route::post('/register-tenant', function () {
        // Tenant registration logic will be implemented later
        // This will create new tenant and redirect to their domain
    })->name('central.tenant.store');

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
    Route::prefix('admin')->middleware(['auth', 'super-admin'])->name('central.admin.')->group(function () {
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
});
