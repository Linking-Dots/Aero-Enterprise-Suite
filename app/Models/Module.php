<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Module extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'color',
        'monthly_price',
        'yearly_price',
        'features',
        'dependencies',
        'is_core',
        'is_active',
        'sort_order',
        'category',
    ];

    protected $casts = [
        'features' => 'array',
        'dependencies' => 'array',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'is_core' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get the subscription plans that include this module
     */
    public function subscriptionPlans(): BelongsToMany
    {
        return $this->belongsToMany(SubscriptionPlan::class, 'plan_modules')
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
     * Scope for active modules
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for core modules
     */
    public function scopeCore($query)
    {
        return $query->where('is_core', true);
    }

    /**
     * Check if this module depends on another module
     */
    public function dependsOn(Module $module): bool
    {
        return in_array($module->id, $this->dependencies ?? []);
    }

    /**
     * Get modules that depend on this one
     */
    public function getDependentModules()
    {
        return static::where('dependencies', 'like', '%"'.$this->id.'"%')->get();
    }

    /**
     * Get price for a specific billing cycle with optional plan context
     */
    public function getPriceForCycle(string $cycle = 'monthly', ?SubscriptionPlan $plan = null): float
    {
        $basePrice = $cycle === 'monthly' ? $this->monthly_price : $this->yearly_price;
        
        // If plan is provided and has custom pricing, use that
        if ($plan) {
            $planModule = $plan->modules()->where('modules.id', $this->id)->first();
            if ($planModule && $planModule->pivot) {
                $customPrice = $cycle === 'monthly' 
                    ? $planModule->pivot->custom_monthly_price 
                    : $planModule->pivot->custom_yearly_price;
                    
                if ($customPrice !== null) {
                    $basePrice = $customPrice;
                }
                
                // Apply plan discount
                $discount = $planModule->pivot->discount_percentage ?? $plan->module_discount_percentage;
                $basePrice *= (1 - ($discount / 100));
            }
        }
        
        return $basePrice;
    }
}
