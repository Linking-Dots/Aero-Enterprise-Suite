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
        Schema::create('plan_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->decimal('custom_monthly_price', 8, 2)->nullable(); // Plan-specific pricing override
            $table->decimal('custom_yearly_price', 8, 2)->nullable(); // Plan-specific pricing override
            $table->decimal('discount_percentage', 5, 2)->default(0); // Discount for this plan
            $table->boolean('is_included')->default(false); // Free with this plan
            $table->boolean('is_available')->default(true); // Available for this plan
            $table->timestamps();

            $table->unique(['subscription_plan_id', 'module_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_modules');
    }
};
