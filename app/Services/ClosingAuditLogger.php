<?php

namespace App\Services;

use App\Models\HotelFinancialClosing;
use App\Models\HotelFinancialClosingEvent;
use App\Models\User;

class ClosingAuditLogger
{
    public function log(
        HotelFinancialClosing $closing,
        string $action,
        ?User $user = null,
        ?array $oldValue = null,
        ?array $newValue = null,
        array $metadata = [],
    ): void {
        // Prázdné PHP [] → JSON array; Postgres check chce object → vždy asociativní / stdClass
        $meta = $metadata === [] ? new \stdClass() : $metadata;

        HotelFinancialClosingEvent::query()->create([
            'closing_id' => $closing->id,
            'hotel_id' => $closing->hotel_id,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'metadata' => $meta,
            'created_at' => now(),
        ]);
    }
}
