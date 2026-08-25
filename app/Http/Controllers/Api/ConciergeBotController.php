<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessConciergeGuestMessage;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Services\ConciergeBanService;
use App\Services\ConciergeBotService;
use App\Services\ConciergePresenceService;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConciergeBotController extends Controller
{
    public function __construct(
        private readonly ConciergeBotService $botService,
        private readonly ConciergePresenceService $presenceService,
        private readonly ConciergeBanService $banService,
    ) {}

    public function access(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guest_external_id' => ['required', 'string', 'max:191'],
            'hotel_slug' => ['nullable', 'string', 'max:64'],
        ]);

        $slug = $data['hotel_slug'] ?? config('otelapps.hotel_slug', 'default');
        $hotel = Hotel::query()->where('slug', $slug)->first();
        if (! $hotel) {
            return response()->json(['allowed' => true, 'reason' => null, 'expires_at' => null]);
        }

        $access = $this->banService->accessForGuest((string) $hotel->id, $data['guest_external_id']);
        if (! $access['allowed']) {
            return response()->json([
                ...$access,
                'code' => 'concierge_banned',
            ]);
        }

        return response()->json($access);
    }

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

        if ($denied = $this->deniedIfBanned($conversation)) {
            return $denied;
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

        if ($denied = $this->deniedIfBanned($conversation)) {
            return $denied;
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

        if ($denied = $this->deniedIfBanned($conversation)) {
            return $denied;
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

        if ($denied = $this->deniedIfBanned($conversation)) {
            return $denied;
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

        if ($denied = $this->deniedIfBanned($conversation)) {
            return $denied;
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

        $needsGuestToCs = $guestLocale !== 'cs'
            && HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->where('sender_type', 'guest')
                ->where(function ($q) {
                    $q->whereNull('body_translated')
                        ->orWhere('body_translated', '');
                })
                ->exists();

        if (ConciergeBotService::needsStaffAttention($mode)) {
            $needsWork = $needsGuestToCs;
        } else {
            $last = HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->first();
            // Bot už odpověděl, ale CS překlad hosta může chybět — stále potřebujeme práci.
            $needsWork = ($last && $last->sender_type === 'guest') || $needsGuestToCs;
        }

        if ($needsWork || $needsStaffTranslation) {
            ProcessConciergeGuestMessage::dispatchConversationAfterHttpResponse(
                (string) $conversation->id,
            );
        }

        return response()->json([
            'ok' => true,
            'accepted' => $needsWork || $needsStaffTranslation,
            'processed' => false,
            'mode' => $mode,
        ], ($needsWork || $needsStaffTranslation) ? 202 : 200);
    }

    private function deniedIfBanned(HotelConciergeConversation $conversation): ?JsonResponse
    {
        $ban = $this->banService->activeBan(
            (string) $conversation->hotel_id,
            (string) $conversation->guest_external_id,
        );

        if (! $ban) {
            return null;
        }

        return response()->json($this->banService->bannedResponse($ban), 403);
    }
}
