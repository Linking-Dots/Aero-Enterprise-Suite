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
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('device_id')->unique(); // Unique device identifier
            $table->string('device_name')->nullable(); // Human readable device name
            $table->string('browser_name')->nullable();
            $table->string('browser_version')->nullable();
            $table->string('platform')->nullable(); // OS information
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->ipAddress('ip_address');
            $table->text('user_agent');
            $table->string('session_id')->nullable();
            $table->timestamp('last_activity')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_trusted')->default(false); // For future trusted device feature
            $table->json('device_fingerprint')->nullable(); // Additional device identification data
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index('device_id');
            $table->index('session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
