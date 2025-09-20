<?php

namespace App\Console\Commands;

use App\Models\Module;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Illuminate\Console\Command;

class TestRegistration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:registration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test registration system components';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Testing Registration System ===');
        
        // Check models and data
        $planCount = SubscriptionPlan::count();
        $moduleCount = Module::count();
        $tenantCount = Tenant::count();
        
        $this->info("Subscription Plans: {$planCount}");
        $this->info("Modules: {$moduleCount}");
        $this->info("Existing Tenants: {$tenantCount}");
        
        if ($planCount > 0) {
            $plan = SubscriptionPlan::with('modules')->first();
            $this->info("First plan: {$plan->name} with {$plan->modules->count()} modules");
        }
        
        // Test slug availability
        $testSlug = 'test-company-' . time();
        $slugExists = Tenant::where('id', $testSlug)->exists();
        $this->info("Test slug '{$testSlug}' available: " . ($slugExists ? 'No' : 'Yes'));
        
        $this->info('=== Registration system ready for testing ===');
        
        return 0;
    }
}
