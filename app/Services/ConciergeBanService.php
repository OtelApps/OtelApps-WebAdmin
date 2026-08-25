<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeBan;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Models\HotelCrmGuestProfile;
use App\Models\HotelCrmInteraction;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class ConciergeBanService
{
    public const DURATIONS = ['30m', '1h', '8h', 'until_checkout'];

    public const DURATION_LABELS = [
        '30m' => '30 minut',
        '1h' => '1 hodina',
        '8h' => '8 hodin',
        'until_checkout' => 'do konce pobytu',
    ];

    public function __construct(
        private readonly ConciergeGuestOpsService $guestOpsService,
    ) {}

    public function activeBan(string $hotelId, string $guestExternalId): ?HotelConciergeBan
    {
        $guestExternalId = trim($guestExternalId);
        if ($guestExternalId === '') {
            return null;
        }

        return HotelConciergeBan::query()
            ->where('hotel_id', $hotelId)
            ->where('guest_external_id', $guestExternalId)
            ->active()
            ->orderByDesc('banned_at')
            ->first();
    }

    public function isBanned(string $hotelId, string $guestExternalId): bool
    {
        return $this->activeBan($hotelId, $guestExternalId) !== null;
    }

    /**
     * @param  array<int, string>  $guestExternalIds
     * @return array<int, string>
     */
    public function activeGuestExternalIds(string $hotelId, array $guestExternalIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('trim', $guestExternalIds))));
        if ($ids === []) {
            return [];
        }

        return HotelConciergeBan::query()
            ->where('hotel_id', $hotelId)
            ->whereIn('guest_external_id', $ids)
            ->active()
            ->pluck('guest_external_id')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array{allowed: bool, reason: ?string, expires_at: ?string}
     */
    public function accessForGuest(string $hotelId, string $guestExternalId): array
    {
        $ban = $this->activeBan($hotelId, $guestExternalId);
        if (! $ban) {
            return ['allowed' => true, 'reason' => null, 'expires_at' => null];
        }

        return [
            'allowed' => false,
            'reason' => $ban->reason,
            'expires_at' => $ban->expires_at?->toIso8601String(),
        ];
    }

    public function ban(
        Hotel $hotel,
        HotelConciergeConversation $conversation,
        string $durationKey,
        string $reason,
        ?User $actor,
    ): HotelConciergeBan {
        if ($conversation->hotel_id !== $hotel->id) {
            throw new RuntimeException('Konverzace nepatří k tomuto hotelu.');
        }

        if (! in_array($durationKey, self::DURATIONS, true)) {
            throw new RuntimeException('Neplatná délka banu.');
        }

        $reason = trim($reason);
        if ($reason === '') {
            throw new RuntimeException('Důvod banu je povinný.');
        }

        $guestExternalId = trim((string) $conversation->guest_external_id);
        if ($guestExternalId === '') {
            throw new RuntimeException('Host nemá identitu — ban nelze uložit.');
        }

        if ($this->activeBan($hotel->id, $guestExternalId)) {
            throw new RuntimeException('Tento host už má aktivní ban.');
        }

        $conversation->loadMissing('messages');
        $snapshot = $this->snapshotMessages($conversation);

        $actorLabel = $actor?->name ?: 'WebAdmin';
        $expiresAt = $this->resolveExpiresAt($hotel, $conversation, $durationKey);

        $ban = HotelConciergeBan::create([
            'hotel_id' => $hotel->id,
            'guest_external_id' => $guestExternalId,
            'guest_display_name' => $conversation->guest_display_name,
            'room_number' => $conversation->room_number,
            'duration_key' => $durationKey,
            'reason' => $reason,
            'banned_at' => now(),
            'expires_at' => $expiresAt,
            'banned_by_user_id' => $actor?->id,
            'banned_by_label' => $actorLabel,
            'conversation_id' => $conversation->id,
            'chat_snapshot' => $snapshot,
            'created_at' => now(),
        ]);

        $durationLabel = self::DURATION_LABELS[$durationKey] ?? $durationKey;
        $locale = $conversation->guest_locale ?: 'cs';
        $guestNotice = $this->guestBanNotice($locale, $reason);
        $staffNotice = "Host zabanován ({$durationLabel}) uživatelem {$actorLabel}. Důvod: {$reason}";

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => $guestNotice,
            'body_original' => $guestNotice,
            'body_translated' => $guestNotice,
            'locale' => $locale,
            'staff_display_name' => ConciergeBotService::GUEST_ONLY_NOTICE_MARKER,
            'created_at' => now(),
        ]);

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => $staffNotice,
            'body_original' => $staffNotice,
            'body_translated' => null,
            'locale' => 'cs',
            'staff_display_name' => ConciergeBotService::STAFF_ONLY_NOTICE_MARKER,
            'created_at' => now(),
        ]);

        $conversation->update([
            'status' => 'archived',
            'last_message_preview' => 'Host zabanován',
            'last_message_at' => now(),
            'unread_staff_count' => 0,
        ]);

        $this->logCrm($hotel, $conversation, $actorLabel, "Ban Concierge ({$durationLabel}): {$reason}");

        return $ban->fresh();
    }

    public function unbanByConversation(
        Hotel $hotel,
        HotelConciergeConversation $conversation,
        ?User $actor,
    ): HotelConciergeBan {
        $ban = $this->activeBan($hotel->id, (string) $conversation->guest_external_id);
        if (! $ban) {
            throw new RuntimeException('Host nemá aktivní ban.');
        }

        return $this->lift($hotel, $ban, $conversation, $actor);
    }

    public function unbanById(Hotel $hotel, string $banId, ?User $actor): HotelConciergeBan
    {
        $ban = HotelConciergeBan::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $banId)
            ->firstOrFail();

        if (! $ban->isActive()) {
            throw new RuntimeException('Tento ban už není aktivní.');
        }

        $conversation = $ban->conversation_id
            ? HotelConciergeConversation::query()->find($ban->conversation_id)
            : HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('guest_external_id', $ban->guest_external_id)
                ->orderByDesc('updated_at')
                ->first();

        return $this->lift($hotel, $ban, $conversation, $actor);
    }

    /**
     * @return Collection<int, HotelConciergeBan>
     */
    public function listForHotel(Hotel $hotel, ?string $search = null): Collection
    {
        $query = HotelConciergeBan::query()
            ->where('hotel_id', $hotel->id)
            ->orderByDesc('banned_at');

        if (is_string($search) && trim($search) !== '') {
            $term = '%'.addcslashes(trim($search), '%_\\').'%';
            $query->where(function ($q) use ($term) {
                $q->where('guest_display_name', 'ilike', $term)
                    ->orWhere('room_number', 'ilike', $term)
                    ->orWhere('reason', 'ilike', $term)
                    ->orWhere('banned_by_label', 'ilike', $term)
                    ->orWhere('guest_external_id', 'ilike', $term);
            });
        }

        return $query->limit(200)->get();
    }

    public function findForHotel(Hotel $hotel, string $id): HotelConciergeBan
    {
        return HotelConciergeBan::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $id)
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    public function listPayload(HotelConciergeBan $ban): array
    {
        return [
            'id' => $ban->id,
            'guest_name' => $ban->guest_display_name,
            'guest_room' => $ban->room_number,
            'guest_external_id' => $ban->guest_external_id,
            'duration_key' => $ban->duration_key,
            'duration_label' => self::DURATION_LABELS[$ban->duration_key] ?? $ban->duration_key,
            'reason' => $ban->reason,
            'status' => $ban->statusKey(),
            'banned_at' => $ban->banned_at?->toIso8601String(),
            'expires_at' => $ban->expires_at?->toIso8601String(),
            'banned_by_label' => $ban->banned_by_label,
            'conversation_id' => $ban->conversation_id,
            'lifted_at' => $ban->lifted_at?->toIso8601String(),
            'lifted_by_label' => $ban->lifted_by_label,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detailPayload(HotelConciergeBan $ban): array
    {
        return [
            ...$this->listPayload($ban),
            'chat_snapshot' => is_array($ban->chat_snapshot) ? $ban->chat_snapshot : [],
        ];
    }

    public function bannedResponse(HotelConciergeBan $ban): array
    {
        return [
            'message' => 'Přístup k chatu byl odepřen.',
            'code' => 'concierge_banned',
            'reason' => $ban->reason,
            'expires_at' => $ban->expires_at?->toIso8601String(),
        ];
    }

    private function lift(
        Hotel $hotel,
        HotelConciergeBan $ban,
        ?HotelConciergeConversation $conversation,
        ?User $actor,
    ): HotelConciergeBan {
        $actorLabel = $actor?->name ?: 'WebAdmin';

        $ban->update([
            'lifted_at' => now(),
            'lifted_by_user_id' => $actor?->id,
            'lifted_by_label' => $actorLabel,
        ]);

        if ($conversation) {
            $locale = $conversation->guest_locale ?: 'cs';
            $guestNotice = $this->guestUnbanNotice($locale);
            $staffNotice = "Ban zrušen uživatelem {$actorLabel}.";

            HotelConciergeMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'system',
                'body' => $guestNotice,
                'body_original' => $guestNotice,
                'body_translated' => $guestNotice,
                'locale' => $locale,
                'staff_display_name' => ConciergeBotService::GUEST_ONLY_NOTICE_MARKER,
                'created_at' => now(),
            ]);

            HotelConciergeMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'system',
                'body' => $staffNotice,
                'body_original' => $staffNotice,
                'body_translated' => null,
                'locale' => 'cs',
                'staff_display_name' => ConciergeBotService::STAFF_ONLY_NOTICE_MARKER,
                'created_at' => now(),
            ]);

            $conversation->update([
                'status' => 'open',
                'last_message_preview' => 'Ban zrušen',
                'last_message_at' => now(),
            ]);

            $this->logCrm($hotel, $conversation, $actorLabel, 'Ban Concierge zrušen');
        }

        return $ban->fresh();
    }

    /**
     * @return list<array{sender_type: string, text: string, created_at: ?string}>
     */
    private function snapshotMessages(HotelConciergeConversation $conversation): array
    {
        return $conversation->messages
            ->filter(fn (HotelConciergeMessage $m) => ! ConciergeBotService::isStaffOnlyNotice($m))
            ->values()
            ->map(function (HotelConciergeMessage $m) {
                $text = $m->sender_type === 'guest'
                    ? (string) $m->body
                    : (string) ($m->body ?: $m->body_translated);

                return [
                    'sender_type' => $m->sender_type,
                    'text' => $text,
                    'created_at' => $m->created_at?->toIso8601String(),
                ];
            })
            ->all();
    }

    private function resolveExpiresAt(Hotel $hotel, HotelConciergeConversation $conversation, string $durationKey): ?\Illuminate\Support\Carbon
    {
        return match ($durationKey) {
            '30m' => now()->addMinutes(30),
            '1h' => now()->addHour(),
            '8h' => now()->addHours(8),
            'until_checkout' => $this->checkoutExpiresAt($hotel, $conversation),
            default => now()->addHour(),
        };
    }

    private function checkoutExpiresAt(Hotel $hotel, HotelConciergeConversation $conversation): ?\Illuminate\Support\Carbon
    {
        $guestExternalId = trim((string) $conversation->guest_external_id);
        $guestKey = $this->guestOpsService->guestKeyForConversation($conversation);

        $profile = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where(function ($q) use ($guestExternalId, $guestKey) {
                if ($guestExternalId !== '') {
                    $q->where('guest_external_id', $guestExternalId);
                }
                if ($guestKey !== '') {
                    $q->orWhere('guest_key', $guestKey);
                }
            })
            ->orderByDesc('check_out_at')
            ->first();

        $checkOut = $profile?->check_out_at;
        if ($checkOut && $checkOut->isFuture()) {
            return $checkOut;
        }

        return null;
    }

    private function guestBanNotice(string $locale, string $reason): string
    {
        $intro = match ($locale) {
            'de' => 'Der Chat-Zugang wurde verweigert. Grund:',
            'en' => 'Access to chat has been denied. Reason:',
            default => 'Přístup k chatu byl odepřen z důvodu:',
        };

        return $intro.' '.$reason;
    }

    private function guestUnbanNotice(string $locale): string
    {
        return match ($locale) {
            'de' => 'Der Chat-Zugang wurde wiederhergestellt. Sie können uns erneut schreiben.',
            'en' => 'Chat access has been restored. You can write to us again.',
            default => 'Přístup k chatu byl obnoven. Můžete nám znovu napsat.',
        };
    }

    private function logCrm(Hotel $hotel, HotelConciergeConversation $conversation, string $staffName, string $summary): void
    {
        try {
            $guestKey = $this->guestOpsService->guestKeyForConversation($conversation);

            HotelCrmInteraction::create([
                'hotel_id' => $hotel->id,
                'guest_key' => $guestKey,
                'channel' => 'note',
                'direction' => 'internal',
                'subject' => 'Concierge ban',
                'body' => $summary,
                'staff_name' => $staffName,
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            Log::warning('Concierge ban CRM log selhal.', [
                'hotel_id' => $hotel->id,
                'conversation_id' => $conversation->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
