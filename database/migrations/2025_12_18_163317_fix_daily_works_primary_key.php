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
        // Add primary key to daily_works table if missing
        DB::statement('ALTER TABLE daily_works ADD PRIMARY KEY (id)');
        DB::statement('ALTER TABLE daily_works MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot safely reverse this - primary key should remain
    }
};
