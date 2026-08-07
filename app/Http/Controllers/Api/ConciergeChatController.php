<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessConciergeGuestMessage;
use App\Models\Hotel;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Services\ConciergeBotService;
use App\Services\ConciergeGuestOpsService;
use App\Services\ConciergePresenceService;
use App\Services\SupabaseStaffTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConciergeChatController extends Controller
{
    public function __construct(
        private readonly SupabaseStaffTokenService $staffTokenService,
        private readonly ConciergeBotService $botService,
        private readonly ConciergeGuestOpsService $guestOpsService,
        private readonly ConciergePresenceService $presenceService,
    ) {}

    private const LOCALES = ['cs', 'en', 'de', 'fr', 'pl'];

    private const STATUSES = ['open', 'closed', 'archived'];

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $query = HotelConciergeConversation::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', '!=', 'archived');

        if ($request->boolean('unread_only')) {
            $query->where('unread_staff_count', '>', 0)
                ->where(function ($q) {
                    $q->where('metadata->mode', ConciergeBotService::MODE_STAFF)
                        ->orWhere('metadata->mode', ConciergeBotService::MODE_WAITING);
                });
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            if (in_array($status, self::STATUSES, true)) {
                $query->where('status', $status);
            }
        }

        if ($request->filled('locale')) {
            $locale = $request->query('locale');
            if (in_array($locale, self::LOCALES, true)) {
                $query->where('guest_locale', $locale);
            }
        }

        if ($request->filled('q')) {
            $term = '%'.addcslashes($request->query('q'), '%_\\').'%';
            $query->where(function ($q) use ($term) {
                $q->where('guest_display_name', 'ilike', $term)
                    ->orWhere('room_number', 'ilike', $term)
                    ->orWhere('last_message_preview', 'ilike', $term);
            });
        }

        $conversations = $query
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();

        $unreadTotal = HotelConciergeConversation::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', '!=', 'archived')
            ->where(function ($q) {
                $q->where('metadata->mode', ConciergeBotService::MODE_STAFF)
                    ->orWhere('metadata->mode', ConciergeBotService::MODE_WAITING);
            })
            ->sum('unread_staff_count');

        return response()->json([
            'conversations' => $conversations->map(fn ($c) => $this->listItem($c))->values(),
            'unread_total' => (int) $unreadTotal,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);
        $conversation->load('messages');

        // Když host čeká na AI a notify/ensure z appky nedorazilo, nastartuj background job.
        // Žádné LLM sync v tomto requestu — artisan serve zůstane volný.
        $mode = $this->botService->conversationMode($conversation);
        if ($mode === ConciergeBotService::MODE_BOT) {
            $last = $conversation->messages
                ->sortByDesc(fn ($m) => ($m->created_at?->getTimestamp() ?? 0).'|'.$m->id)
                ->first();
            if ($last && $last->sender_type === 'guest') {
                // Jen pokud ještě není bot/staff odpověď po této zprávě.
                $hasReply = $conversation->messages->contains(
                    fn ($m) => in_array($m->sender_type, ['bot', 'staff'], true)
                        && $m->created_at >= $last->created_at
                        && $m->id !== $last->id
                );
                if (! $hasReply) {
                    ProcessConciergeGuestMessage::dispatchAfterHttpResponse(
                        (string) $conversation->id,
                        (string) $last->id,
                    );
                }
            }
        } elseif (ConciergeBotService::needsStaffAttention($mode)
            && ($conversation->guest_locale ?: 'cs') !== 'cs') {
            $needsGuestCs = $conversation->messages
                ->where('sender_type', 'guest')
                ->contains(fn ($m) => ! filled($m->body_translated));
            if ($needsGuestCs) {
                ProcessConciergeGuestMessage::dispatchConversationAfterHttpResponse(
                    (string) $conversation->id,
                );
            }
        }

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
        ]);
    }

    public function storeMessage(Request $request, string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
            'staff_display_name' => ['nullable', 'string', 'max:120'],
        ]);

        $body = trim($data['body']);

        $mode = $this->botService->conversationMode($conversation);
        if ($mode === ConciergeBotService::MODE_BOT) {
            return response()->json([
                'message' => 'Chat teď řeší AI. Nejdřív klikni „Převzít kontrolu“.',
            ], 409);
        }

        // Překlad až afterResponse — dlouhé zprávy + LM Studio by jinak timeoutly request / zabily serve.
        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }
        if (($metadata['mode'] ?? null) !== ConciergeBotService::MODE_STAFF) {
            $metadata['mode'] = ConciergeBotService::MODE_STAFF;
            $metadata['taken_over_at'] = now()->toIso8601String();
            $conversation->update(['metadata' => $metadata]);
        }

        $message = HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'staff',
            'body' => $body,
            'body_original' => $body,
            'body_translated' => null,
            'locale' => 'cs',
            'staff_display_name' => $data['staff_display_name'] ?? null,
            'created_at' => now(),
        ]);

        $messageId = (string) $message->id;
        $conversationId = (string) $conversation->id;
        if (($conversation->guest_locale ?: 'cs') !== 'cs') {
            dispatch(function () use ($conversationId, $messageId) {
                set_time_limit(600);
                $c = HotelConciergeConversation::query()->find($conversationId);
                $m = HotelConciergeMessage::query()->find($messageId);
                if (! $c || ! $m) {
                    return;
                }
                $bot = app(ConciergeBotService::class);
                if (! filled($m->body_translated)) {
                    $translated = $bot->translateStaffReply($c, $m->body);
                    if (filled($translated)) {
                        $m->update(['body_translated' => $translated]);
                        $m->refresh();
                    }
                }
                // I bez překladu pushni originál — host aspoň něco uvidí.
                $pushBody = filled($m->body_translated) ? (string) $m->body_translated : (string) $m->body;
                $bot->pushGuestConcierge($c, $pushBody, 'staff');
            })->afterResponse();
        } else {
            dispatch(function () use ($conversationId, $messageId) {
                $c = HotelConciergeConversation::query()->find($conversationId);
                $m = HotelConciergeMessage::query()->find($messageId);
                if (! $c || ! $m) {
                    return;
                }
                app(ConciergeBotService::class)->pushGuestConcierge($c, $m->body, 'staff');
            })->afterResponse();
        }

        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
            'message' => $this->messagePayload($message->fresh()),
        ], 201);
    }

    public function takeOver(string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);
        $this->botService->takeOverByStaff($conversation);
        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
        ]);
    }

    public function releaseToBot(string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);
        $this->botService->releaseToBot($conversation);
        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
        ]);
    }

    public function sendSatisfactionCheck(string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);

        try {
            $this->botService->sendSatisfactionCheck($conversation);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
        ], 201);
    }

    public function markRead(string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);

        HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'guest')
            ->whereNull('read_by_staff_at')
            ->update(['read_by_staff_at' => now()]);

        $conversation->update(['unread_staff_count' => 0]);

        // Jednorázově při otevření chatu — background proces, neblokuje artisan serve.
        if (ConciergeBotService::needsStaffAttention($this->botService->conversationMode($conversation))
            && ($conversation->guest_locale ?: 'cs') !== 'cs') {
            $needsGuestCs = HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->where('sender_type', 'guest')
                ->where(function ($q) {
                    $q->whereNull('body_translated')
                        ->orWhere('body_translated', '');
                })
                ->exists();

            if ($needsGuestCs) {
                ProcessConciergeGuestMessage::dispatchConversationAfterHttpResponse(
                    (string) $conversation->id,
                );
            }
        }

        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'assigned_staff_name' => ['nullable', 'string', 'max:120'],
        ]);

        $conversation->update($data);
        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
        ]);
    }

    public function guestCard(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $conversation = $this->findConversation($id);

        if ($conversation->hotel_id !== $hotel->id) {
            abort(404);
        }

        return response()->json(
            $this->guestOpsService->guestCard($hotel, $conversation)
        );
    }

    public function guestOps(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $conversation = $this->findConversation($id);

        if ($conversation->hotel_id !== $hotel->id) {
            abort(404);
        }

        $validated = $request->validate([
            'action' => ['required', 'string', Rule::in([
                'change_room',
                'extend_checkout',
                'add_charge',
                'set_segment',
                'add_note',
            ])],
            'room_number' => ['nullable', 'string', 'max:32'],
            'days' => ['nullable', 'integer', 'min:1', 'max:30'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'charge_label' => ['nullable', 'string', 'max:200'],
            'label' => ['nullable', 'string', 'max:200'],
            'category' => ['nullable', 'string', 'max:64'],
            'note' => ['nullable', 'string', 'max:2000'],
            'segment' => ['nullable', 'string', 'max:32'],
        ]);

        $card = $this->guestOpsService->runAction($hotel, $conversation, $validated);

        return response()->json([
            ...$card,
            'conversation' => $this->listItem($conversation->fresh()),
        ]);
    }

    /**
     * Heartbeat presence recepce + snapshot stavu hosta.
     */
    public function presence(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $conversation = $this->findConversation($id);

        if ($conversation->hotel_id !== $hotel->id) {
            abort(404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in([
                ConciergePresenceService::STATUS_IN_CHAT,
                ConciergePresenceService::STATUS_BUSY,
                ConciergePresenceService::STATUS_TYPING,
            ])],
        ]);

        $conversation = $this->presenceService->touch($conversation, 'staff', $data['status']);
        $guest = $this->presenceService->peerSnapshot($conversation, 'guest');

        return response()->json([
            'ok' => true,
            'peer' => $guest,
            // Pro admin UI: „online“ = host je opravdu v chatu (ne busy/pryč).
            'guest_online' => $guest['in_chat'],
            'guest_typing' => $guest['typing'],
        ]);
    }

    /**
     * Konfigurace Supabase Realtime pro WebAdmin (publishable key + krátkodobý staff JWT).
     */
    public function realtimeConfig(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);

        if (! $this->staffTokenService->isConfigured()) {
            return response()->json([
                'enabled' => false,
                'message' => 'Supabase Realtime není nakonfigurován — doplň SUPABASE_JWT_SECRET v .env a spusť hotel_concierge_realtime_staff.sql.',
            ]);
        }

        $ttl = 3600;

        return response()->json([
            'enabled' => true,
            'url' => config('supabase.url'),
            'key' => config('supabase.key'),
            'hotel_id' => $hotel->id,
            'expires_in' => $ttl,
            'access_token' => $this->staffTokenService->createStaffToken($hotel->id, $ttl),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findConversation(string $id): HotelConciergeConversation
    {
        return HotelConciergeConversation::where('id', $id)->firstOrFail();
    }

    private function listItem(HotelConciergeConversation $c): array
    {
        $mode = data_get($c->metadata, 'mode', ConciergeBotService::MODE_BOT);
        if ($mode !== ConciergeBotService::MODE_STAFF && $mode !== ConciergeBotService::MODE_WAITING) {
            $mode = ConciergeBotService::MODE_BOT;
        }
        $needsAttention = ConciergeBotService::needsStaffAttention($mode);
        $guestPresence = $this->presenceService->peerSnapshot($c, 'guest');

        return [
            'id' => $c->id,
            'guest_name' => $c->guest_display_name,
            'guest_room' => $c->room_number,
            'guest_locale' => $c->guest_locale,
            'status' => $c->status,
            'handler_mode' => $mode,
            'preview' => $c->last_message_preview,
            'last_message_at' => $this->formatRelativeTime($c->last_message_at),
            'last_message_iso' => $c->last_message_at?->toIso8601String(),
            'unread_count' => $needsAttention ? (int) $c->unread_staff_count : 0,
            'assigned_staff_name' => $c->assigned_staff_name,
            'guest_online' => $guestPresence['in_chat'],
            'guest_typing' => $guestPresence['typing'],
        ];
    }

    private function detailPayload(HotelConciergeConversation $c): array
    {
        $mode = data_get($c->metadata, 'mode', ConciergeBotService::MODE_BOT);
        $guestLocale = $c->guest_locale ?: 'cs';

        return [
            ...$this->listItem($c),
            'guest_external_id' => $c->guest_external_id,
            'messages' => $c->relationLoaded('messages')
                ? $c->messages
                    ->filter(fn ($m) => ! ConciergeBotService::isGuestOnlyNotice($m))
                    ->map(fn ($m) => $this->messagePayload($m))
                    ->values()
                : [],
            'translation_enabled' => $guestLocale !== 'cs',
            'translation_note' => $guestLocale === 'cs'
                ? null
                : 'Odpovídáte česky — host uvidí automatický překlad do svého jazyka.',
        ];
    }

    private function messagePayload(HotelConciergeMessage $m): array
    {
        $isStaffSide = in_array($m->sender_type, ['staff', 'bot'], true);
        $isSystem = $m->sender_type === 'system';
        $displayForGuest = $isStaffSide || $isSystem
            ? ($m->body_translated ?: $m->body)
            : $m->body;

        $payload = is_array($m->payload) ? $m->payload : [];

        return [
            'id' => $m->id,
            'sender_type' => $m->sender_type,
            'body' => $m->body,
            'body_original' => $m->body_original,
            'body_translated' => $m->body_translated,
            'display_body_guest' => $displayForGuest,
            'locale' => $m->locale,
            'staff_display_name' => $m->staff_display_name,
            'payload' => $payload,
            'is_staff' => $isStaffSide,
            'is_bot' => $m->sender_type === 'bot',
            'is_system' => $isSystem,
            'is_satisfaction_check' => ConciergeBotService::isSatisfactionCheck($m),
            'satisfaction_answer' => ConciergeBotService::satisfactionAnswer($m),
            'read_by_staff_at' => $m->read_by_staff_at?->toIso8601String(),
            'read_by_guest_at' => $m->read_by_guest_at?->toIso8601String(),
            'created_at' => $m->created_at?->toIso8601String(),
            'time' => $m->created_at?->format('H:i'),
            'date' => $m->created_at?->format('d/m/y'),
        ];
    }

    private function formatRelativeTime(?\Illuminate\Support\Carbon $dt): ?string
    {
        if (! $dt) {
            return null;
        }

        $now = now();
        if ($dt->isToday()) {
            return $dt->format('H:i');
        }
        if ($dt->isYesterday()) {
            return 'Včera';
        }
        if ($dt->greaterThan($now->copy()->subDays(7))) {
            return $dt->locale('cs')->isoFormat('ddd');
        }

        return $dt->format('d/m/y');
    }
}
