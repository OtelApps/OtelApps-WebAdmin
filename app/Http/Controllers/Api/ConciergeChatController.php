<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Services\SupabaseStaffTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConciergeChatController extends Controller
{
    public function __construct(
        private readonly SupabaseStaffTokenService $staffTokenService,
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
            $query->where('unread_staff_count', '>', 0);
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

        $conversation->refresh()->load('messages');

        return response()->json([
            'conversation' => $this->detailPayload($conversation),
            'message' => $this->messagePayload($message),
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
        return [
            'id' => $c->id,
            'guest_name' => $c->guest_display_name,
            'guest_room' => $c->room_number,
            'guest_locale' => $c->guest_locale,
            'status' => $c->status,
            'preview' => $c->last_message_preview,
            'last_message_at' => $this->formatRelativeTime($c->last_message_at),
            'last_message_iso' => $c->last_message_at?->toIso8601String(),
            'unread_count' => (int) $c->unread_staff_count,
            'assigned_staff_name' => $c->assigned_staff_name,
        ];
    }

    private function detailPayload(HotelConciergeConversation $c): array
    {
        return [
            ...$this->listItem($c),
            'guest_external_id' => $c->guest_external_id,
            'messages' => $c->relationLoaded('messages')
                ? $c->messages->map(fn ($m) => $this->messagePayload($m))->values()
                : [],
            'translation_note' => 'Automatický překlad odpovědí personálu do jazyka hosta bude dostupný po napojení chatbota.',
        ];
    }

    private function messagePayload(HotelConciergeMessage $m): array
    {
        $isStaff = in_array($m->sender_type, ['staff', 'bot'], true);
        $displayForGuest = $isStaff
            ? ($m->body_translated ?: $m->body)
            : $m->body;

        return [
            'id' => $m->id,
            'sender_type' => $m->sender_type,
            'body' => $m->body,
            'body_original' => $m->body_original,
            'body_translated' => $m->body_translated,
            'display_body_guest' => $displayForGuest,
            'locale' => $m->locale,
            'staff_display_name' => $m->staff_display_name,
            'is_staff' => $isStaff,
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
