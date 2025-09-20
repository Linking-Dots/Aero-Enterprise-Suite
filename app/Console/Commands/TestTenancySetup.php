<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class TestTenancySetup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenancy:test-setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the basic tenancy setup';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Multi-Tenant Setup for Aero Enterprise Suite');
        $this->newLine();

        try {
            // Test 1: Check if Tenant model works
            $this->info('1. Testing Tenant model...');
            $tenantCount = Tenant::count();
            $this->info("   Current tenant count: {$tenantCount}");

            // Test 2: Create a test tenant
            $this->info('2. Creating test tenant...');
            $testTenant = Tenant::create([
                'id' => 'test-company-'.time(),
                'name' => 'Test Company',
                'email' => 'admin@test-company.com',
                'plan' => 'basic',
                'status' => 'active',
            ]);

            $this->info("   Test tenant created: {$testTenant->id}");

            // Test 3: Create domain for the tenant
            $this->info('3. Creating domain for test tenant...');
            try {
                $domain = $testTenant->domains()->create([
                    'domain' => $testTenant->id.'.localhost',
                ]);
                $this->info("   Domain created: {$domain->domain}");
            } catch (\Exception $e) {
                $this->warn('   Domain creation failed: '.$e->getMessage());
                $this->info('   This might be due to database strict mode. Creating manually...');

                // Try creating domain with explicit ID
                $domain = new \Stancl\Tenancy\Database\Models\Domain;
                $domain->domain = $testTenant->id.'.localhost';
                $domain->tenant_id = $testTenant->id;
                $domain->save();

                $this->info("   Domain created manually: {$domain->domain}");
            }

            // Test 4: Check tenant database creation
            $this->info('4. Checking tenant database...');
            $databaseName = $testTenant->getTenantKeyName();
            $this->info("   Tenant database identifier: {$databaseName}");

            $this->newLine();
            $this->info('✅ Basic tenancy setup test completed successfully!');
            $this->info("🔗 Test tenant URL: http://{$domain->domain}");
            $this->newLine();
            $this->warn('Next steps:');
            $this->line('- Configure DNS or hosts file to point the domain to your local server');
            $this->line('- Test tenant-specific routes and data isolation');
            $this->line('- Complete the remaining migration and seeding setup');

        } catch (\Exception $e) {
            $this->error('❌ Tenancy setup test failed!');
            $this->error('Error: '.$e->getMessage());
            $this->line('Stack trace:');
            $this->line($e->getTraceAsString());

            return 1;
        }

        return 0;
    }
}
