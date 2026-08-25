<?php

namespace App\Services;

use App\Models\HotelConciergeConversation;
use Carbon\Carbon;

class ConciergePresenceService
{
    public const STALE_SECONDS = 15;

    public const STATUS_IN_CHAT = 'in_chat';

    public const STATUS_BUSY = 'busy';

    public const STATUS_TYPING = 'typing';

    /**
     * @return array{online: bool, status: string|null, typing: bool, at: string|null}
     */
    public function peerSnapshot(HotelConciergeConversation $conversation, string $peerRole): array
    {
        $presence = data_get($conversation->metadata, 'presence.'.$peerRole);
        if (! is_array($presence)) {
            return ['online' => false, 'status' => null, 'typing' => false, 'in_chat' => false, 'at' => null];
        }

        $at = isset($presence['at']) ? Carbon::parse($presence['at']) : null;
        if (! $at || $at->lt(now()->subSeconds(self::STALE_SECONDS))) {
            return ['online' => false, 'status' => null, 'typing' => false, 'in_chat' => false, 'at' => null];
        }

        $status = (string) ($presence['status'] ?? self::STATUS_IN_CHAT);
        if (! in_array($status, [self::STATUS_IN_CHAT, self::STATUS_BUSY, self::STATUS_TYPING], true)) {
            $status = self::STATUS_IN_CHAT;
        }

        return [
            'online' => true,
            'status' => $status,
            'typing' => $status === self::STATUS_TYPING,
            /** Aktivně v chatu (ne „busy/pryč“). */
            'in_chat' => $status === self::STATUS_IN_CHAT || $status === self::STATUS_TYPING,
            'at' => $at->toIso8601String(),
        ];
    }

    public function touch(HotelConciergeConversation $conversation, string $role, string $status): HotelConciergeConversation
    {
        if (! in_array($role, ['guest', 'staff'], true)) {
            return $conversation;
        }

        if (! in_array($status, [self::STATUS_IN_CHAT, self::STATUS_BUSY, self::STATUS_TYPING], true)) {
            $status = self::STATUS_IN_CHAT;
        }

        $metadata = is_array($conversation->metadata) ? $conversation->metadata : [];
        $presence = is_array($metadata['presence'] ?? null) ? $metadata['presence'] : [];
        $presence[$role] = [
            'status' => $status,
            'at' => now()->toIso8601String(),
        ];
        $metadata['presence'] = $presence;

        $conversation->update(['metadata' => $metadata]);

        return $conversation->fresh();
    }
}
