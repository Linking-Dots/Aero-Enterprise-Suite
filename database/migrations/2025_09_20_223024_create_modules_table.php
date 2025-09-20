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
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., 'HR Management', 'Project Management', 'Quality Management'
            $table->string('slug')->unique(); // e.g., 'hr-management', 'project-management'
            $table->text('description');
            $table->string('icon')->nullable(); // Icon class or path
            $table->string('color')->default('#3B82F6'); // Module color theme
            $table->decimal('monthly_price', 8, 2); // Price per month per module
            $table->decimal('yearly_price', 8, 2); // Price per year per module (usually discounted)
            $table->json('features'); // Array of features included in this module
            $table->json('dependencies')->nullable(); // Other modules this depends on
            $table->boolean('is_core')->default(false); // Core modules (required for basic functionality)
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->string('category')->nullable(); // e.g., 'management', 'compliance', 'analytics'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
