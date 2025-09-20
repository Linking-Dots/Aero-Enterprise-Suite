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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            // Basic project information
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->integer('client_id')->nullable();

            // Project leadership
            $table->foreignId('project_leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('team_leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');

            // Project classification
            $table->string('status')->default('not_started');
            $table->string('priority')->nullable();
            $table->enum('methodology', ['waterfall', 'agile', 'scrum', 'prince2', 'kanban', 'hybrid', 'other'])->default('agile');
            $table->string('project_type')->nullable()->comment('digital, enhancement, analytics, integration, security, marketing');
            $table->string('color')->nullable();

            // Timeline management
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('planned_start_date')->nullable();
            $table->date('planned_end_date')->nullable();
            $table->date('actual_start_date')->nullable();
            $table->date('actual_end_date')->nullable();
            $table->integer('estimated_hours')->nullable();

            // Budget and financial tracking
            $table->decimal('rate', 10, 2)->nullable();
            $table->string('rate_type')->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->decimal('budget_allocated', 15, 2)->default(0.00);
            $table->decimal('budget_spent', 15, 2)->default(0.00);
            $table->decimal('budget_committed', 15, 2)->default(0.00);
            $table->decimal('expected_roi', 8, 2)->nullable()->comment('Expected Return on Investment percentage');

            // Progress tracking
            $table->integer('open_tasks')->default(0);
            $table->integer('completed_tasks')->default(0);
            $table->integer('progress')->default(0);

            // ISO 21500 & PMBOK Performance Metrics
            $table->decimal('spi', 5, 2)->default(1.00)->comment('Schedule Performance Index');
            $table->decimal('cpi', 5, 2)->default(1.00)->comment('Cost Performance Index');
            $table->decimal('budget_utilization', 5, 2)->default(0.00)->comment('Budget utilization percentage');

            // Health and Risk Management
            $table->enum('health_status', ['good', 'at_risk', 'critical', 'unknown'])->default('unknown');
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->text('risk_factors')->nullable()->comment('Risk assessment details');

            // Strategic Alignment
            $table->integer('strategic_importance')->default(50)->comment('Strategic importance score 0-100');
            $table->integer('business_impact')->default(50)->comment('Business impact score 0-100');
            $table->string('business_unit')->nullable();
            $table->string('portfolio_category')->nullable();

            // Team and Resource Management
            $table->integer('team_size')->default(0);
            $table->decimal('resource_utilization', 5, 2)->default(0.00)->comment('Resource utilization percentage');
            $table->json('skill_requirements')->nullable()->comment('Required skills and competencies');

            // Quality and Documentation
            $table->integer('quality_score')->default(0)->comment('Overall project quality score');
            $table->text('quality_notes')->nullable();
            $table->text('lessons_learned')->nullable();
            $table->text('success_criteria')->nullable();
            $table->json('deliverables')->nullable();
            $table->json('milestones')->nullable();

            // Stakeholder Management
            $table->json('stakeholders')->nullable()->comment('Key stakeholders and their roles');
            $table->json('communication_plan')->nullable();

            // External Integration
            $table->string('external_project_id')->nullable();
            $table->json('external_integrations')->nullable();
            $table->string('jira_project_key')->nullable();
            $table->string('confluence_space')->nullable();

            // Archive Management
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            $table->unsignedBigInteger('archived_by')->nullable();
            $table->text('archive_reason')->nullable();

            // Files and Notes
            $table->json('files')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['status', 'priority']);
            $table->index(['health_status', 'risk_level']);
            $table->index(['methodology', 'project_type']);
            $table->index(['is_archived', 'archived_at']);
            $table->index(['business_unit', 'portfolio_category']);
            $table->index(['project_leader_id', 'status']);
            $table->index(['department_id', 'status']);
        });

        // Create project milestones table
        Schema::create('project_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('not_started');
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        // Create project tasks table
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('milestone_id')->nullable()->constrained('project_milestones')->onDelete('set null');
            $table->foreignId('parent_task_id')->nullable()->references('id')->on('project_tasks')->onDelete('set null');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('todo');
            $table->string('priority')->default('medium');
            $table->integer('estimated_hours')->nullable();
            $table->integer('actual_hours')->default(0);
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index(['milestone_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        // Create project task comments table
        Schema::create('project_task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('comment');
            $table->timestamps();
        });

        // Create project task attachments table
        Schema::create('project_task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('filename');
            $table->string('original_name');
            $table->string('mime_type');
            $table->integer('size');
            $table->timestamps();
        });

        // Create project issues table
        Schema::create('project_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->string('severity')->default('medium');
            $table->string('status')->default('open');
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        // Create project task issues table (junction table)
        Schema::create('project_task_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('issue_id')->constrained('project_issues')->onDelete('cascade');
            $table->timestamps();
        });

        // Create project resources table
        Schema::create('project_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role')->nullable();
            $table->integer('allocation_percentage')->default(100);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        // Additional project-related tables from other migrations
        Schema::create('project_time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained('project_tasks')->onDelete('set null');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->datetime('start_time');
            $table->datetime('end_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->text('description')->nullable();
            $table->boolean('billable')->default(true);
            $table->decimal('hourly_rate', 8, 2)->nullable();
            $table->timestamps();

            $table->index(['project_id', 'user_id']);
            $table->index(['start_time', 'end_time']);
        });

        Schema::create('project_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('category'); // labor, materials, overhead, etc.
            $table->decimal('allocated_amount', 15, 2);
            $table->decimal('spent_amount', 15, 2)->default(0);
            $table->decimal('committed_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('project_budget_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_id')->constrained('project_budgets')->onDelete('cascade');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->date('expense_date');
            $table->string('vendor')->nullable();
            $table->string('receipt_file')->nullable();
            $table->timestamps();
        });

        Schema::create('project_task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('depends_on_task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->enum('dependency_type', ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])->default('finish_to_start');
            $table->integer('lag_days')->default(0);
            $table->timestamps();

            $table->unique(['task_id', 'depends_on_task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_task_dependencies');
        Schema::dropIfExists('project_budget_expenses');
        Schema::dropIfExists('project_budgets');
        Schema::dropIfExists('project_time_entries');
        Schema::dropIfExists('project_resources');
        Schema::dropIfExists('project_task_issues');
        Schema::dropIfExists('project_issues');
        Schema::dropIfExists('project_task_attachments');
        Schema::dropIfExists('project_task_comments');
        Schema::dropIfExists('project_tasks');
        Schema::dropIfExists('project_milestones');
        Schema::dropIfExists('projects');
    }
};
