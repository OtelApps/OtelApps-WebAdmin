<?php

namespace App\Jobs;

use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Services\ConciergeBotService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessConciergeGuestMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 300;

    public function __construct(
        public readonly string $conversationId,
        public readonly string $messageId,
    ) {}

    /**
     * Lokálně spolehlivější než database queue: běží hned po 202 odpovědi
     * v tom samém PHP procesu (nepotřebuje `queue:work`).
     */
    public static function dispatchAfterHttpResponse(string $conversationId, string $messageId): void
    {
        dispatch(function () use ($conversationId, $messageId) {
            try {
                (new self($conversationId, $messageId))->handle(app(ConciergeBotService::class));
            } catch (Throwable $e) {
                Log::error('Concierge afterResponse failed', [
                    'conversation_id' => $conversationId,
                    'message' => $e->getMessage(),
                ]);
            }
        })->afterResponse();
    }

    public function handle(ConciergeBotService $botService): void
    {
        @ini_set('max_execution_time', '300');
        set_time_limit(300);

        Log::info('Concierge job start', [
            'conversation_id' => $this->conversationId,
            'message_id' => $this->messageId,
        ]);

        $conversation = HotelConciergeConversation::query()->find($this->conversationId);
        $message = HotelConciergeMessage::query()->find($this->messageId);

        if (! $conversation || ! $message) {
            return;
        }

        $botService->handleGuestMessage($conversation, $message);

        $conversation->refresh();
        if (ConciergeBotService::needsStaffAttention($botService->conversationMode($conversation))) {
            $botService->ensureGuestTranslationsForStaff($conversation);
        }

        Log::info('Concierge job done', [
            'conversation_id' => $this->conversationId,
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('Concierge job failed', [
            'conversation_id' => $this->conversationId,
            'message' => $exception?->getMessage(),
        ]);
    }
}
