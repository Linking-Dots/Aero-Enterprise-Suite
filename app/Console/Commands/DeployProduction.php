<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SubscriptionPlan;
use App\Models\Module;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeployProduction extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'deploy:production 
                            {--migrate : Run database migrations}
                            {--seed : Seed subscription data}
                            {--admin : Create super admin user}
                            {--verify : Verify deployment}
                            {--all : Run all deployment steps}';

    /**
     * The console command description.
     */
    protected $description = 'Deploy the multi-tenant SaaS platform to production';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting production deployment...');

        $migrate = $this->option('migrate') || $this->option('all');
        $seed = $this->option('seed') || $this->option('all');
        $admin = $this->option('admin') || $this->option('all');
        $verify = $this->option('verify') || $this->option('all');

        try {
            if ($migrate) {
                $this->runMigrations();
            }

            if ($seed) {
                $this->seedData();
            }

            if ($admin) {
                $this->createSuperAdmin();
            }

            if ($verify) {
                $this->verifyDeployment();
            }

            $this->info('✅ Production deployment completed successfully!');
            
        } catch (\Exception $e) {
            $this->error('❌ Deployment failed: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    private function runMigrations()
    {
        $this->info('🔧 Running database migrations...');
        
        if ($this->confirm('This will run migrations in production. Continue?', false)) {
            try {
                // Run all migrations including the new permission tables
                Artisan::call('migrate', ['--force' => true]);
                $this->info('✅ Migrations completed');
                $this->line(Artisan::output());
                
                // Clear permission cache
                Artisan::call('permission:cache-reset');
                $this->info('✅ Permission cache cleared');
                
            } catch (\Exception $e) {
                $this->error('❌ Migration failed: ' . $e->getMessage());
                throw $e;
            }
        } else {
            $this->warn('⚠️ Migrations skipped');
        }
    }

    private function seedData()
    {
        $this->info('🌱 Seeding subscription data...');
        
        try {
            // Check if data already exists
            $planCount = SubscriptionPlan::count();
            $moduleCount = Module::count();
            
            if ($planCount > 0 || $moduleCount > 0) {
                if (!$this->confirm("Data already exists (Plans: {$planCount}, Modules: {$moduleCount}). Reseed?", false)) {
                    $this->warn('⚠️ Seeding skipped');
                    return;
                }
            }

            Artisan::call('db:seed', [
                '--class' => 'ProductionSeeder',
                '--force' => true
            ]);
            
            $this->info('✅ Data seeded successfully');
            $this->line(Artisan::output());
            
        } catch (\Exception $e) {
            $this->error('❌ Seeding failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function createSuperAdmin()
    {
        $this->info('👤 Creating super administrator...');
        
        try {
            // Check if super admin role exists
            $superAdminRole = Role::where('name', 'Super Administrator')->first();
            
            if (!$superAdminRole) {
                $this->error('❌ Super Administrator role not found. Please run seeding first.');
                throw new \Exception('Super Administrator role not found');
            }
            
            // Check if super admin already exists
            $existingAdmin = User::role('Super Administrator')->first();
            
            if ($existingAdmin) {
                $this->warn("⚠️ Super admin already exists: {$existingAdmin->email}");
                
                if (!$this->confirm('Create another super admin?', false)) {
                    return;
                }
            }

            $name = $this->ask('Admin name', 'Platform Administrator');
            $email = $this->ask('Admin email', 'admin@' . parse_url(config('app.url'), PHP_URL_HOST));
            $password = $this->secret('Admin password (leave empty for random)');
            
            if (empty($password)) {
                $password = Str::random(12);
                $this->warn("Generated password: {$password}");
            }

            // Create the user directly since we have the role
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now()
            ]);
            
            // Assign the Super Administrator role
            $user->assignRole($superAdminRole);
            
            $this->info('✅ Super admin created successfully');
            $this->info("👤 Email: {$user->email}");
            $this->info("🔑 Password: {$password}");
            
        } catch (\Exception $e) {
            $this->error('❌ Admin creation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function verifyDeployment()
    {
        $this->info('🔍 Verifying deployment...');
        
        $issues = [];
        
        // Check database connection
        try {
            DB::connection()->getPdo();
            $this->info('✅ Database connection: OK');
        } catch (\Exception $e) {
            $issues[] = 'Database connection failed';
            $this->error('❌ Database connection: FAILED');
        }

        // Check migrations
        try {
            $pendingMigrations = Artisan::call('migrate:status');
            $this->info('✅ Migration status: OK');
        } catch (\Exception $e) {
            $issues[] = 'Migration status check failed';
            $this->error('❌ Migration status: FAILED');
        }

        // Check subscription plans
        $planCount = SubscriptionPlan::count();
        if ($planCount >= 3) {
            $this->info("✅ Subscription plans: {$planCount} plans found");
        } else {
            $issues[] = "Insufficient subscription plans ({$planCount}/3)";
            $this->error("❌ Subscription plans: Only {$planCount} found");
        }

        // Check modules
        $moduleCount = Module::count();
        if ($moduleCount >= 8) {
            $this->info("✅ Modules: {$moduleCount} modules found");
        } else {
            $issues[] = "Insufficient modules ({$moduleCount}/8)";
            $this->error("❌ Modules: Only {$moduleCount} found");
        }

        // Check super admin
        $adminCount = User::role('Super Administrator')->count();
        if ($adminCount > 0) {
            $this->info("✅ Super admin: {$adminCount} admin(s) found");
        } else {
            $issues[] = 'No super administrator found';
            $this->error('❌ Super admin: No admin found');
        }

        // Check roles
        $superAdminRole = Role::where('name', 'Super Administrator')->first();
        if ($superAdminRole) {
            $this->info('✅ Super Administrator role: OK');
        } else {
            $issues[] = 'Super Administrator role missing';
            $this->error('❌ Super Administrator role: MISSING');
        }

        // Summary
        if (empty($issues)) {
            $this->info('🎉 All deployment checks passed!');
        } else {
            $this->error('⚠️ Deployment issues found:');
            foreach ($issues as $issue) {
                $this->error("  - {$issue}");
            }
        }

        // Display summary
        $this->table(
            ['Component', 'Status', 'Count'],
            [
                ['Database', 'Connected', '✅'],
                ['Subscription Plans', $planCount >= 3 ? 'OK' : 'Issues', $planCount],
                ['Modules', $moduleCount >= 8 ? 'OK' : 'Issues', $moduleCount],
                ['Super Admins', $adminCount > 0 ? 'OK' : 'Missing', $adminCount],
                ['Admin Role', $superAdminRole ? 'OK' : 'Missing', $superAdminRole ? '✅' : '❌'],
            ]
        );
    }
}