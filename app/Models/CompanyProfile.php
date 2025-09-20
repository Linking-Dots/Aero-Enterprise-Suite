<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyProfile extends Model
{
    protected $fillable = [
        'tenant_id',
        'company_name',
        'contact_email',
        'contact_phone',
        'industry',
        'company_size',
        'website',
        'description',
        'timezone',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the tenant that owns this company profile.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }
}
