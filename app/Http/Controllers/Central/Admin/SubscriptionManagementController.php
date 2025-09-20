<?php

namespace App\Http\Controllers\Central\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\SubscriptionPlan;
use App\Models\TenantSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SubscriptionManagementController extends Controller
{
    public function index()
    {
        $subscriptionPlans = SubscriptionPlan::with('modules')->orderBy('base_monthly_price')->get();
        $modules = Module::orderBy('name')->get();

        $stats = [
            'activePlans' => SubscriptionPlan::where('is_active', true)->count(),
            'activeModules' => Module::where('is_active', true)->count(),
            'totalSubscribers' => TenantSubscription::where('is_active', true)->count(),
            'monthlyRevenue' => TenantSubscription::where('billing_cycle', 'monthly')
                ->where('is_active', true)
                ->sum('total_price'),
        ];

        return Inertia::render('Central/Admin/SubscriptionManagement', [
            'subscriptionPlans' => $subscriptionPlans,
            'modules' => $modules,
            'stats' => $stats,
        ]);
    }

    public function storePlan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'base_monthly_price' => 'required|numeric|min:0',
            'base_yearly_price' => 'required|numeric|min:0',
            'max_employees' => 'nullable|integer|min:1',
            'max_storage_gb' => 'nullable|integer|min:1',
            'module_discount_percentage' => 'required|numeric|min:0|max:100',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        SubscriptionPlan::create($request->only([
            'name', 'description', 'base_monthly_price', 'base_yearly_price',
            'max_employees', 'max_storage_gb', 'module_discount_percentage',
            'is_popular', 'is_active',
        ]));

        return redirect()->route('admin.subscription.management')
            ->with('success', 'Subscription plan created successfully.');
    }

    public function updatePlan(Request $request, SubscriptionPlan $plan)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'base_monthly_price' => 'required|numeric|min:0',
            'base_yearly_price' => 'required|numeric|min:0',
            'max_employees' => 'nullable|integer|min:1',
            'max_storage_gb' => 'nullable|integer|min:1',
            'module_discount_percentage' => 'required|numeric|min:0|max:100',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $plan->update($request->only([
            'name', 'description', 'base_monthly_price', 'base_yearly_price',
            'max_employees', 'max_storage_gb', 'module_discount_percentage',
            'is_popular', 'is_active',
        ]));

        return redirect()->route('admin.subscription.management')
            ->with('success', 'Subscription plan updated successfully.');
    }

    public function destroyPlan(SubscriptionPlan $plan)
    {
        // Check if plan has active subscriptions
        $hasActiveSubscriptions = TenantSubscription::where('subscription_plan_id', $plan->id)
            ->where('is_active', true)
            ->exists();

        if ($hasActiveSubscriptions) {
            return back()->withErrors([
                'general' => 'Cannot delete plan with active subscriptions. Please deactivate it instead.',
            ]);
        }

        $plan->delete();

        return redirect()->route('admin.subscription.management')
            ->with('success', 'Subscription plan deleted successfully.');
    }

    public function storeModule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
            'icon' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        Module::create($request->only([
            'name', 'description', 'monthly_price', 'yearly_price',
            'icon', 'is_active',
        ]));

        return redirect()->route('admin.subscription.management')
            ->with('success', 'Module created successfully.');
    }

    public function updateModule(Request $request, Module $module)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
            'icon' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $module->update($request->only([
            'name', 'description', 'monthly_price', 'yearly_price',
            'icon', 'is_active',
        ]));

        return redirect()->route('admin.subscription.management')
            ->with('success', 'Module updated successfully.');
    }

    public function destroyModule(Module $module)
    {
        // Check if module has active subscriptions
        $hasActiveSubscriptions = $module->subscriptions()
            ->whereHas('subscription', function ($query) {
                $query->where('is_active', true);
            })
            ->exists();

        if ($hasActiveSubscriptions) {
            return back()->withErrors([
                'general' => 'Cannot delete module with active subscriptions. Please deactivate it instead.',
            ]);
        }

        $module->delete();

        return redirect()->route('admin.subscription.management')
            ->with('success', 'Module deleted successfully.');
    }
}
