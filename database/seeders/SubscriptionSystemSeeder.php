<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubscriptionSystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🚀 Seeding subscription system...\n";

        // Create modules based on existing system functionality
        $modules = [
            [
                'name' => 'HR Management',
                'slug' => 'hr-management',
                'description' => 'Complete human resource management with employee records, onboarding, and HR documents',
                'icon' => 'UserGroupIcon',
                'color' => '#3B82F6',
                'monthly_price' => 15.00,
                'yearly_price' => 150.00,
                'features' => [
                    'Employee Management',
                    'Onboarding & Offboarding',
                    'HR Document Management',
                    'Employee Benefits',
                    'Performance Reviews'
                ],
                'is_core' => true,
                'category' => 'management',
                'sort_order' => 1
            ],
            [
                'name' => 'Attendance Management',
                'slug' => 'attendance-management',
                'description' => 'Time tracking, attendance monitoring, and leave management system',
                'icon' => 'ClockIcon',
                'color' => '#10B981',
                'monthly_price' => 10.00,
                'yearly_price' => 100.00,
                'features' => [
                    'Time Clock',
                    'Attendance Tracking',
                    'Leave Management',
                    'Holiday Calendar',
                    'Attendance Reports'
                ],
                'dependencies' => [1], // Depends on HR Management
                'is_core' => true,
                'category' => 'management',
                'sort_order' => 2
            ],
            [
                'name' => 'Project Management',
                'slug' => 'project-management',
                'description' => 'Project planning, task management, and team collaboration tools',
                'icon' => 'FolderIcon',
                'color' => '#8B5CF6',
                'monthly_price' => 20.00,
                'yearly_price' => 200.00,
                'features' => [
                    'Project Planning',
                    'Task Management',
                    'Time Tracking',
                    'Team Collaboration',
                    'Project Reports'
                ],
                'category' => 'management',
                'sort_order' => 3
            ],
            [
                'name' => 'Quality Management',
                'slug' => 'quality-management',
                'description' => 'Quality control, inspections, and compliance management',
                'icon' => 'ShieldCheckIcon',
                'color' => '#F59E0B',
                'monthly_price' => 25.00,
                'yearly_price' => 250.00,
                'features' => [
                    'Quality Inspections',
                    'Non-Conformance Reports',
                    'Calibration Management',
                    'Quality Metrics',
                    'Compliance Tracking'
                ],
                'category' => 'compliance',
                'sort_order' => 4
            ],
            [
                'name' => 'Document Management',
                'slug' => 'document-management',
                'description' => 'Digital document storage, version control, and collaboration',
                'icon' => 'DocumentIcon',
                'color' => '#EF4444',
                'monthly_price' => 12.00,
                'yearly_price' => 120.00,
                'features' => [
                    'Document Storage',
                    'Version Control',
                    'Digital Signatures',
                    'Workflow Approvals',
                    'Document Templates'
                ],
                'category' => 'management',
                'sort_order' => 5
            ],
            [
                'name' => 'Learning Management',
                'slug' => 'learning-management',
                'description' => 'Training programs, course management, and skills development',
                'icon' => 'AcademicCapIcon',
                'color' => '#06B6D4',
                'monthly_price' => 18.00,
                'yearly_price' => 180.00,
                'features' => [
                    'Course Management',
                    'Training Programs',
                    'Skills Tracking',
                    'Certifications',
                    'Learning Analytics'
                ],
                'category' => 'management',
                'sort_order' => 6
            ],
            [
                'name' => 'Inventory Management',
                'slug' => 'inventory-management',
                'description' => 'Stock control, procurement, and supply chain management',
                'icon' => 'CubeIcon',
                'color' => '#84CC16',
                'monthly_price' => 22.00,
                'yearly_price' => 220.00,
                'features' => [
                    'Stock Management',
                    'Procurement',
                    'Supplier Management',
                    'Purchase Orders',
                    'Inventory Reports'
                ],
                'category' => 'operations',
                'sort_order' => 7
            ],
            [
                'name' => 'Analytics & Reporting',
                'slug' => 'analytics-reporting',
                'description' => 'Advanced analytics, dashboards, and custom reporting',
                'icon' => 'ChartBarIcon',
                'color' => '#EC4899',
                'monthly_price' => 30.00,
                'yearly_price' => 300.00,
                'features' => [
                    'Advanced Analytics',
                    'Custom Dashboards',
                    'Automated Reports',
                    'Data Visualization',
                    'Export Functions'
                ],
                'category' => 'analytics',
                'sort_order' => 8
            ]
        ];

        // Create modules
        foreach ($modules as $moduleData) {
            Module::create($moduleData);
        }

        echo "✅ Created " . count($modules) . " modules\n";

        // Create subscription plans
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Perfect for small businesses getting started with HR management',
                'base_monthly_price' => 29.00,
                'base_yearly_price' => 290.00,
                'max_employees' => 25,
                'max_storage_gb' => 10,
                'included_modules' => [1, 2], // HR and Attendance modules included
                'module_discount_percentage' => 10.00,
                'is_popular' => false,
                'sort_order' => 1,
                'trial_days' => 14
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Comprehensive solution for growing businesses with advanced features',
                'base_monthly_price' => 79.00,
                'base_yearly_price' => 790.00,
                'max_employees' => 100,
                'max_storage_gb' => 100,
                'included_modules' => [1, 2, 3], // HR, Attendance, and Project modules included
                'module_discount_percentage' => 20.00,
                'is_popular' => true,
                'sort_order' => 2,
                'trial_days' => 30
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Full-featured enterprise solution with unlimited users and storage',
                'base_monthly_price' => 149.00,
                'base_yearly_price' => 1490.00,
                'max_employees' => null, // unlimited
                'max_storage_gb' => null, // unlimited
                'included_modules' => [1, 2, 3, 4, 5], // Multiple modules included
                'module_discount_percentage' => 30.00,
                'is_popular' => false,
                'sort_order' => 3,
                'trial_days' => 30
            ]
        ];

        // Create subscription plans
        foreach ($plans as $planData) {
            $plan = SubscriptionPlan::create($planData);
            
            // Attach all modules to each plan with pricing
            $modules = Module::all();
            foreach ($modules as $module) {
                $isIncluded = in_array($module->id, $plan->included_modules ?? []);
                
                $plan->modules()->attach($module->id, [
                    'custom_monthly_price' => null, // Use module's default price
                    'custom_yearly_price' => null,
                    'discount_percentage' => $plan->module_discount_percentage,
                    'is_included' => $isIncluded,
                    'is_available' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        echo "✅ Created " . count($plans) . " subscription plans\n";
        echo "🎉 Subscription system seeding completed!\n";
    }
}
