<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class UserDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'device_id',
        'compatible_device_id',
        'device_name',
        'browser_name',
        'browser_version',
        'platform',
        'device_type',
        'ip_address',
        'user_agent',
        'session_id',
        'last_activity',
        'is_active',
        'is_trusted',
        'device_fingerprint',
    ];

    protected $casts = [
        'last_activity' => 'datetime',
        'is_active' => 'boolean',
        'is_trusted' => 'boolean',
        'device_fingerprint' => 'array',
    ];

    /**
     * Get the user that owns the device.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get only active devices.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get devices for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if device is currently online (active within last 5 minutes).
     */
    public function isOnline(): bool
    {
        if (!$this->last_activity) {
            return false;
        }

        return $this->last_activity->gt(Carbon::now()->subMinutes(5));
    }

    /**
     * Get formatted device info for display.
     */
    public function getFormattedDeviceInfoAttribute(): string
    {
        $parts = array_filter([
            $this->browser_name,
            $this->platform,
            $this->device_type,
        ]);

        return implode(' • ', $parts) ?: 'Unknown Device';
    }

    /**
     * Get device location info.
     */
    public function getLocationAttribute(): string
    {
        // You can enhance this with IP geolocation service
        return $this->ip_address ?: 'Unknown Location';
    }

    /**
     * Deactivate this device.
     */
    public function deactivate(): bool
    {
        return $this->update([
            'is_active' => false,
            'session_id' => null,
        ]);
    }

    /**
     * Update device activity.
     */
    public function updateActivity(string $sessionId = null): bool
    {
        return $this->update([
            'last_activity' => Carbon::now(),
            'session_id' => $sessionId ?: $this->session_id,
        ]);
    }
}
