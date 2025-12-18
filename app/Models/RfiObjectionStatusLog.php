<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfiObjectionStatusLog extends Model
{
    /**
     * Disable auto timestamps since we use changed_at
     */
    public $timestamps = false;

    protected $fillable = [
        'rfi_objection_id',
        'from_status',
        'to_status',
        'notes',
        'changed_by',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    /**
     * Get the objection this log belongs to.
     */
    public function objection(): BelongsTo
    {
        return $this->belongsTo(RfiObjection::class, 'rfi_objection_id');
    }

    /**
     * Get the user who made the change.
     */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Get human-readable from status label.
     */
    public function getFromStatusLabelAttribute(): ?string
    {
        if (! $this->from_status) {
            return null;
        }

        return RfiObjection::$statusLabels[$this->from_status] ?? ucfirst(str_replace('_', ' ', $this->from_status));
    }

    /**
     * Get human-readable to status label.
     */
    public function getToStatusLabelAttribute(): string
    {
        return RfiObjection::$statusLabels[$this->to_status] ?? ucfirst(str_replace('_', ' ', $this->to_status));
    }
}
