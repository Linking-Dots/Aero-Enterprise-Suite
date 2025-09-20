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
            $table->string('device_model')->nullable()->after('compatible_device_id');
            $table->string('device_serial')->nullable()->after('device_model');
            $table->string('device_mac')->nullable()->after('device_serial');

            // Optional indexes to help lookups; do not enforce uniqueness globally
            $table->index('device_model');
            $table->index('device_serial');
            $table->index('device_mac');

            // For stronger per-user uniqueness, add a composite unique index if all three are present
            // This remains nullable, but MySQL ignores NULL in unique combinations, so it won't block inserts without values
            $table->unique(['user_id', 'device_model', 'device_serial', 'device_mac'], 'user_devices_user_hardware_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            try {
                $table->dropUnique('user_devices_user_hardware_unique');
            } catch (Throwable $e) {
            }
            try {
                $table->dropIndex(['device_model']);
            } catch (Throwable $e) {
            }
            try {
                $table->dropIndex(['device_serial']);
            } catch (Throwable $e) {
            }
            try {
                $table->dropIndex(['device_mac']);
            } catch (Throwable $e) {
            }

            $table->dropColumn(['device_model', 'device_serial', 'device_mac']);
        });
    }
};
