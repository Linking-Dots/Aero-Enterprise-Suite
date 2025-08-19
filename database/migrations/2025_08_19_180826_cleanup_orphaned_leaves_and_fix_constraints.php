<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, clean up orphaned leave records where user_id doesn't exist in users table
        DB::statement('
            DELETE leaves FROM leaves 
            LEFT JOIN users ON leaves.user_id = users.id 
            WHERE users.id IS NULL
        ');
        
        // Also clean up orphaned leave records where leave_type doesn't exist in leave_settings table
        DB::statement('
            DELETE leaves FROM leaves 
            LEFT JOIN leave_settings ON leaves.leave_type = leave_settings.id 
            WHERE leave_settings.id IS NULL
        ');
        
        // Now ensure proper foreign key constraints exist
        Schema::table('leaves', function (Blueprint $table) {
            // Drop existing foreign keys if they exist (in case they're malformed)
            try {
                $table->dropForeign(['user_id']);
            } catch (\Exception $e) {
                // Ignore if foreign key doesn't exist
            }
            
            try {
                $table->dropForeign(['leave_type']);
            } catch (\Exception $e) {
                // Ignore if foreign key doesn't exist
            }
            
            // Add proper foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('leave_type')->references('id')->on('leave_settings')->onDelete('cascade');
        });
        
        // Log the cleanup
        Log::info('Cleaned up orphaned leave records and added proper foreign key constraints');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['leave_type']);
        });
    }
};
