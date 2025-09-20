<?php

namespace App\Console\Commands;

use App\Models\CompanyProfile;
use App\Models\Module;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateTestTenant extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:create-tenant {slug=test-tenant}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test tenant to verify registration process';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $slug = $this->argument('slug');
        
        $this->info("Creating test tenant: {$slug}");
        
        // Check if tenant already exists
        if (Tenant::where('id', $slug)->exists()) {
            $this->error("Tenant {$slug} already exists!");
            return 1;
        }
        
        try {
            DB::beginTransaction();
            
            // Simulate the registration data
            $data = [
                'companyName' => 'Test Company',
                'companySlug' => $slug,
                'contactEmail' => 'admin@' . $slug . '.com',
                'contactPhone' => '+1-555-0123',
                'industry' => 'Technology',
                'companySize' => '10-50',
                'website' => 'https://' . $slug . '.com',
                'description' => 'A test company for multi-tenant registration',
                'selectedPlan' => 1, // Starter plan
                'selectedModules' => [1, 2], // HR Management, Attendance
                'billingCycle' => 'monthly',
                'adminName' => 'Test Admin',
                'adminEmail' => 'admin@' . $slug . '.com',
                'timezone' => 'UTC',
            ];
            
            $this->info('Creating tenant...');
            
            // Create tenant
            $tenant = Tenant::create([
                'id' => $data['companySlug'],
                'tenancy_db_name' => 'tenant_' . $data['companySlug'],
                'tenancy_db_username' => 'tenant_' . $data['companySlug'],
                'tenancy_db_password' => Str::random(32),
            ]);
            
            $this->info('Creating company profile...');
            
            // Create company profile
            $companyProfile = CompanyProfile::create([
                'tenant_id' => $tenant->id,
                'company_name' => $data['companyName'],
                'contact_email' => $data['contactEmail'],
                'contact_phone' => $data['contactPhone'],
                'industry' => $data['industry'],
                'company_size' => $data['companySize'],
                'website' => $data['website'],
                'description' => $data['description'],
                'timezone' => $data['timezone'],
            ]);
            
            $this->info('Setting up subscription...');
            
            // Get subscription plan and calculate pricing
            $subscriptionPlan = SubscriptionPlan::find($data['selectedPlan']);
            $modules = Module::whereIn('id', $data['selectedModules'])->get();
            
            // Calculate total price (simplified)
            $totalPrice = $data['billingCycle'] === 'monthly' 
                ? $subscriptionPlan->base_monthly_price 
                : $subscriptionPlan->base_yearly_price;
            
            // Create tenant subscription
            $subscription = TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'subscription_plan_id' => $subscriptionPlan->id,
                'billing_cycle' => $data['billingCycle'],
                'total_price' => $totalPrice,
                'starts_at' => now(),
                'ends_at' => $data['billingCycle'] === 'monthly'
                    ? now()->addMonth()
                    : now()->addYear(),
                'status' => 'trial',
                'trial_ends_at' => now()->addDays(14),
            ]);
            
            $this->info('Creating admin user in tenant database...');
            
            // Initialize tenant database and create admin user
            $tenant->run(function () use ($data, $tenant) {
                // Create admin user in tenant database
                $adminUser = User::create([
                    'name' => $data['adminName'],
                    'email' => $data['adminEmail'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_admin' => true,
                    'tenant_id' => $tenant->id,
                ]);
                
                // Run tenant-specific migrations
                Artisan::call('migrate', ['--force' => true]);
                
                return $adminUser;
            });
            
            DB::commit();
            
            $this->info('✅ Test tenant created successfully!');
            $this->info("Tenant ID: {$tenant->id}");
            $this->info("Company: {$companyProfile->company_name}");
            $this->info("Plan: {$subscriptionPlan->name} ({$data['billingCycle']})");
            $this->info("Admin Email: {$data['adminEmail']}");
            $this->info("Admin Password: password");
            
            return 0;
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to create tenant: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }
    }
}
