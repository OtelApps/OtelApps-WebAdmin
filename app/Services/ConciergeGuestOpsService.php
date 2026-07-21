<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeConversation;
use App\Models\HotelCrmGuestProfile;
use App\Models\HotelCrmInteraction;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConciergeGuestOpsService
{
    public function __construct(
        private readonly CrmService $crm,
    ) {}

    public function guestKeyForConversation(HotelConciergeConversation $conversation): string
    {
        $stored = data_get($conversation->metadata, 'crm_guest_key');
        if (is_string($stored) && $stored !== '') {
            return $stored;
        }

        if ($conversation->guest_external_id) {
            $key = 'ext:'.$conversation->guest_external_id;
        } else {
            $room = trim((string) ($conversation->room_number ?? ''));
            $name = trim((string) ($conversation->guest_display_name ?? ''));
            $key = ($room !== '' || $name !== '')
                ? 'local:'.$room.'|'.$name
                : 'unknown';
        }

        $metadata = is_array($conversation->metadata) ? $conversation->metadata : [];
        $metadata['crm_guest_key'] = $key;
        $conversation->metadata = $metadata;
        $conversation->save();

        return $key;
    }

    public function guestCard(Hotel $hotel, HotelConciergeConversation $conversation): array
    {
        $guestKey = $this->guestKeyForConversation($conversation);
        $detail = $this->crm->guestDetail($hotel, $guestKey);

        if (! $detail) {
            $this->ensureProfileStub($hotel, $conversation, $guestKey);
            $detail = $this->crm->guestDetail($hotel, $guestKey) ?? [
                'key' => $guestKey,
                'name' => $conversation->guest_display_name ?: 'Host',
                'room' => $conversation->room_number,
                'locale' => $conversation->guest_locale ?: 'cs',
                'segment' => 'standard',
                'email' => null,
                'phone' => null,
                'notes' => null,
                'check_in_at' => null,
                'check_out_at' => null,
                'tags' => [],
                'loyalty_points' => 0,
                'stay_count' => 0,
                'recent_requests' => [],
                'timeline' => [],
            ];
        }

        $profile = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->first();

        $charges = collect(data_get($profile?->metadata, 'folio_charges', []))
            ->sortByDesc('created_at')
            ->values()
            ->all();

        $chargeTotal = collect($charges)->sum(fn ($c) => (float) ($c['amount'] ?? 0));

        return [
            'guest_key' => $guestKey,
            'conversation_id' => $conversation->id,
            'guest' => $detail,
            'folio_charges' => $charges,
            'folio_total' => round($chargeTotal, 2),
            'folio_currency' => 'CZK',
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function runAction(Hotel $hotel, HotelConciergeConversation $conversation, array $payload): array
    {
        $action = (string) ($payload['action'] ?? '');
        $guestKey = $this->guestKeyForConversation($conversation);
        $this->ensureProfileStub($hotel, $conversation, $guestKey);

        return match ($action) {
            'change_room' => $this->changeRoom($hotel, $conversation, $guestKey, $payload),
            'extend_checkout' => $this->extendCheckout($hotel, $conversation, $guestKey, $payload),
            'add_charge' => $this->addCharge($hotel, $conversation, $guestKey, $payload),
            'set_segment' => $this->setSegment($hotel, $conversation, $guestKey, $payload),
            'add_note' => $this->addNote($hotel, $conversation, $guestKey, $payload),
            default => throw ValidationException::withMessages([
                'action' => 'Neznámá akce.',
            ]),
        };
    }

    private function ensureProfileStub(Hotel $hotel, HotelConciergeConversation $conversation, string $guestKey): void
    {
        $existing = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->first();

        if ($existing) {
            return;
        }

        $this->crm->upsertGuestProfile($hotel, $guestKey, [
            'guest_external_id' => $conversation->guest_external_id,
            'display_name' => $conversation->guest_display_name ?: 'Host',
            'room_number' => $conversation->room_number,
            'locale' => $conversation->guest_locale ?: 'cs',
            'segment' => 'standard',
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function changeRoom(Hotel $hotel, HotelConciergeConversation $conversation, string $guestKey, array $payload): array
    {
        $newRoom = trim((string) ($payload['room_number'] ?? ''));
        if ($newRoom === '') {
            throw ValidationException::withMessages(['room_number' => 'Zadejte číslo pokoje.']);
        }

        $oldRoom = $conversation->room_number;
        $this->crm->upsertGuestProfile($hotel, $guestKey, [
            'room_number' => $newRoom,
        ]);

        $conversation->update(['room_number' => $newRoom]);

        $amount = isset($payload['amount']) ? (float) $payload['amount'] : 0.0;
        if ($amount > 0) {
            $this->appendCharge($hotel, $guestKey, [
                'label' => (string) ($payload['charge_label'] ?? 'Povýšení / změna pokoje'),
                'amount' => $amount,
                'category' => 'room_upgrade',
                'note' => "Pokoj {$oldRoom} → {$newRoom}",
            ]);
        }

        $this->logInteraction($hotel, $guestKey, 'room_change', "Pokoj změněn: {$oldRoom} → {$newRoom}");

        return $this->guestCard($hotel, $conversation->fresh());
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function extendCheckout(Hotel $hotel, HotelConciergeConversation $conversation, string $guestKey, array $payload): array
    {
        $days = max(1, (int) ($payload['days'] ?? 1));
        $profile = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->firstOrFail();

        $base = $profile->check_out_at ?: now()->startOfDay()->addDay();
        $newCheckout = $base->copy()->addDays($days);

        $this->crm->upsertGuestProfile($hotel, $guestKey, [
            'check_out_at' => $newCheckout->toIso8601String(),
        ]);

        $amount = isset($payload['amount']) ? (float) $payload['amount'] : 0.0;
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Zadejte částku k připsání na účet hosta.',
            ]);
        }

        $this->appendCharge($hotel, $guestKey, [
            'label' => (string) ($payload['charge_label'] ?? "Prodloužení pobytu +{$days} den/dny"),
            'amount' => $amount,
            'category' => 'checkout_extension',
            'note' => 'Nový checkout: '.$newCheckout->toDateString(),
        ]);

        $this->logInteraction(
            $hotel,
            $guestKey,
            'checkout_extension',
            "Checkout posunut o {$days} den/dny na {$newCheckout->toDateString()} (+{$amount} CZK)"
        );

        return $this->guestCard($hotel, $conversation->fresh());
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function addCharge(Hotel $hotel, HotelConciergeConversation $conversation, string $guestKey, array $payload): array
    {
        $label = trim((string) ($payload['label'] ?? ''));
        $amount = (float) ($payload['amount'] ?? 0);
        if ($label === '' || $amount <= 0) {
            throw ValidationException::withMessages([
                'label' => 'Zadejte popis a kladnou částku.',
            ]);
        }

        $this->appendCharge($hotel, $guestKey, [
            'label' => $label,
            'amount' => $amount,
            'category' => (string) ($payload['category'] ?? 'manual'),
            'note' => (string) ($payload['note'] ?? ''),
        ]);

        $this->logInteraction($hotel, $guestKey, 'folio_charge', "{$label}: {$amount} CZK");

        return $this->guestCard($hotel, $conversation);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function setSegment(Hotel $hotel, HotelConciergeConversation $conversation, string $guestKey, array $payload): array
    {
        $segment = (string) ($payload['segment'] ?? 'vip');
        $allowed = ['standard', 'vip', 'loyalty', 'corporate', 'complaint_risk'];
        if (! in_array($segment, $allowed, true)) {
            throw ValidationException::withMessages(['segment' => 'Neplatný segment.']);
        }

        $this->crm->upsertGuestProfile($hotel, $guestKey, [
            'segment' => $segment,
        ]);

        $this->logInteraction($hotel, $guestKey, 'segment_change', 'Segment: '.$segment);

        return $this->guestCard($hotel, $conversation);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function addNote(Hotel $hotel, HotelConciergeConversation $conversation, string $guestKey, array $payload): array
    {
        $note = trim((string) ($payload['note'] ?? ''));
        if ($note === '') {
            throw ValidationException::withMessages(['note' => 'Zadejte poznámku.']);
        }

        $profile = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->firstOrFail();

        $existing = trim((string) ($profile->notes ?? ''));
        $stamp = now()->format('d.m.Y H:i');
        $merged = $existing === ''
            ? "[{$stamp}] {$note}"
            : $existing."\n[{$stamp}] {$note}";

        $this->crm->upsertGuestProfile($hotel, $guestKey, [
            'notes' => $merged,
        ]);

        $this->logInteraction($hotel, $guestKey, 'note', $note);

        return $this->guestCard($hotel, $conversation);
    }

    /**
     * @param  array{label: string, amount: float, category?: string, note?: string}  $charge
     */
    private function appendCharge(Hotel $hotel, string $guestKey, array $charge): void
    {
        $profile = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->firstOrFail();

        $metadata = is_array($profile->metadata) ? $profile->metadata : [];
        $charges = is_array($metadata['folio_charges'] ?? null) ? $metadata['folio_charges'] : [];
        $charges[] = [
            'id' => (string) Str::uuid(),
            'label' => $charge['label'],
            'amount' => round((float) $charge['amount'], 2),
            'currency' => 'CZK',
            'category' => $charge['category'] ?? 'manual',
            'note' => $charge['note'] ?? '',
            'created_at' => now()->toIso8601String(),
            'created_by' => 'WebAdmin',
            'source' => 'concierge_ops',
        ];
        $metadata['folio_charges'] = $charges;
        $profile->metadata = $metadata;
        $profile->save();
    }

    private function logInteraction(Hotel $hotel, string $guestKey, string $channel, string $summary): void
    {
        HotelCrmInteraction::create([
            'hotel_id' => $hotel->id,
            'guest_key' => $guestKey,
            'channel' => $channel,
            'direction' => 'outbound',
            'subject' => 'Concierge ops',
            'body' => $summary,
            'staff_name' => 'WebAdmin',
            'created_at' => now(),
        ]);
    }
}
