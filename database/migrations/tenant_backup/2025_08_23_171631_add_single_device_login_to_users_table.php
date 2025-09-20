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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('single_device_login_enabled')->default(false)->after('email_verified_at');
            $table->timestamp('device_reset_at')->nullable()->after('single_device_login_enabled');
            $table->text('device_reset_reason')->nullable()->after('device_reset_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['single_device_login_enabled', 'device_reset_at', 'device_reset_reason']);
        });
    }
};
