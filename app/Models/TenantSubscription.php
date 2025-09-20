<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TenantSubscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'subscription_plan_id',
        'billing_cycle',
        'total_price',
        'starts_at',
        'ends_at',
        'status',
        'trial_ends_at',
        'payment_method',
        'stripe_subscription_id',
        'next_billing_date',
        'is_active',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'next_billing_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'tenant_subscription_modules')
            ->withPivot(['price', 'is_included'])
            ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeTrial($query)
    {
        return $query->where('status', 'trial');
    }

    public function scopeExpired($query)
    {
        return $query->where('ends_at', '<', now());
    }

    // Helper methods
    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && $this->trial_ends_at > now();
    }

    public function isExpired(): bool
    {
        return $this->ends_at < now();
    }

    public function daysUntilExpiry(): int
    {
        return $this->ends_at->diffInDays(now());
    }

    public function calculateTotal(): float
    {
        $total = $this->plan->billing_cycle === 'monthly'
            ? $this->plan->base_monthly_price
            : $this->plan->base_yearly_price;

        foreach ($this->modules as $module) {
            if (! $module->pivot->is_included) {
                $total += $module->pivot->price;
            }
        }

        return $total;
    }
}
