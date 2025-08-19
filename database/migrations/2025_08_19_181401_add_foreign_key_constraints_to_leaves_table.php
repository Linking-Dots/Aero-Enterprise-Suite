<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, ensure there are no orphaned records
        DB::statement('
            DELETE leaves FROM leaves 
            LEFT JOIN users ON leaves.user_id = users.id 
            WHERE users.id IS NULL
        ');
        
        DB::statement('
            DELETE leaves FROM leaves 
            LEFT JOIN leave_settings ON leaves.leave_type = leave_settings.id 
            WHERE leave_settings.id IS NULL
        ');

        // Check current table engine and modify if needed
        $tableStatus = DB::select("SHOW TABLE STATUS LIKE 'leaves'");
        if (!empty($tableStatus) && $tableStatus[0]->Engine !== 'InnoDB') {
            DB::statement('ALTER TABLE leaves ENGINE = InnoDB');
        }
        
        // Check if constraints already exist and drop them
        $existingConstraints = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'leaves' 
            AND CONSTRAINT_NAME LIKE '%foreign%'
        ");
        
        foreach ($existingConstraints as $constraint) {
            try {
                DB::statement("ALTER TABLE leaves DROP FOREIGN KEY {$constraint->CONSTRAINT_NAME}");
            } catch (\Exception $e) {
                // Ignore if already dropped
            }
        }
        
        // Add proper foreign key constraints using raw SQL for more control
        DB::statement('
            ALTER TABLE leaves 
            ADD CONSTRAINT fk_leaves_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) 
            ON DELETE CASCADE ON UPDATE CASCADE
        ');
        
        DB::statement('
            ALTER TABLE leaves 
            ADD CONSTRAINT fk_leaves_leave_type 
            FOREIGN KEY (leave_type) REFERENCES leave_settings(id) 
            ON DELETE CASCADE ON UPDATE CASCADE
        ');
        
        // If approved_by column exists, add constraint for it too
        if (Schema::hasColumn('leaves', 'approved_by')) {
            DB::statement('
                ALTER TABLE leaves 
                ADD CONSTRAINT fk_leaves_approved_by 
                FOREIGN KEY (approved_by) REFERENCES users(id) 
                ON DELETE SET NULL ON UPDATE CASCADE
            ');
        }
        
        echo "Foreign key constraints added successfully\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            try {
                $table->dropForeign('fk_leaves_user_id');
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
            
            try {
                $table->dropForeign('fk_leaves_leave_type');
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
            
            try {
                $table->dropForeign('fk_leaves_approved_by');
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
        });
    }
};
