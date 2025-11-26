<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            // 1. Fix foreign key cascade behavior (Action Item 1)
            // Drop existing foreign keys
            $table->dropForeign(['incharge']);
            $table->dropForeign(['assigned']);
            
            // Re-add with restrict on delete to prevent cascading deletions
            $table->foreign('incharge')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('assigned')->references('id')->on('users')->onDelete('restrict');
            
            // 2. Add unique constraint on RFI number (Action Item 2)
            $table->unique('number', 'daily_works_number_unique');
            
            // 3. Add performance indexes (Action Item 3)
            $table->index(['status', 'date'], 'daily_works_status_date_index');
            $table->index(['incharge', 'date'], 'daily_works_incharge_date_index');
            $table->index(['assigned', 'status'], 'daily_works_assigned_status_index');
            $table->index('type', 'daily_works_type_index');
            $table->index('completion_time', 'daily_works_completion_time_index');
        });

        // 4. Fix resubmission_date data type (Action Item 4)
        // First, add new column with correct type
        Schema::table('daily_works', function (Blueprint $table) {
            $table->date('resubmission_date_new')->nullable()->after('resubmission_date');
        });

        // Migrate data from text to date format
        DB::statement("
            UPDATE daily_works 
            SET resubmission_date_new = 
                CASE 
                    WHEN resubmission_date IS NOT NULL AND resubmission_date != '' 
                    THEN STR_TO_DATE(resubmission_date, '%Y-%m-%d')
                    ELSE NULL 
                END
        ");

        // Drop old column and rename new column
        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropColumn('resubmission_date');
        });

        Schema::table('daily_works', function (Blueprint $table) {
            $table->renameColumn('resubmission_date_new', 'resubmission_date');
        });

        // 6. Add soft deletes (Action Item 6)
        Schema::table('daily_works', function (Blueprint $table) {
            $table->softDeletes();
        });

        // 5. Add enum validation columns (Action Item 5) - Using check constraints if MySQL 8.0.16+
        // Note: For older MySQL versions, this will be handled in the model
        if (DB::getDriverName() === 'mysql') {
            $version = DB::selectOne("SELECT VERSION() as version")->version;
            if (version_compare($version, '8.0.16', '>=')) {
                DB::statement("
                    ALTER TABLE daily_works 
                    ADD CONSTRAINT daily_works_status_check 
                    CHECK (status IN ('new', 'in-progress', 'completed', 'rejected', 'resubmission', 'pending'))
                ");
                
                DB::statement("
                    ALTER TABLE daily_works 
                    ADD CONSTRAINT daily_works_inspection_result_check 
                    CHECK (inspection_result IS NULL OR inspection_result IN ('pass', 'fail', 'conditional', 'pending', 'approved', 'rejected'))
                ");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove check constraints
        if (DB::getDriverName() === 'mysql') {
            try {
                DB::statement('ALTER TABLE daily_works DROP CONSTRAINT IF EXISTS daily_works_status_check');
                DB::statement('ALTER TABLE daily_works DROP CONSTRAINT IF EXISTS daily_works_inspection_result_check');
            } catch (\Exception $e) {
                // Constraints might not exist in older MySQL versions
            }
        }

        Schema::table('daily_works', function (Blueprint $table) {
            // Remove soft deletes
            $table->dropSoftDeletes();
            
            // Change resubmission_date back to text
            $table->text('resubmission_date_text')->nullable();
        });

        DB::statement("UPDATE daily_works SET resubmission_date_text = resubmission_date");

        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropColumn('resubmission_date');
            $table->renameColumn('resubmission_date_text', 'resubmission_date');
            
            // Remove indexes
            $table->dropIndex('daily_works_completion_time_index');
            $table->dropIndex('daily_works_type_index');
            $table->dropIndex('daily_works_assigned_status_index');
            $table->dropIndex('daily_works_incharge_date_index');
            $table->dropIndex('daily_works_status_date_index');
            
            // Remove unique constraint
            $table->dropUnique('daily_works_number_unique');
            
            // Restore cascade delete foreign keys
            $table->dropForeign(['incharge']);
            $table->dropForeign(['assigned']);
            $table->foreign('incharge')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('assigned')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
