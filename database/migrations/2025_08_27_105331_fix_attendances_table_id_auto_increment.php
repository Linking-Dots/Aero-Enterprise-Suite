<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix the attendances table id column to be auto increment
        DB::statement('ALTER TABLE attendances MODIFY COLUMN id bigint unsigned NOT NULL AUTO_INCREMENT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove auto increment from id column
        DB::statement('ALTER TABLE attendances MODIFY COLUMN id bigint unsigned NOT NULL');
    }
};
