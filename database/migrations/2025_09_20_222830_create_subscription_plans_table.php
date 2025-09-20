<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., 'Starter', 'Professional', 'Enterprise'
            $table->string('slug')->unique(); // e.g., 'starter', 'professional', 'enterprise'
            $table->text('description');
            $table->decimal('base_monthly_price', 8, 2)->default(0); // Base plan price (might be 0)
            $table->decimal('base_yearly_price', 8, 2)->default(0); // Base plan price (might be 0)
            $table->integer('max_employees')->nullable(); // null for unlimited
            $table->integer('max_storage_gb')->nullable(); // null for unlimited
            $table->json('included_modules')->nullable(); // Array of module IDs included for free
            $table->decimal('module_discount_percentage', 5, 2)->default(0); // Discount on modules
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->string('stripe_monthly_price_id')->nullable();
            $table->string('stripe_yearly_price_id')->nullable();
            $table->integer('trial_days')->default(14); // Trial period in days
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
