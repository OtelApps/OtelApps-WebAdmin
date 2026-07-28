<?php

namespace App\Console\Commands;

use App\Jobs\ProcessConciergeGuestMessage;
use App\Models\HotelConciergeConversation;
use App\Services\ConciergeBotService;
use Illuminate\Console\Command;
use Throwable;

class ProcessConciergeGuestMessageCommand extends Command
{
    protected $signature = 'concierge:process
                            {conversation : UUID konverzace}
                            {message? : UUID konkrétní guest zprávy (optional)}';

    protected $description = 'Zpracuje concierge guest zprávu (bot + překlad) mimo HTTP request';

    public function handle(ConciergeBotService $botService): int
    {
        @ini_set('max_execution_time', '600');
        @set_time_limit(600);

        $conversationId = (string) $this->argument('conversation');
        $messageId = $this->argument('message');

        try {
            if (is_string($messageId) && $messageId !== '') {
                (new ProcessConciergeGuestMessage($conversationId, $messageId))
                    ->handle($botService);

                return self::SUCCESS;
            }

            $conversation = HotelConciergeConversation::query()->find($conversationId);
            if (! $conversation) {
                $this->error('Konverzace nenalezena.');

                return self::FAILURE;
            }

            $botService->ensurePendingReply($conversation);
            $botService->ensureGuestTranslationsForStaff($conversation);
            $botService->ensureStaffTranslationsForGuest($conversation);

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }
}
