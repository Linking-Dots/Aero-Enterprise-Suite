<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Fortify\Fortify;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Basic user information
            $table->integer('employee_id')->nullable();
            $table->string('user_name');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->unique()->nullable();

            // Two-factor authentication (from 2025_05_27_225232)
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            if (Fortify::confirmsTwoFactorAuthentication()) {
                $table->timestamp('two_factor_confirmed_at')->nullable();
            }

            // Organization relationships
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('designation_id')->nullable()->constrained('designations')->nullOnDelete();
            $table->foreignId('report_to')->nullable()->constrained('users')->nullOnDelete();

            // Personal information
            $table->text('address')->nullable();
            $table->text('about')->nullable();
            $table->date('date_of_joining')->nullable();
            $table->date('birthday')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('religion')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('employment_of_spouse')->nullable();
            $table->integer('number_of_children')->nullable();

            // Identity documents
            $table->string('nid')->nullable();
            $table->string('passport_no')->nullable();
            $table->date('passport_exp_date')->nullable();
            $table->string('pan_no')->nullable();

            // Emergency contacts
            $table->string('emergency_contact_primary_name')->nullable();
            $table->string('emergency_contact_primary_relationship')->nullable();
            $table->string('emergency_contact_primary_phone')->nullable();
            $table->string('emergency_contact_secondary_name')->nullable();
            $table->string('emergency_contact_secondary_relationship')->nullable();
            $table->string('emergency_contact_secondary_phone')->nullable();

            // Family information
            $table->string('family_member_name')->nullable();
            $table->string('family_member_relationship')->nullable();
            $table->date('family_member_dob')->nullable();
            $table->string('family_member_phone')->nullable();

            // Banking information
            $table->string('bank_name')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('ifsc_code')->nullable();

            // Salary information
            $table->string('salary_basis')->nullable();
            $table->decimal('salary_amount', 10, 2)->nullable();
            $table->string('payment_type')->nullable();

            // PF (Provident Fund) information
            $table->boolean('pf_contribution')->nullable();
            $table->string('pf_no')->nullable();
            $table->string('employee_pf_rate')->nullable();
            $table->string('additional_pf_rate')->nullable();
            $table->string('total_pf_rate')->nullable();

            // ESI (Employee State Insurance) information
            $table->boolean('esi_contribution')->nullable();
            $table->string('esi_no')->nullable();
            $table->string('employee_esi_rate')->nullable();
            $table->string('additional_esi_rate')->nullable();
            $table->string('total_esi_rate')->nullable();

            // Attendance management
            $table->foreignId('attendance_type_id')->nullable()->constrained('attendance_types')->nullOnDelete();
            $table->json('attendance_config')->nullable();

            // User preferences (from 2025_07_10_223143)
            $table->json('preferences')->nullable();

            // Status and control fields
            $table->boolean('active')->default(true);

            // Single device login (from 2025_08_23_171631)
            $table->boolean('single_device_login')->default(false);

            // Enhanced auth fields (from 2025_08_13_000001)
            $table->string('timezone')->default('UTC');
            $table->string('locale')->default('en');
            $table->json('notification_preferences')->nullable();
            $table->json('ui_preferences')->nullable();
            $table->json('security_settings')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->integer('login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_changed_at')->nullable();
            $table->json('session_data')->nullable();
            $table->string('avatar_url')->nullable();
            $table->boolean('email_notifications')->default(true);
            $table->boolean('sms_notifications')->default(false);
            $table->boolean('push_notifications')->default(true);
            $table->string('mobile_device_token')->nullable();
            $table->json('role_permissions_cache')->nullable();
            $table->timestamp('terms_accepted_at')->nullable();
            $table->string('terms_version')->nullable();
            $table->timestamp('privacy_accepted_at')->nullable();
            $table->string('privacy_version')->nullable();
            $table->json('custom_fields')->nullable();
            $table->text('notes')->nullable();
            $table->json('tags')->nullable();
            $table->decimal('hourly_rate', 8, 2)->nullable();
            $table->string('employee_type')->nullable();
            $table->string('employment_status')->default('active');
            $table->json('skills')->nullable();
            $table->json('certifications')->nullable();
            $table->json('languages')->nullable();
            $table->date('probation_end_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->string('work_location')->nullable();
            $table->boolean('remote_work_enabled')->default(false);
            $table->json('emergency_contacts')->nullable();
            $table->json('dependent_info')->nullable();
            $table->string('employee_status')->default('active');
            $table->timestamp('status_changed_at')->nullable();
            $table->unsignedBigInteger('status_changed_by')->nullable();
            $table->text('status_reason')->nullable();

            // Laravel default fields
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['active', 'deleted_at']);
            $table->index(['department_id', 'active']);
            $table->index(['designation_id', 'active']);
            $table->index(['email_verified_at']);
            $table->index(['last_login_at']);
            $table->index(['employee_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
