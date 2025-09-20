<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Daily Work Management
        Schema::create('daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('summary');
            $table->timestamps();

            $table->unique(['date', 'user_id']);
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('daily_works', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->text('work_description');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('status')->default('pending');
            $table->enum('inspection_result', ['pass', 'fail'])->nullable();
            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index(['date', 'status']);
        });

        Schema::create('daily_works_has_report', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->timestamps();
        });

        // Task Management
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['assigned_to', 'status']);
            $table->index(['due_date', 'status']);
        });

        // Asset Management
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('asset_tag')->unique();
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->decimal('purchase_cost', 10, 2)->nullable();
            $table->date('purchase_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['available', 'assigned', 'maintenance', 'retired'])->default('available');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['category', 'status']);
            $table->index(['assigned_to', 'status']);
        });

        // Employee Experience Tables
        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('company_name');
            $table->string('position');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('institution');
            $table->string('degree');
            $table->string('field_of_study');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('grade')->nullable();
            $table->timestamps();
        });

        // Jurisdictions
        Schema::create('jurisdictions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('incharge')->constrained('users')->cascadeOnDelete();
            $table->json('boundaries')->nullable(); // Geographic boundaries
            $table->timestamps();
        });

        // Picnic Participants
        Schema::create('picnic_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('event_name');
            $table->date('event_date');
            $table->boolean('attending')->default(false);
            $table->integer('guest_count')->default(0);
            $table->text('dietary_requirements')->nullable();
            $table->timestamps();
        });

        // Payroll Management
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('month');
            $table->integer('year');
            $table->decimal('basic_salary', 10, 2);
            $table->decimal('allowances', 10, 2)->default(0);
            $table->decimal('deductions', 10, 2)->default(0);
            $table->decimal('gross_salary', 10, 2);
            $table->decimal('net_salary', 10, 2);
            $table->enum('status', ['draft', 'processed', 'paid'])->default('draft');
            $table->timestamps();

            $table->unique(['user_id', 'month', 'year']);
            $table->index(['month', 'year', 'status']);
        });

        // CRM Tables
        Schema::create('crm_customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('company')->nullable();
            $table->enum('status', ['active', 'inactive', 'prospect'])->default('prospect');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('crm_leads', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('customer_id')->constrained('crm_customers')->cascadeOnDelete();
            $table->enum('status', ['new', 'contacted', 'qualified', 'lost', 'converted'])->default('new');
            $table->decimal('value', 10, 2)->nullable();
            $table->date('expected_close_date')->nullable();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Inventory Management
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->foreignId('category_id')->constrained('inventory_categories')->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->integer('current_stock')->default(0);
            $table->integer('minimum_stock')->default(0);
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->string('unit_of_measure')->default('pcs');
            $table->timestamps();
        });

        // POS Tables
        Schema::create('pos_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('pos_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->foreignId('category_id')->constrained('pos_categories')->cascadeOnDelete();
            $table->decimal('price', 10, 2);
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('pos_sales', function (Blueprint $table) {
            $table->id();
            $table->string('sale_number')->unique();
            $table->foreignId('cashier_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->enum('payment_method', ['cash', 'card', 'digital'])->default('cash');
            $table->timestamps();
        });

        // Quality Management
        Schema::create('quality_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('inspection_type');
            $table->string('item_inspected');
            $table->date('inspection_date');
            $table->foreignId('inspector_id')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->enum('result', ['pass', 'fail', 'conditional_pass'])->default('pass');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('quality_issues', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->foreignId('reported_by')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->date('target_resolution_date')->nullable();
            $table->date('actual_resolution_date')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->date('closed_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->date('verified_at')->nullable();
            $table->timestamps();
        });

        // Helpdesk Tables
        Schema::create('helpdesk_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('subject');
            $table->text('description');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Compliance Management
        Schema::create('compliance_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['regulatory', 'internal', 'industry'])->default('internal');
            $table->enum('status', ['active', 'inactive', 'draft'])->default('active');
            $table->date('effective_date');
            $table->date('review_date')->nullable();
            $table->timestamps();
        });

        // Analytics Tables
        Schema::create('analytics_reports', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // sales, hr, finance, etc.
            $table->json('configuration'); // Report parameters
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_scheduled')->default(false);
            $table->string('schedule_frequency')->nullable(); // daily, weekly, monthly
            $table->timestamps();
        });

        // HR Advanced Tables
        Schema::create('onboarding_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('task_name');
            $table->text('description')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->date('due_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('type')->nullable(); // technical, soft-skill, language, certification
            $table->timestamps();
        });

        Schema::create('competencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->enum('level', ['entry', 'mid', 'senior', 'expert'])->default('entry');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('user_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('beginner');
            $table->timestamps();

            $table->unique(['user_id', 'skill_id']);
        });

        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->enum('type', ['health', 'dental', 'vision', 'retirement', 'time_off', 'perks', 'other'])->default('other');
            $table->string('provider')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('eligibility_criteria')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_benefits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('benefit_id')->constrained('benefits')->cascadeOnDelete();
            $table->date('enrollment_date');
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'pending'])->default('pending');
            $table->timestamps();
        });

        // Performance Management
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->string('review_period'); // e.g., "Q1 2024", "Annual 2024"
            $table->date('review_date');
            $table->json('goals')->nullable();
            $table->json('achievements')->nullable();
            $table->integer('overall_rating')->nullable(); // 1-5 scale
            $table->text('feedback')->nullable();
            $table->enum('status', ['draft', 'completed', 'approved'])->default('draft');
            $table->timestamps();
        });

        // Training Management
        Schema::create('training_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->enum('type', ['mandatory', 'optional', 'certification'])->default('optional');
            $table->integer('duration_hours')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('training_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('program_id')->constrained('training_programs')->cascadeOnDelete();
            $table->date('enrollment_date');
            $table->date('completion_date')->nullable();
            $table->integer('score')->nullable();
            $table->enum('status', ['enrolled', 'in_progress', 'completed', 'failed'])->default('enrolled');
            $table->timestamps();
        });

        Schema::create('safety_trainings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('training_type', ['required', 'recommended', 'optional'])->default('optional');
            $table->date('training_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->enum('frequency', ['one-time', 'annual', 'bi-annual', 'quarterly', 'monthly'])->default('one-time');
            $table->integer('duration_minutes')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->integer('recurrence_interval')->nullable(); // in days
            $table->string('materials_url')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        // Recruitment Management
        Schema::create('job_openings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship'])->default('full_time');
            $table->decimal('salary_min', 10, 2)->nullable();
            $table->decimal('salary_max', 10, 2)->nullable();
            $table->date('posting_date');
            $table->date('closing_date')->nullable();
            $table->enum('status', ['draft', 'active', 'closed', 'filled'])->default('draft');
            $table->timestamps();
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_opening_id')->constrained('job_openings')->cascadeOnDelete();
            $table->string('applicant_name');
            $table->string('applicant_email');
            $table->string('applicant_phone')->nullable();
            $table->text('cover_letter')->nullable();
            $table->string('resume_file')->nullable();
            $table->enum('status', ['submitted', 'under_review', 'shortlisted', 'interviewed', 'hired', 'rejected'])->default('submitted');
            $table->timestamps();
        });

        // Document Management System
        Schema::create('dms_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('dms_folders')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        Schema::create('dms_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('folder_id')->nullable()->constrained('dms_folders')->nullOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type');
            $table->integer('file_size');
            $table->integer('version')->default(1);
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->json('tags')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('document_categories')->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('color', 7)->default('#0ea5e9'); // Default blue color
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add indexes for performance
        $this->addIndexes();
    }

    private function addIndexes(): void
    {
        // Add common indexes for better query performance
        Schema::table('crm_leads', function (Blueprint $table) {
            $table->index(['assigned_to', 'status']);
            $table->index(['expected_close_date', 'status']);
        });

        Schema::table('pos_sales', function (Blueprint $table) {
            $table->index(['cashier_id', 'created_at']);
            $table->index('created_at');
        });

        Schema::table('helpdesk_tickets', function (Blueprint $table) {
            $table->index(['assignee_id', 'status']);
            $table->index(['status', 'priority']);
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->index(['job_opening_id', 'status']);
            $table->index('status');
        });

        Schema::table('training_enrollments', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
            $table->index(['program_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop in reverse order of creation
        Schema::dropIfExists('document_categories');
        Schema::dropIfExists('dms_documents');
        Schema::dropIfExists('dms_folders');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_openings');
        Schema::dropIfExists('safety_trainings');
        Schema::dropIfExists('training_enrollments');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('performance_reviews');
        Schema::dropIfExists('user_benefits');
        Schema::dropIfExists('benefits');
        Schema::dropIfExists('user_skills');
        Schema::dropIfExists('competencies');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('onboarding_checklists');
        Schema::dropIfExists('analytics_reports');
        Schema::dropIfExists('compliance_requirements');
        Schema::dropIfExists('helpdesk_tickets');
        Schema::dropIfExists('quality_issues');
        Schema::dropIfExists('quality_inspections');
        Schema::dropIfExists('pos_sales');
        Schema::dropIfExists('pos_products');
        Schema::dropIfExists('pos_categories');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_categories');
        Schema::dropIfExists('crm_leads');
        Schema::dropIfExists('crm_customers');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('picnic_participants');
        Schema::dropIfExists('jurisdictions');
        Schema::dropIfExists('education');
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('daily_works_has_report');
        Schema::dropIfExists('daily_works');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('daily_summaries');
    }
};
