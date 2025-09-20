<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create-super-admin {--email=admin@central.com} {--password=password} {--name=Super Admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a super administrator user for central application management';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');
        $password = $this->option('password');
        $name = $this->option('name');

        $this->info('Creating Super Administrator...');

        // Check if user already exists
        if (User::where('email', $email)->exists()) {
            $this->error("User with email {$email} already exists!");
            return 1;
        }

        try {
            // Create the user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            $this->info("User created: {$user->name} <{$user->email}>");

            // Check if Super Administrator role exists
            $role = Role::where('name', 'Super Administrator')->first();
            
            if (!$role) {
                // Create the role if it doesn't exist
                $this->info('Creating Super Administrator role...');
                $role = Role::create(['name' => 'Super Administrator']);
            }

            // Assign the role
            $user->assignRole($role);
            
            $this->info('✅ Super Administrator created successfully!');
            $this->info("Email: {$email}");
            $this->info("Password: {$password}");
            $this->info("Role: {$role->name}");
            
            $this->warn('Remember to change the password after first login!');

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to create super admin: ' . $e->getMessage());
            return 1;
        }
    }
}
