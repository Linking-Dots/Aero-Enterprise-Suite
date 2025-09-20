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
        Schema::create('leave_settings', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->integer('days');
            $table->string('eligibility')->nullable(); // Allow for complex criteria descriptions
            $table->boolean('carry_forward')->default(false);
            $table->boolean('earned_leave')->default(false);
            $table->text('special_conditions')->nullable(); // Allow longer text for special conditions
            $table->timestamps();
        });

        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('leave_type')->constrained('leave_settings')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('days');
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('approved_by')->nullable();
            $table->text('approved_at')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index(['leave_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
        Schema::dropIfExists('leave_settings');
    }
};
