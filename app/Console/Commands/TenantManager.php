<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Stancl\Tenancy\Database\Models\Domain;

class TenantManager extends Command
{
    protected $signature = 'tenant:manage 
                           {action : The action to perform (create, delete, list, backup, restore, status)}
                           {--id= : Tenant ID}
                           {--domain= : Tenant domain}
                           {--backup-path= : Backup file path}';

    protected $description = 'Comprehensive tenant management operations';

    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'create' => $this->createTenant(),
            'delete' => $this->deleteTenant(),
            'list' => $this->listTenants(),
            'backup' => $this->backupTenant(),
            'restore' => $this->restoreTenant(),
            'status' => $this->tenantStatus(),
            default => $this->showHelp(),
        };
    }

    private function createTenant(): int
    {
        $id = $this->option('id') ?: $this->ask('Enter tenant ID');
        $domain = $this->option('domain') ?: $this->ask('Enter tenant domain (optional)');

        if (Tenant::find($id)) {
            $this->error("Tenant with ID '{$id}' already exists!");

            return 1;
        }

        try {
            $this->info("Creating tenant: {$id}");

            // Create tenant
            $tenant = Tenant::create(['id' => $id]);
            $this->info('✅ Tenant created successfully');

            // Create domain if provided
            if ($domain) {
                $tenant->domains()->create(['domain' => $domain]);
                $this->info("✅ Domain created: {$domain}");
            }

            // Run migrations
            $this->info('Running migrations...');
            $this->call('tenants:migrate', ['--tenants' => [$id]]);

            // Run seeders
            if ($this->confirm('Run database seeders?', true)) {
                $this->info('Running seeders...');
                $this->call('tenants:seed', ['--tenants' => [$id]]);
            }

            $this->info("🎉 Tenant '{$id}' created successfully!");
            $this->info("Access URL: http://{$domain}");

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to create tenant: '.$e->getMessage());

            return 1;
        }
    }

    private function deleteTenant(): int
    {
        $id = $this->option('id') ?: $this->ask('Enter tenant ID to delete');

        $tenant = Tenant::find($id);
        if (! $tenant) {
            $this->error("Tenant '{$id}' not found!");

            return 1;
        }

        if (! $this->confirm("Are you sure you want to delete tenant '{$id}'? This action cannot be undone!")) {
            $this->info('Operation cancelled.');

            return 0;
        }

        try {
            // Delete tenant-specific storage
            $storagePath = storage_path("tenant{$id}");
            if (is_dir($storagePath)) {
                $this->info("Removing tenant storage: {$storagePath}");
                $this->deleteDirectory($storagePath);
            }

            // Delete tenant database
            $this->info('Dropping tenant database...');
            tenancy()->initialize($tenant);
            tenancy()->end();

            // Delete tenant record
            $tenant->delete();

            $this->info("✅ Tenant '{$id}' deleted successfully!");

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to delete tenant: '.$e->getMessage());

            return 1;
        }
    }

    private function listTenants(): int
    {
        $tenants = Tenant::with('domains')->get();

        if ($tenants->isEmpty()) {
            $this->info('No tenants found.');

            return 0;
        }

        $this->info('Listing all tenants:');
        $this->newLine();

        foreach ($tenants as $tenant) {
            $domains = $tenant->domains->pluck('domain')->join(', ') ?: 'No domains';
            $this->line("🏢 Tenant: {$tenant->id}");
            $this->line("   Domains: {$domains}");
            $this->line("   Created: {$tenant->created_at->format('Y-m-d H:i:s')}");
            $this->newLine();
        }

        return 0;
    }

    private function backupTenant(): int
    {
        $id = $this->option('id') ?: $this->ask('Enter tenant ID to backup');
        $backupPath = $this->option('backup-path') ?: storage_path("backups/tenant_{$id}_".date('Y-m-d_H-i-s').'.sql');

        $tenant = Tenant::find($id);
        if (! $tenant) {
            $this->error("Tenant '{$id}' not found!");

            return 1;
        }

        try {
            $this->info("Creating backup for tenant: {$id}");

            // Ensure backup directory exists
            $backupDir = dirname($backupPath);
            if (! is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Run mysqldump command for tenant database
            $dbName = "tenant{$id}";
            $dbHost = config('database.connections.mysql.host', 'localhost');
            $dbUser = config('database.connections.mysql.username');
            $dbPass = config('database.connections.mysql.password');

            $command = sprintf(
                'mysqldump -h%s -u%s -p%s %s > %s',
                escapeshellarg($dbHost),
                escapeshellarg($dbUser),
                escapeshellarg($dbPass),
                escapeshellarg($dbName),
                escapeshellarg($backupPath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode === 0) {
                $this->info("✅ Backup created successfully: {$backupPath}");

                return 0;
            } else {
                $this->error("Backup failed with return code: {$returnCode}");

                return 1;
            }
        } catch (\Exception $e) {
            $this->error('Failed to backup tenant: '.$e->getMessage());

            return 1;
        }
    }

    private function restoreTenant(): int
    {
        $this->info('Tenant restore functionality requires careful implementation.');
        $this->info('Please use database tools directly for restore operations.');

        return 0;
    }

    private function tenantStatus(): int
    {
        $id = $this->option('id') ?: $this->ask('Enter tenant ID');

        $tenant = Tenant::find($id);
        if (! $tenant) {
            $this->error("Tenant '{$id}' not found!");

            return 1;
        }

        $this->info("Tenant Status Report: {$id}");
        $this->newLine();

        // Basic info
        $this->line('📋 Basic Information:');
        $this->line("   ID: {$tenant->id}");
        $this->line("   Created: {$tenant->created_at->format('Y-m-d H:i:s')}");
        $this->line("   Updated: {$tenant->updated_at->format('Y-m-d H:i:s')}");

        // Domains
        $domains = $tenant->domains;
        $this->newLine();
        $this->line('🌐 Domains ('.$domains->count().'):');
        foreach ($domains as $domain) {
            $this->line("   - {$domain->domain}");
        }

        // Storage
        $storagePath = storage_path("tenant{$id}");
        $this->newLine();
        $this->line('💾 Storage:');
        $this->line("   Path: {$storagePath}");
        $this->line('   Exists: '.(is_dir($storagePath) ? '✅ Yes' : '❌ No'));

        // Database
        $this->newLine();
        $this->line('🗄️ Database:');
        try {
            tenancy()->initialize($tenant);
            $this->line('   Status: ✅ Accessible');

            // Check if tables exist
            $tables = DB::select('SHOW TABLES');
            $this->line('   Tables: '.count($tables));

            tenancy()->end();
        } catch (\Exception $e) {
            $this->line('   Status: ❌ Error - '.$e->getMessage());
        }

        return 0;
    }

    private function showHelp(): int
    {
        $this->error('Invalid action specified.');
        $this->newLine();
        $this->line('Available actions:');
        $this->line('  create  - Create a new tenant');
        $this->line('  delete  - Delete an existing tenant');
        $this->line('  list    - List all tenants');
        $this->line('  backup  - Backup tenant database');
        $this->line('  restore - Restore tenant database');
        $this->line('  status  - Show detailed tenant status');

        return 1;
    }

    private function deleteDirectory(string $dir): bool
    {
        if (! is_dir($dir)) {
            return false;
        }

        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $path = $dir.DIRECTORY_SEPARATOR.$file;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                unlink($path);
            }
        }

        return rmdir($dir);
    }
}
