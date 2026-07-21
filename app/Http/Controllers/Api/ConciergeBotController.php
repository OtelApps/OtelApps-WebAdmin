<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessConciergeGuestMessage;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Services\ConciergeBotService;
use App\Services\ConciergePresenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConciergeBotController extends Controller
{
    public function __construct(
        private readonly ConciergeBotService $botService,
        private readonly ConciergePresenceService $presenceService,
    ) {}

    /**
     * Okamžitě 202 + queue job (LM Studio 30–60 s by jinak zabilo Expo i zablokovalo artisan serve).
     */
    public function onGuestMessage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => ['required', 'uuid'],
            'guest_external_id' => ['required', 'string', 'max:191'],
            'message_id' => ['required', 'uuid'],
        ]);

        $conversation = HotelConciergeConversation::query()
            ->where('id', $data['conversation_id'])
            ->where('guest_external_id', $data['guest_external_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['message' => 'Konverzace nenalezena.'], 404);
        }

        $message = HotelConciergeMessage::query()
            ->where('id', $data['message_id'])
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'guest')
            ->first();

        if (! $message) {
            return response()->json(['message' => 'Zpráva nenalezena.'], 404);
        }

        ProcessConciergeGuestMessage::dispatchAfterHttpResponse(
            (string) $conversation->id,
            (string) $message->id,
        );

        return response()->json([
            'ok' => true,
            'accepted' => true,
            'mode' => $this->botService->conversationMode($conversation),
        ], 202);
    }

    public function escalate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => ['required', 'uuid'],
            'guest_external_id' => ['required', 'string', 'max:191'],
        ]);

        $conversation = HotelConciergeConversation::query()
            ->where('id', $data['conversation_id'])
            ->where('guest_external_id', $data['guest_external_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['message' => 'Konverzace nenalezena.'], 404);
        }

        $this->botService->escalateToStaff($conversation, 'guest_button');

        return response()->json([
            'ok' => true,
            'mode' => $this->botService->conversationMode($conversation->fresh()),
        ]);
    }

    /**
     * Heartbeat presence hosta + snapshot stavu recepce.
     */
    public function presence(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => ['required', 'uuid'],
            'guest_external_id' => ['required', 'string', 'max:191'],
            'status' => ['required', Rule::in([
                ConciergePresenceService::STATUS_IN_CHAT,
                ConciergePresenceService::STATUS_BUSY,
                ConciergePresenceService::STATUS_TYPING,
            ])],
        ]);

        $conversation = HotelConciergeConversation::query()
            ->where('id', $data['conversation_id'])
            ->where('guest_external_id', $data['guest_external_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['message' => 'Konverzace nenalezena.'], 404);
        }

        $conversation = $this->presenceService->touch($conversation, 'guest', $data['status']);
        $staff = $this->presenceService->peerSnapshot($conversation, 'staff');

        return response()->json([
            'ok' => true,
            'peer' => $staff,
        ]);
    }

    /**
     * Host odpověděl Ano/Ne na kontrolu spokojenosti od recepce.
     */
    public function satisfaction(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => ['required', 'uuid'],
            'guest_external_id' => ['required', 'string', 'max:191'],
            'message_id' => ['required', 'uuid'],
            'answer' => ['required', 'in:yes,no'],
        ]);

        $conversation = HotelConciergeConversation::query()
            ->where('id', $data['conversation_id'])
            ->where('guest_external_id', $data['guest_external_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['message' => 'Konverzace nenalezena.'], 404);
        }

        $message = HotelConciergeMessage::query()
            ->where('id', $data['message_id'])
            ->where('conversation_id', $conversation->id)
            ->first();

        if (! $message || ! ConciergeBotService::isSatisfactionCheck($message)) {
            return response()->json(['message' => 'Kontrola spokojenosti nenalezena.'], 404);
        }

        try {
            $result = $this->botService->answerSatisfactionCheck($conversation, $message, $data['answer']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $mode = ConciergeBotService::MODE_BOT;
        if (($result['status'] ?? '') !== 'deleted') {
            $conversation->refresh();
            $mode = $this->botService->conversationMode($conversation);
        }

        return response()->json([
            'ok' => true,
            'answer' => $data['answer'],
            'status' => $result['status'],
            'mode' => $mode,
            'summary' => $result['summary'] ?? null,
        ]);
    }

    /**
     * Fallback: doplň překlad / bot odpověď na pozadí (bez spamování, když už je hotovo).
     */
    public function ensureReply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => ['required', 'uuid'],
            'guest_external_id' => ['required', 'string', 'max:191'],
        ]);

        $conversation = HotelConciergeConversation::query()
            ->where('id', $data['conversation_id'])
            ->where('guest_external_id', $data['guest_external_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['message' => 'Konverzace nenalezena.'], 404);
        }

        $mode = $this->botService->conversationMode($conversation);
        $needsWork = false;
        $needsStaffTranslation = false;
        $guestLocale = $conversation->guest_locale ?: 'cs';

        if ($guestLocale !== 'cs') {
            $needsStaffTranslation = HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->whereIn('sender_type', ['staff', 'bot'])
                ->where(function ($q) {
                    $q->whereNull('body_translated')
                        ->orWhere('body_translated', '');
                })
                ->exists();
        }

        if (ConciergeBotService::needsStaffAttention($mode)) {
            $needsWork = $guestLocale !== 'cs'
                && HotelConciergeMessage::query()
                    ->where('conversation_id', $conversation->id)
                    ->where('sender_type', 'guest')
                    ->where(function ($q) {
                        $q->whereNull('body_translated')
                            ->orWhere('body_translated', '');
                    })
                    ->exists();
        } else {
            $last = HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->first();
            $needsWork = $last && $last->sender_type === 'guest';
        }

        if ($needsWork || $needsStaffTranslation) {
            $conversationId = (string) $conversation->id;
            dispatch(function () use ($conversationId, $mode, $needsWork, $needsStaffTranslation) {
                set_time_limit(180);
                $c = HotelConciergeConversation::query()->find($conversationId);
                if (! $c) {
                    return;
                }
                $bot = app(ConciergeBotService::class);
                if ($needsStaffTranslation) {
                    $bot->ensureStaffTranslationsForGuest($c);
                }
                if ($needsWork) {
                    if (ConciergeBotService::needsStaffAttention($mode)) {
                        $bot->ensureGuestTranslationsForStaff($c);
                    } else {
                        $bot->ensurePendingReply($c);
                    }
                }
            })->afterResponse();
        }

        return response()->json([
            'ok' => true,
            'accepted' => $needsWork || $needsStaffTranslation,
            'processed' => false,
            'mode' => $mode,
        ], ($needsWork || $needsStaffTranslation) ? 202 : 200);
    }
}
