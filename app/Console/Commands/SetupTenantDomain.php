<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class SetupTenantDomain extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:setup-domain {tenant_id} {domain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up a domain for a tenant';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        $domainName = $this->argument('domain');

        $tenant = Tenant::find($tenantId);

        if (! $tenant) {
            $this->error("Tenant with ID '{$tenantId}' not found.");

            return 1;
        }

        $domain = $tenant->domains()->firstOrCreate([
            'domain' => $domainName,
        ]);

        if ($domain->wasRecentlyCreated) {
            $this->info("Domain '{$domainName}' created for tenant '{$tenantId}'.");
        } else {
            $this->info("Domain '{$domainName}' already exists for tenant '{$tenantId}'.");
        }

        $this->info("Tenant '{$tenantId}' can now be accessed at: http://{$domainName}");

        return 0;
    }
}
