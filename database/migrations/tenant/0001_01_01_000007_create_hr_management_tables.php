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
        // Company Settings
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, number, boolean, json
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // Holidays Management
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('from_date');
            $table->date('to_date');
            $table->enum('type', ['public', 'company', 'optional'])->default('company');
            $table->text('description')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_type')->nullable(); // yearly, monthly, etc.
            $table->json('applicable_departments')->nullable();
            $table->json('applicable_designations')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['from_date', 'to_date']);
            $table->index(['type', 'is_active']);
        });

        // Attendance Management
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->time('punchin')->nullable();
            $table->time('punchout')->nullable();
            $table->string('punchin_location')->nullable();
            $table->string('punchout_location')->nullable();
            $table->json('punchin_coordinates')->nullable();
            $table->json('punchout_coordinates')->nullable();
            $table->enum('status', ['present', 'absent', 'late', 'early_leave', 'half_day'])->default('present');
            $table->integer('total_hours')->nullable();
            $table->integer('break_duration')->default(0);
            $table->text('notes')->nullable();
            $table->enum('inspection_result', ['pass', 'fail'])->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
            $table->index(['date', 'status']);
            $table->index(['user_id', 'date']);
        });

        // User Devices for single device login
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('device_id');
            $table->string('device_name')->nullable();
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->string('ip_address')->nullable();
            $table->json('user_agent')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->string('compatible_device_id')->nullable();
            $table->json('hardware_identity')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index(['device_id', 'is_active']);
        });

        // Security Events
        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type'); // login, logout, failed_login, password_change, etc.
            $table->string('ip_address')->nullable();
            $table->json('user_agent')->nullable();
            $table->json('metadata')->nullable(); // Additional event-specific data
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('low');
            $table->text('description')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['user_id', 'event_type']);
            $table->index(['event_type', 'occurred_at']);
            $table->index(['risk_level', 'occurred_at']);
        });

        // Media Library
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->uuid('uuid')->nullable()->unique();
            $table->string('collection_name');
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            $table->unsignedBigInteger('size');
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            $table->unsignedInteger('order_column')->nullable();
            $table->nullableTimestamps();

            $table->index(['model_type', 'model_id']);
            $table->index('collection_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
        Schema::dropIfExists('security_events');
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('company_settings');
    }
};
