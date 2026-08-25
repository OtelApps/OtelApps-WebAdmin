<?php

namespace App\Jobs;

use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Services\ConciergeBanService;
use App\Services\ConciergeBotService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessConciergeGuestMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 600;

    public function __construct(
        public readonly string $conversationId,
        public readonly string $messageId,
    ) {}

    /**
     * Spolehlivé zpracování mimo artisan serve HTTP worker.
     * afterResponse v tom samém procesu se při pollingu často nestihne / zablokuje serve.
     */
    public static function dispatchAfterHttpResponse(string $conversationId, string $messageId): void
    {
        if (self::spawnBackground($conversationId, $messageId)) {
            return;
        }

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

    /**
     * Spusť zpracování konverzace na pozadí (pending bot + překlady).
     */
    public static function dispatchConversationAfterHttpResponse(string $conversationId): void
    {
        if (self::spawnBackground($conversationId, null)) {
            return;
        }

        dispatch(function () use ($conversationId) {
            try {
                @ini_set('max_execution_time', '600');
                @set_time_limit(600);
                $c = HotelConciergeConversation::query()->find($conversationId);
                if (! $c) {
                    return;
                }
                $bot = app(ConciergeBotService::class);
                $bot->ensurePendingReply($c);
                $bot->ensureGuestTranslationsForStaff($c);
                $bot->ensureStaffTranslationsForGuest($c);
            } catch (Throwable $e) {
                Log::error('Concierge conversation afterResponse failed', [
                    'conversation_id' => $conversationId,
                    'message' => $e->getMessage(),
                ]);
            }
        })->afterResponse();
    }

    /**
     * @return bool true = background spawn OK (nebo už běží)
     */
    public static function spawnBackground(string $conversationId, ?string $messageId = null): bool
    {
        if (! function_exists('exec')) {
            return false;
        }

        // Sjednoť dedupe: on-message (messageId) i ensure-reply (null) musí sdílet klíč.
        if ($messageId === null || $messageId === '') {
            $lastGuest = HotelConciergeMessage::query()
                ->where('conversation_id', $conversationId)
                ->where('sender_type', 'guest')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->value('id');
            $messageId = is_string($lastGuest) ? $lastGuest : null;
        }

        $dedupeKey = $messageId
            ? 'concierge-bg:'.$messageId
            : 'concierge-bg:c:'.$conversationId;

        if (! Cache::add($dedupeKey, 1, 180)) {
            return true; // už běží / nedávno spawnuto
        }

        // Conversation-level klíč taky, ať show()+ensure nepřidají druhý proces.
        Cache::add('concierge-bg:c:'.$conversationId, 1, 180);

        $php = PHP_BINARY ?: 'php';
        $artisan = base_path('artisan');
        $logFile = storage_path('logs/concierge-bg.log');

        $parts = [
            'nohup',
            escapeshellarg($php),
            escapeshellarg($artisan),
            'concierge:process',
            escapeshellarg($conversationId),
        ];
        if ($messageId) {
            $parts[] = escapeshellarg($messageId);
        }
        $parts[] = '>>';
        $parts[] = escapeshellarg($logFile);
        $parts[] = '2>&1';
        $parts[] = '&';

        $cmd = implode(' ', $parts);
        Log::info('Concierge: spawn background process', [
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
        ]);

        exec($cmd);

        return true;
    }

    public function handle(ConciergeBotService $botService): void
    {
        @ini_set('max_execution_time', '600');
        set_time_limit(600);

        Log::info('Concierge job start', [
            'conversation_id' => $this->conversationId,
            'message_id' => $this->messageId,
        ]);

        $conversation = HotelConciergeConversation::query()->find($this->conversationId);
        $message = HotelConciergeMessage::query()->find($this->messageId);

        if (! $conversation || ! $message) {
            return;
        }

        if (app(ConciergeBanService::class)->isBanned(
            (string) $conversation->hotel_id,
            (string) $conversation->guest_external_id,
        )) {
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
