<?php

namespace App\Services;

use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use Carbon\Carbon;

class ConciergeIdleSweepService
{
    public const IDLE_MINUTES = 5;

    public function __construct(
        private readonly ConciergeBotService $botService,
    ) {}

    /**
     * @return array{deleted: int, archived: int, satisfaction_timed_out: int}
     */
    public function sweep(): array
    {
        $satisfactionTimedOut = $this->botService->timeoutUnansweredSatisfactionChecks(self::IDLE_MINUTES);

        $cutoff = now()->subMinutes(self::IDLE_MINUTES);
        $deleted = 0;
        $archived = 0;

        $open = HotelConciergeConversation::query()
            ->where('status', 'open')
            ->get();

        foreach ($open as $conversation) {
            if (ConciergeBotService::hasPendingSatisfaction($conversation)) {
                continue;
            }

            if ($this->lastActivityAt($conversation)->gt($cutoff)) {
                continue;
            }

            $hasContent = HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->whereIn('sender_type', ['guest', 'staff', 'bot'])
                ->exists();

            if ($hasContent) {
                $conversation->update(['status' => 'archived']);
                $archived++;
            } else {
                $conversation->delete();
                $deleted++;
            }
        }

        return [
            'deleted' => $deleted,
            'archived' => $archived,
            'satisfaction_timed_out' => $satisfactionTimedOut,
        ];
    }

    private function lastActivityAt(HotelConciergeConversation $conversation): Carbon
    {
        $candidates = [
            $conversation->last_message_at,
            $conversation->updated_at,
            $conversation->created_at,
        ];

        foreach (['guest', 'staff'] as $role) {
            $at = data_get($conversation->metadata, 'presence.'.$role.'.at');
            if (is_string($at) && $at !== '') {
                try {
                    $candidates[] = Carbon::parse($at);
                } catch (\Throwable) {
                    // ignore malformed presence timestamps
                }
            }
        }

        $latest = null;
        foreach ($candidates as $dt) {
            if (! $dt instanceof Carbon) {
                continue;
            }
            if ($latest === null || $dt->gt($latest)) {
                $latest = $dt;
            }
        }

        return $latest ?? now()->subMinutes(self::IDLE_MINUTES + 1);
    }
}
