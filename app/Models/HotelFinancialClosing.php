<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelFinancialClosing extends Model
{
    use HasUuidPrimaryKey;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_WAITING = 'waiting_for_resolution';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_REOPENED = 'reopened';

    public const OPEN_STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_IN_PROGRESS,
        self::STATUS_WAITING,
        self::STATUS_REOPENED,
    ];

    protected $connection;

    protected $table = 'hotel_financial_closings';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'business_date',
        'period_start',
        'period_end',
        'status',
        'primary_currency',
        'expected_total',
        'actual_total',
        'variance_total',
        'totals_by_currency',
        'cash_float',
        'deposit_expected',
        'deposit_actual',
        'started_by',
        'started_by_name',
        'started_at',
        'completed_by',
        'completed_by_name',
        'completed_at',
        'reopened_by',
        'reopened_by_name',
        'reopened_at',
        'reopen_reason',
        'current_step',
        'preflight_ack_at',
        'preflight_result',
        'payment_ids',
        'snapshot',
        'handover_summary',
        'locked_at',
    ];

    protected $casts = [
        'business_date' => 'date',
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'expected_total' => 'float',
        'actual_total' => 'float',
        'variance_total' => 'float',
        'totals_by_currency' => 'array',
        'cash_float' => 'float',
        'deposit_expected' => 'float',
        'deposit_actual' => 'float',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'reopened_at' => 'datetime',
        'preflight_ack_at' => 'datetime',
        'preflight_result' => 'array',
        'payment_ids' => 'array',
        'snapshot' => 'array',
        'locked_at' => 'datetime',
        'current_step' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function isLocked(): bool
    {
        return $this->status === self::STATUS_COMPLETED && $this->locked_at !== null;
    }

    public function isEditable(): bool
    {
        return in_array($this->status, self::OPEN_STATUSES, true);
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'hotel_id');
    }

    public function paymentLines(): HasMany
    {
        return $this->hasMany(HotelFinancialClosingPaymentLine::class, 'closing_id')->orderBy('sort_order');
    }

    public function cashCounts(): HasMany
    {
        return $this->hasMany(HotelFinancialClosingCashCount::class, 'closing_id');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(HotelFinancialClosingDeposit::class, 'closing_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(HotelFinancialClosingEvent::class, 'closing_id')->orderBy('created_at');
    }
}
