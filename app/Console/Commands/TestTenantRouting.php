<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestTenantRouting extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:test-routing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test tenant routing functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Testing Tenant Routing System...');

        // Test central domain access
        $this->info('📡 Testing Central Domain Access...');
        try {
            $response = Http::get('http://127.0.0.1:8000/');
            $this->info("✅ Central domain responded with status: {$response->status()}");
        } catch (\Exception $e) {
            $this->error("❌ Central domain failed: {$e->getMessage()}");
        }

        // Test tenant domain access
        $this->info('🏢 Testing Tenant Domain Access...');
        try {
            // First check if our server can handle custom Host headers
            $response = Http::withHeaders([
                'Host' => 'test-tenant.localhost',
            ])->get('http://127.0.0.1:8000/tenant-info');

            if ($response->successful()) {
                $data = $response->json();
                $this->info('✅ Tenant routing successful!');
                $this->info('   - Tenant ID: '.($data['tenant_id'] ?? 'null'));
                $this->info('   - Database: '.($data['database'] ?? 'null'));
                $this->info('   - Domain: '.($data['domain'] ?? 'null'));
            } else {
                $this->error("❌ Tenant domain responded with status: {$response->status()}");
            }
        } catch (\Exception $e) {
            $this->error("❌ Tenant domain failed: {$e->getMessage()}");
        }

        // Test tenancy middleware protection
        $this->info('🔒 Testing Tenancy Middleware Protection...');
        try {
            $response = Http::withHeaders([
                'Host' => 'test-tenant.localhost',
            ])->get('http://127.0.0.1:8000/');

            $this->info("✅ Protection test responded with status: {$response->status()}");
        } catch (\Exception $e) {
            $this->error("❌ Protection test failed: {$e->getMessage()}");
        }

        $this->info('🎯 Tenant routing tests completed!');

        return 0;
    }
}
