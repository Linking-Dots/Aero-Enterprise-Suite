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
        Schema::create('rfi_objections', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to daily_works (RFI)
            $table->foreignId('daily_work_id')
                ->constrained('daily_works')
                ->onDelete('cascade');
            
            // Objection details
            $table->string('title', 255);
            $table->string('category', 100)->nullable(); // design_conflict, site_mismatch, material_change, safety_concern, specification_error, other
            $table->text('description');
            $table->text('reason'); // Detailed reason for objection
            
            // Status workflow: draft, submitted, under_review, resolved, rejected
            $table->string('status', 50)->default('draft');
            
            // Resolution details
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            
            // Author tracking
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Audit trail for submission date override (when objection is overridden)
            $table->boolean('was_overridden')->default(false);
            $table->text('override_reason')->nullable();
            $table->foreignId('overridden_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('overridden_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for common queries
            $table->index('status');
            $table->index(['daily_work_id', 'status']);
            $table->index('created_by');
            $table->index('created_at');
        });

        // Create audit log table for objection status changes
        Schema::create('rfi_objection_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfi_objection_id')
                ->constrained('rfi_objections')
                ->onDelete('cascade');
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50);
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('changed_at');
            
            $table->index(['rfi_objection_id', 'changed_at']);
        });

        // Create audit log for RFI submission date overrides when objections exist
        Schema::create('rfi_submission_override_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')
                ->constrained('daily_works')
                ->onDelete('cascade');
            $table->date('old_submission_date')->nullable();
            $table->date('new_submission_date');
            $table->integer('active_objections_count');
            $table->text('override_reason');
            $table->boolean('user_acknowledged')->default(true);
            $table->foreignId('overridden_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('created_at');
            
            $table->index(['daily_work_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rfi_submission_override_logs');
        Schema::dropIfExists('rfi_objection_status_logs');
        Schema::dropIfExists('rfi_objections');
    }
};
