<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;
use App\Models\Module;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductionSeeder extends Seeder
{
    /**
     * Seed the production database with subscription plans and modules.
     * This seeder is safe to run multiple times - it will only create data if it doesn't exist.
     */
    public function run(): void
    {
        $this->command->info('🚀 Seeding production subscription system...');

        DB::transaction(function () {
            $this->seedModules();
            $this->seedSubscriptionPlans();
            $this->attachModulesToPlans();
        });

        $this->command->info('✅ Production subscription system seeded successfully!');
        
        // Log the seeding for production monitoring
        Log::info('Production subscription system seeded', [
            'plans_count' => SubscriptionPlan::count(),
            'modules_count' => Module::count(),
        ]);
    }

    private function seedModules(): void
    {
        $this->command->info('📦 Seeding modules...');

        $modules = [
            [
                'name' => 'HR Management',
                'slug' => 'hr-management',
                'description' => 'Complete human resource management with employee records, onboarding, and HR documents',
                'icon' => 'UserGroupIcon',
                'color' => '#3B82F6',
                'monthly_price' => 15,
                'yearly_price' => 150,
                'features' => json_encode([
                    'Employee Management',
                    'Onboarding & Offboarding',
                    'HR Document Management',
                    'Employee Benefits',
                    'Performance Reviews'
                ]),
                'is_core' => true,
                'category' => 'management',
                'sort_order' => 1,
            ],
            [
                'name' => 'Attendance Tracking',
                'slug' => 'attendance-tracking',
                'description' => 'Advanced attendance and time tracking with geolocation, face recognition, and detailed analytics',
                'icon' => 'ClockIcon',
                'color' => '#059669',
                'monthly_price' => 12,
                'yearly_price' => 120,
                'features' => json_encode([
                    'Time Clock Management',
                    'Geolocation Tracking',
                    'Face Recognition',
                    'Overtime Calculation',
                    'Attendance Analytics'
                ]),
                'is_core' => true,
                'category' => 'tracking',
                'sort_order' => 2,
            ],
            [
                'name' => 'Project Management',
                'slug' => 'project-management',
                'description' => 'Comprehensive project and task management with team collaboration and progress tracking',
                'icon' => 'FolderIcon',
                'color' => '#7C3AED',
                'monthly_price' => 20,
                'yearly_price' => 200,
                'features' => json_encode([
                    'Project Planning',
                    'Task Management',
                    'Team Collaboration',
                    'Gantt Charts',
                    'Progress Tracking'
                ]),
                'is_core' => false,
                'category' => 'management',
                'sort_order' => 3,
            ],
            [
                'name' => 'Quality Management',
                'slug' => 'quality-management',
                'description' => 'Quality assurance, compliance tracking, and audit management system',
                'icon' => 'ShieldCheckIcon',
                'color' => '#DC2626',
                'monthly_price' => 18,
                'yearly_price' => 180,
                'features' => json_encode([
                    'Quality Control',
                    'Compliance Tracking',
                    'Audit Management',
                    'ISO Standards',
                    'Quality Analytics'
                ]),
                'is_core' => false,
                'category' => 'compliance',
                'sort_order' => 4,
            ],
            [
                'name' => 'Document Management',
                'slug' => 'document-management',
                'description' => 'Secure document storage, version control, and collaborative document management',
                'icon' => 'DocumentTextIcon',
                'color' => '#EA580C',
                'monthly_price' => 10,
                'yearly_price' => 100,
                'features' => json_encode([
                    'Document Storage',
                    'Version Control',
                    'Access Control',
                    'Document Sharing',
                    'Search & Indexing'
                ]),
                'is_core' => false,
                'category' => 'productivity',
                'sort_order' => 5,
            ],
            [
                'name' => 'Learning Management',
                'slug' => 'learning-management',
                'description' => 'Employee training, course management, and skills development platform',
                'icon' => 'AcademicCapIcon',
                'color' => '#0891B2',
                'monthly_price' => 16,
                'yearly_price' => 160,
                'features' => json_encode([
                    'Course Management',
                    'Training Programs',
                    'Skills Assessment',
                    'Certifications',
                    'Learning Analytics'
                ]),
                'is_core' => false,
                'category' => 'development',
                'sort_order' => 6,
            ],
            [
                'name' => 'Inventory Management',
                'slug' => 'inventory-management',
                'description' => 'Complete inventory tracking, stock management, and procurement system',
                'icon' => 'CubeIcon',
                'color' => '#7C2D12',
                'monthly_price' => 22,
                'yearly_price' => 220,
                'features' => json_encode([
                    'Stock Management',
                    'Procurement',
                    'Supplier Management',
                    'Barcode Scanning',
                    'Inventory Analytics'
                ]),
                'is_core' => false,
                'category' => 'operations',
                'sort_order' => 7,
            ],
            [
                'name' => 'Analytics & Reporting',
                'slug' => 'analytics-reporting',
                'description' => 'Advanced analytics, custom reports, and business intelligence dashboard',
                'icon' => 'ChartBarIcon',
                'color' => '#BE185D',
                'monthly_price' => 25,
                'yearly_price' => 250,
                'features' => json_encode([
                    'Custom Reports',
                    'Data Visualization',
                    'Business Intelligence',
                    'Export Capabilities',
                    'Scheduled Reports'
                ]),
                'is_core' => false,
                'category' => 'analytics',
                'sort_order' => 8,
            ],
        ];

        foreach ($modules as $moduleData) {
            Module::firstOrCreate(
                ['slug' => $moduleData['slug']],
                $moduleData
            );
        }

        $this->command->info('✅ Modules seeded successfully');
    }

    private function seedSubscriptionPlans(): void
    {
        $this->command->info('💳 Seeding subscription plans...');

        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'description' => 'Perfect for small teams getting started with essential features',
                'base_monthly_price' => 29,
                'base_yearly_price' => 290,
                'max_employees' => 10,
                'max_storage_gb' => 10,
                'included_modules' => json_encode([]),
                'module_discount_percentage' => 0,
                'trial_days' => 14,
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Ideal for growing businesses with advanced features and integrations',
                'base_monthly_price' => 59,
                'base_yearly_price' => 590,
                'max_employees' => 50,
                'max_storage_gb' => 100,
                'included_modules' => json_encode([]),
                'module_discount_percentage' => 10,
                'trial_days' => 14,
                'is_popular' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large organizations requiring maximum flexibility and dedicated support',
                'base_monthly_price' => 129,
                'base_yearly_price' => 1290,
                'max_employees' => null, // unlimited
                'max_storage_gb' => 1000,
                'included_modules' => json_encode([]),
                'module_discount_percentage' => 20,
                'trial_days' => 30,
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $planData) {
            SubscriptionPlan::firstOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }

        $this->command->info('✅ Subscription plans seeded successfully');
    }

    private function attachModulesToPlans(): void
    {
        $this->command->info('🔗 Attaching modules to plans...');

        // Get all plans and modules
        $basicPlan = SubscriptionPlan::where('slug', 'basic')->first();
        $professionalPlan = SubscriptionPlan::where('slug', 'professional')->first();
        $enterprisePlan = SubscriptionPlan::where('slug', 'enterprise')->first();

        // Core modules (included in all plans)
        $coreModules = Module::where('is_core', true)->get();
        
        // Additional modules
        $projectModule = Module::where('slug', 'project-management')->first();
        $documentModule = Module::where('slug', 'document-management')->first();
        $analyticsModule = Module::where('slug', 'analytics-reporting')->first();

        // Basic Plan: Only core modules
        if ($basicPlan) {
            $basicPlan->modules()->syncWithoutDetaching($coreModules->pluck('id')->toArray());
        }

        // Professional Plan: Core modules + some additional
        if ($professionalPlan) {
            $professionalModules = $coreModules->pluck('id')->toArray();
            if ($projectModule) $professionalModules[] = $projectModule->id;
            if ($documentModule) $professionalModules[] = $documentModule->id;
            
            $professionalPlan->modules()->syncWithoutDetaching($professionalModules);
        }

        // Enterprise Plan: All modules
        if ($enterprisePlan) {
            $allModules = Module::all()->pluck('id')->toArray();
            $enterprisePlan->modules()->syncWithoutDetaching($allModules);
        }

        $this->command->info('✅ Modules attached to plans successfully');
    }
}