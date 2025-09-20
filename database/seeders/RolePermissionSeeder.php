<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Clear cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            // Create permissions for the central admin system
            $permissions = [
                // Platform Management
                'manage platform',
                'view analytics',
                'manage system settings',
                
                // Tenant Management
                'create tenants',
                'view tenants',
                'edit tenants',
                'delete tenants',
                'suspend tenants',
                'activate tenants',
                
                // Subscription Management
                'view subscriptions',
                'edit subscriptions',
                'cancel subscriptions',
                'upgrade subscriptions',
                'downgrade subscriptions',
                
                // Plan Management
                'create plans',
                'edit plans',
                'delete plans',
                'view plans',
                
                // Module Management
                'create modules',
                'edit modules',
                'delete modules',
                'view modules',
                
                // User Management
                'create users',
                'view users',
                'edit users',
                'delete users',
                'manage user roles',
                
                // System Administration
                'view logs',
                'manage backups',
                'manage system health',
                'access admin panel',
            ];

            foreach ($permissions as $permission) {
                Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => 'web'
                ]);
            }

            // Create roles
            $superAdminRole = Role::firstOrCreate([
                'name' => 'Super Administrator',
                'guard_name' => 'web'
            ]);

            $adminRole = Role::firstOrCreate([
                'name' => 'Platform Administrator',
                'guard_name' => 'web'
            ]);

            $supportRole = Role::firstOrCreate([
                'name' => 'Support Agent',
                'guard_name' => 'web'
            ]);

            // Assign permissions to roles
            $superAdminRole->givePermissionTo(Permission::all());

            $adminRole->givePermissionTo([
                'view analytics',
                'view tenants',
                'edit tenants',
                'suspend tenants',
                'activate tenants',
                'view subscriptions',
                'edit subscriptions',
                'upgrade subscriptions',
                'downgrade subscriptions',
                'view plans',
                'view modules',
                'view users',
                'edit users',
                'view logs',
                'access admin panel',
            ]);

            $supportRole->givePermissionTo([
                'view tenants',
                'view subscriptions',
                'view plans',
                'view modules',
                'view users',
                'access admin panel',
            ]);

            $this->command->info('Roles and permissions created successfully!');
            $this->command->info('Created roles: ' . Role::count());
            $this->command->info('Created permissions: ' . Permission::count());
        });
    }
}
