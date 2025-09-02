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
            // Drop the global unique index on device_id to allow same fingerprint across users
            // Note: index names follow Laravel's convention unless customized
            try {
                $table->dropUnique('user_devices_device_id_unique');
            } catch (Throwable $e) {
                // ignore if it doesn't exist
            }

            // Optional redundant non-unique index may exist; drop if present to avoid duplication
            try {
                $table->dropIndex('user_devices_device_id_index');
            } catch (Throwable $e) {
                // ignore if it doesn't exist
            }

            // Add a composite unique index per user to prevent collisions between different users
            $table->unique(['user_id', 'device_id'], 'user_devices_user_device_unique');

            // Recreate a simple index on device_id for faster lookups in where('device_id') queries
            $table->index('device_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            // Drop composite unique and device_id index
            try {
                $table->dropUnique('user_devices_user_device_unique');
            } catch (Throwable $e) {
                // ignore
            }

            try {
                $table->dropIndex('user_devices_device_id_index');
            } catch (Throwable $e) {
                // ignore
            }

            // Restore original unique constraint on device_id
            $table->unique('device_id');

            // Also add a named index to match original migration if needed
            $table->index('device_id');
        });
    }
};
