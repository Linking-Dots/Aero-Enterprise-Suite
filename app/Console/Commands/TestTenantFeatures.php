<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestTenantFeatures extends Command
{
    protected $signature = 'tenant:test-features';

    protected $description = 'Test tenant-specific features like storage, cache, etc.';

    public function handle(): int
    {
        $this->info('Testing Tenant-Specific Features...');

        // Test storage paths
        $this->info('Storage Path: '.storage_path());
        $this->info('App Path: '.storage_path('app'));
        $this->info('Public Disk Path: '.Storage::disk('public')->path(''));

        // Test cache isolation (handle tagging support)
        try {
            $cacheKey = 'tenant_test_'.now()->timestamp;
            cache()->put($cacheKey, 'tenant_value', 60);
            $this->info('Cache Test - Set: '.$cacheKey.' = tenant_value');
            $this->info('Cache Test - Get: '.cache()->get($cacheKey));
        } catch (\BadMethodCallException $e) {
            $this->warn('Cache tagging not supported with current driver. Consider using Redis or Memcached for cache tenancy.');
            $this->info('Cache Driver: '.config('cache.default'));
        }

        // Test file storage
        $testFile = 'tenant_test_file.txt';
        $tenantId = tenant('id') ?? 'unknown';
        Storage::disk('public')->put($testFile, 'This is a tenant-specific file: '.$tenantId);
        $this->info('File created: '.$testFile);
        $this->info('File content: '.Storage::disk('public')->get($testFile));

        $this->info('Current Tenant: '.$tenantId);

        return 0;
    }
}
