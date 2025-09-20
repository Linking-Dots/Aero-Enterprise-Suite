<?php

namespace App\Jobs;

use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Jobs\MigrateDatabase;

class MigrateTenantWithDependencies extends MigrateDatabase
{
    public function handle()
    {
        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            // Run the parent migration process
            parent::handle();
        } finally {
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
}
