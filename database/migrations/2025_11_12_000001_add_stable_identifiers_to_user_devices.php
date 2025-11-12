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
        Schema::table('user_devices', function (Blueprint $table) {
            // Stable device identifiers (more reliable than browser fingerprints)
            $table->string('fcm_token')->nullable()->after('compatible_device_id')->index();
            $table->string('device_guid')->nullable()->after('fcm_token')->index();
            $table->string('device_uuid')->nullable()->after('device_guid')->index();

            // Add index on user_id for faster queries
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn(['fcm_token', 'device_guid', 'device_uuid']);
        });
    }
};
