<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'base_monthly_price',
        'base_yearly_price',
        'max_employees',
        'max_storage_gb',
        'included_modules',
        'module_discount_percentage',
        'is_popular',
        'is_active',
        'sort_order',
        'stripe_monthly_price_id',
        'stripe_yearly_price_id',
        'trial_days',
    ];

    protected $casts = [
        'included_modules' => 'array',
        'base_monthly_price' => 'decimal:2',
        'base_yearly_price' => 'decimal:2',
        'module_discount_percentage' => 'decimal:2',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get the modules available for this plan
     */
    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'plan_modules')
            ->withPivot([
                'custom_monthly_price',
                'custom_yearly_price',
                'discount_percentage',
                'is_included',
                'is_available'
            ])
            ->withTimestamps();
    }

    /**
     * Get tenant subscriptions for this plan
     */
    public function tenantSubscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class);
    }

    /**
     * Scope for active plans
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the total price for selected modules
     */
    public function calculateTotalPrice(array $selectedModuleIds, string $billingCycle = 'monthly'): float
    {
        $total = $billingCycle === 'monthly' ? $this->base_monthly_price : $this->base_yearly_price;
        
        $modules = $this->modules()->whereIn('modules.id', $selectedModuleIds)->get();
        
        foreach ($modules as $module) {
            // Check if module is included for free
            if ($module->pivot->is_included) {
                continue;
            }
            
            // Use custom price if set, otherwise use module's default price
            $price = $billingCycle === 'monthly' 
                ? ($module->pivot->custom_monthly_price ?? $module->monthly_price)
                : ($module->pivot->custom_yearly_price ?? $module->yearly_price);
            
            // Apply plan discount
            $discount = $module->pivot->discount_percentage ?? $this->module_discount_percentage;
            $price = $price * (1 - ($discount / 100));
            
            $total += $price;
        }
        
        return $total;
    }
}
