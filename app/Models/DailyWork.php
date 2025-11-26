<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class DailyWork extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity, SoftDeletes;

    // Action Item 5: Define valid enum values (aligned with frontend)
    public const STATUS_NEW = 'new';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_RESUBMISSION = 'resubmission';

    public const STATUS_EMERGENCY = 'emergency';

    public const INSPECTION_PASS = 'pass';

    public const INSPECTION_FAIL = 'fail';

    public static array $statuses = [
        self::STATUS_NEW,
        self::STATUS_COMPLETED,
        self::STATUS_RESUBMISSION,
        self::STATUS_EMERGENCY,
    ];

    public static array $inspectionResults = [
        self::INSPECTION_PASS,
        self::INSPECTION_FAIL,
    ];

    protected $fillable = [
        'date',
        'number',
        'status',
        'inspection_result',
        'type',
        'description',
        'location',
        'side',
        'qty_layer',
        'planned_time',
        'incharge',
        'assigned',
        'completion_time',
        'inspection_details',
        'resubmission_count',
        'resubmission_date',
        'rfi_submission_date',
    ];

    protected $casts = [
        'date' => 'date',
        'completion_time' => 'datetime',
        'rfi_submission_date' => 'date',
        'resubmission_date' => 'date', // Action Item 4: Fixed cast
        'resubmission_count' => 'integer',
    ];

    // Action Item 7: Activity logging configuration
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'date', 'number', 'status', 'inspection_result', 'type',
                'description', 'location', 'completion_time', 'inspection_details',
                'incharge', 'assigned', 'resubmission_count',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "Daily work has been {$eventName}");
    }

    // Relationships
    public function reports()
    {
        return $this->belongsToMany(Report::class, 'daily_work_has_report', 'daily_work_id', 'report_id');
    }

    public function inchargeUser()
    {
        return $this->belongsTo(User::class, 'incharge');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopePending($query)
    {
        return $query->where('status', '!=', self::STATUS_COMPLETED);
    }

    public function scopeWithRFI($query)
    {
        return $query->whereNotNull('rfi_submission_date');
    }

    public function scopeResubmissions($query)
    {
        return $query->where('resubmission_count', '>', 0);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByIncharge($query, $inchargeId)
    {
        return $query->where('incharge', $inchargeId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Accessors
    public function getIsCompletedAttribute()
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function getHasRfiSubmissionAttribute()
    {
        return ! is_null($this->rfi_submission_date);
    }

    public function getIsResubmissionAttribute()
    {
        return $this->resubmission_count > 0;
    }

    // Action Item 5: Validation methods
    public static function isValidStatus($status): bool
    {
        return in_array($status, self::$statuses);
    }

    public static function isValidInspectionResult($result): bool
    {
        return in_array($result, self::$inspectionResults);
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        // Action Item 5: Validate status on saving
        static::saving(function ($dailyWork) {
            if ($dailyWork->status && ! self::isValidStatus($dailyWork->status)) {
                throw new \InvalidArgumentException("Invalid status: {$dailyWork->status}. Must be one of: ".implode(', ', self::$statuses));
            }

            if ($dailyWork->inspection_result && ! self::isValidInspectionResult($dailyWork->inspection_result)) {
                throw new \InvalidArgumentException("Invalid inspection result: {$dailyWork->inspection_result}. Must be one of: ".implode(', ', self::$inspectionResults));
            }
        });
    }
}
