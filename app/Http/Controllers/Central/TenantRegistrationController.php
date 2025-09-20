<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use App\Models\Module;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class TenantRegistrationController extends Controller
{
    public function index()
    {
        $subscriptionPlans = SubscriptionPlan::with('modules')->where('is_active', true)->get();
        $modules = Module::where('is_active', true)->get();

        return Inertia::render('Central/TenantRegistration', [
            'subscriptionPlans' => $subscriptionPlans,
            'modules' => $modules,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Company Information
            'companyName' => 'required|string|max:255',
            'companySlug' => 'required|string|max:50|regex:/^[a-z0-9\-]+$/|unique:tenants,id',
            'contactEmail' => 'required|email|max:255',
            'contactPhone' => 'nullable|string|max:20',
            'industry' => 'required|string|max:100',
            'companySize' => 'required|string|max:20',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string|max:1000',

            // Plan Selection
            'selectedPlan' => 'required|exists:subscription_plans,id',
            'selectedModules' => 'required|array|min:1',
            'selectedModules.*' => 'exists:modules,id',
            'billingCycle' => 'required|in:monthly,yearly',

            // Admin Account
            'adminName' => 'required|string|max:255',
            'adminEmail' => 'required|email|max:255|unique:users,email',
            'password' => ['required', Password::defaults()],
            'passwordConfirmation' => 'required|same:password',

            // Preferences
            'timezone' => 'required|string|max:50',
            'agreeToTerms' => 'required|accepted',
        ], [
            'companySlug.unique' => 'This subdomain is already taken. Please choose another.',
            'companySlug.regex' => 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
            'selectedModules.min' => 'Please select at least one module.',
            'agreeToTerms.accepted' => 'You must agree to the terms and conditions.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        try {
            DB::beginTransaction();

            // Create tenant
            $tenant = Tenant::create([
                'id' => $request->companySlug,
                'tenancy_db_name' => 'tenant_'.$request->companySlug,
                'tenancy_db_username' => 'tenant_'.$request->companySlug,
                'tenancy_db_password' => Str::random(32),
            ]);

            // Create company profile
            $companyProfile = CompanyProfile::create([
                'tenant_id' => $tenant->id,
                'company_name' => $request->companyName,
                'contact_email' => $request->contactEmail,
                'contact_phone' => $request->contactPhone,
                'industry' => $request->industry,
                'company_size' => $request->companySize,
                'website' => $request->website,
                'description' => $request->description,
                'timezone' => $request->timezone,
                'is_active' => true,
            ]);

            // Get subscription plan and calculate pricing
            $subscriptionPlan = SubscriptionPlan::find($request->selectedPlan);
            $modules = Module::whereIn('id', $request->selectedModules)->get();

            $totalPrice = $this->calculateSubscriptionPrice(
                $subscriptionPlan,
                $modules,
                $request->billingCycle
            );

            // Create tenant subscription
            $subscription = TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'subscription_plan_id' => $subscriptionPlan->id,
                'billing_cycle' => $request->billingCycle,
                'total_price' => $totalPrice,
                'starts_at' => now(),
                'ends_at' => $request->billingCycle === 'monthly'
                    ? now()->addMonth()
                    : now()->addYear(),
                'status' => 'trial', // Start with trial period
                'trial_ends_at' => now()->addDays(14), // 14-day trial
            ]);

            // Attach selected modules to subscription
            foreach ($request->selectedModules as $moduleId) {
                $module = $modules->find($moduleId);
                if ($module) {
                    $price = $request->billingCycle === 'monthly'
                        ? $module->monthly_price
                        : $module->yearly_price;

                    // Apply plan discount if not included
                    $isIncluded = $subscriptionPlan->modules->contains($moduleId);
                    if (! $isIncluded && $subscriptionPlan->module_discount_percentage > 0) {
                        $price = $price * (1 - $subscriptionPlan->module_discount_percentage / 100);
                    }

                    $subscription->modules()->attach($moduleId, [
                        'price' => $isIncluded ? 0 : $price,
                        'is_included' => $isIncluded,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Initialize tenant database
            $tenant->run(function () use ($request, $tenant) {
                // Create admin user in tenant database
                $adminUser = User::create([
                    'name' => $request->adminName,
                    'email' => $request->adminEmail,
                    'password' => Hash::make($request->password),
                    'email_verified_at' => now(),
                    'is_admin' => true,
                    'tenant_id' => $tenant->id,
                ]);

                // Run tenant-specific migrations and seeders if needed
                Artisan::call('migrate', ['--force' => true]);

                // Assign admin role if using permissions
                if (class_exists(\Spatie\Permission\Models\Role::class)) {
                    $adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
                    $adminUser->assignRole($adminRole);
                }
            });

            DB::commit();

            // Send welcome email (optional)
            // Mail::to($request->adminEmail)->send(new WelcomeEmail($tenant, $companyProfile));

            return redirect()->route('tenant.welcome', ['tenant' => $tenant->id])
                ->with('success', 'Your company account has been created successfully! Welcome to Aero Enterprise Suite.');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Tenant registration failed: '.$e->getMessage(), [
                'request_data' => $request->except(['password', 'passwordConfirmation']),
                'error' => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'general' => 'There was an error creating your account. Please try again or contact support.',
            ]);
        }
    }

    public function checkSlugAvailability(Request $request)
    {
        $slug = $request->get('slug');

        if (! $slug || ! preg_match('/^[a-z0-9\-]+$/', $slug)) {
            return response()->json([
                'available' => false,
                'message' => 'Invalid subdomain format',
            ]);
        }

        $exists = Tenant::where('id', $slug)->exists();

        return response()->json([
            'available' => ! $exists,
            'message' => $exists ? 'This subdomain is already taken' : 'Subdomain is available',
        ]);
    }

    private function calculateSubscriptionPrice(SubscriptionPlan $plan, $modules, string $billingCycle): float
    {
        $basePrice = $billingCycle === 'monthly'
            ? $plan->base_monthly_price
            : $plan->base_yearly_price;

        $modulePrice = 0;

        foreach ($modules as $module) {
            // Skip if module is included in plan
            if ($plan->modules->contains($module->id)) {
                continue;
            }

            $price = $billingCycle === 'monthly'
                ? $module->monthly_price
                : $module->yearly_price;

            // Apply plan discount
            if ($plan->module_discount_percentage > 0) {
                $price = $price * (1 - $plan->module_discount_percentage / 100);
            }

            $modulePrice += $price;
        }

        return $basePrice + $modulePrice;
    }

    public function welcome(Tenant $tenant)
    {
        $companyProfile = CompanyProfile::where('tenant_id', $tenant->id)->first();
        $subscription = TenantSubscription::where('tenant_id', $tenant->id)
            ->with(['plan', 'modules'])
            ->latest()
            ->first();

        return Inertia::render('Central/TenantWelcome', [
            'tenant' => $tenant,
            'company' => $companyProfile,
            'subscription' => $subscription,
        ]);
    }
}
