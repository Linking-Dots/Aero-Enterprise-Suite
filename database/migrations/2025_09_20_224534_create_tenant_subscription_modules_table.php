<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_subscription_modules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_subscription_id');
            $table->unsignedBigInteger('module_id');
            $table->decimal('price', 8, 2)->default(0.00);
            $table->boolean('is_included')->default(false);
            $table->timestamps();

            $table->foreign('tenant_subscription_id')->references('id')->on('tenant_subscriptions')->onDelete('cascade');
            $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');

            $table->unique(['tenant_subscription_id', 'module_id'], 'tsm_subscription_module_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_subscription_modules');
    }
};
