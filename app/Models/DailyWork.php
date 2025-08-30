<?php

namespace App\Models;

use App\Services\DailyWork\DailyWorkSummaryService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class DailyWork extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'date',
        'number',
        'status',
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

    protected static function booted()
    {
        static::created(function ($dailyWork) {
            app(DailyWorkSummaryService::class)
                ->generateSummaryForDate($dailyWork->date, $dailyWork->incharge);
        });

        static::updated(function ($dailyWork) {
            app(DailyWorkSummaryService::class)
                ->generateSummaryForDate($dailyWork->date, $dailyWork->incharge);

            // Also update summary for old incharge if it changed
            if ($dailyWork->isDirty('incharge') && $dailyWork->getOriginal('incharge')) {
                app(DailyWorkSummaryService::class)
                    ->generateSummaryForDate($dailyWork->date, $dailyWork->getOriginal('incharge'));
            }
        });

        static::deleted(function ($dailyWork) {
            app(DailyWorkSummaryService::class)
                ->generateSummaryForDate($dailyWork->date, $dailyWork->incharge);
        });
    }

    public function reports()
    {
        return $this->belongsToMany(Report::class, 'daily_work_has_report', 'daily_work_id', 'report_id');
    }

    // Add relationships
    public function inchargeUser()
    {
        return $this->belongsTo(User::class, 'incharge');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned');
    }
}
