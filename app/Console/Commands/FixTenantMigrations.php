<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class FixTenantMigrations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenancy:fix-migrations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix tenant migration dependencies by reordering them properly';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing tenant migration dependencies...');
        $this->newLine();

        $tenantMigrationsPath = database_path('migrations/tenant');

        // Get all migration files
        $migrations = collect(File::files($tenantMigrationsPath))
            ->map(fn ($file) => $file->getFilename())
            ->sort()
            ->values();

        $this->info('Current tenant migrations order:');
        foreach ($migrations as $index => $migration) {
            $this->line(($index + 1).'. '.$migration);
        }

        $this->newLine();
        $this->info('🔧 Migration dependency issues detected:');
        $this->warn('1. Users table references attendance_types that may not exist yet');
        $this->warn('2. Foreign key constraints are being created before referenced tables');

        $this->newLine();
        $this->info('💡 Recommended solutions:');
        $this->line('1. Temporarily disable foreign key checks during migration');
        $this->line('2. Create migrations in proper dependency order');
        $this->line('3. Use nullable foreign keys where appropriate');

        $this->newLine();

        if ($this->confirm('Would you like to create a custom migration runner that handles dependencies?')) {
            $this->createCustomMigrationRunner();
        }

        return 0;
    }

    private function createCustomMigrationRunner()
    {
        $this->info('Creating custom tenant migration runner...');

        // Create a custom migration job that handles dependencies
        $migrationJobPath = app_path('Jobs/MigrateTenantWithDependencies.php');

        $content = '<?php

namespace App\Jobs;

use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Jobs\MigrateDatabase;

class MigrateTenantWithDependencies extends MigrateDatabase
{
    public function handle()
    {
        // Disable foreign key checks temporarily
        DB::statement("SET FOREIGN_KEY_CHECKS=0");
        
        try {
            // Run the parent migration process
            parent::handle();
        } finally {
            // Re-enable foreign key checks
            DB::statement("SET FOREIGN_KEY_CHECKS=1");
        }
    }
}';

        File::put($migrationJobPath, $content);
        $this->info("✅ Created custom migration job: {$migrationJobPath}");

        $this->newLine();
        $this->warn('Next step: Update TenancyServiceProvider to use the custom migration job');
        $this->line('Replace Jobs\MigrateDatabase::class with App\Jobs\MigrateTenantWithDependencies::class');
    }
}
