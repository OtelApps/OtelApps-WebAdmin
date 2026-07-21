<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelAdminNotification;
use App\Models\HotelAdminNotificationSetting;
use App\Models\HotelConciergeConversation;
use App\Models\HotelServiceRequest;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    public const DEFAULT_PREFERENCES = [
        'activity_enabled' => true,
        'activity_statuses' => ['new', 'pending', 'in_progress'],
        'concierge_enabled' => true,
        'toast_enabled' => true,
        'browser_notifications' => true,
        'sound_enabled' => true,
        'poll_interval_seconds' => 15,
        'guest_push_enabled' => true,
        'guest_push_on_status_change' => true,
        'guest_push_on_concierge' => true,
    ];

    private const SYNC_CACHE_SECONDS = 10;

    public function settings(Hotel $hotel): array
    {
        $row = HotelAdminNotificationSetting::query()->find($hotel->id);
        $prefs = array_merge(self::DEFAULT_PREFERENCES, $row?->preferences ?? []);

        return [
            'preferences' => $this->normalizePreferences($prefs),
            'updated_at' => $row?->updated_at?->toIso8601String(),
        ];
    }

    public function updateSettings(Hotel $hotel, array $data): array
    {
        $current = $this->settings($hotel)['preferences'];

        foreach ([
            'activity_enabled',
            'concierge_enabled',
            'toast_enabled',
            'browser_notifications',
            'sound_enabled',
            'guest_push_enabled',
            'guest_push_on_status_change',
            'guest_push_on_concierge',
        ] as $boolKey) {
            if (array_key_exists($boolKey, $data)) {
                $data[$boolKey] = filter_var($data[$boolKey], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $data[$boolKey];
            }
        }

        $merged = array_merge($current, array_intersect_key($data, array_flip(array_keys(self::DEFAULT_PREFERENCES))));
        $normalized = $this->normalizePreferences($merged);

        HotelAdminNotificationSetting::query()->updateOrCreate(
            ['hotel_id' => $hotel->id],
            [
                'preferences' => $normalized,
                'updated_at' => now(),
            ],
        );

        Cache::forget($this->syncCacheKey($hotel));

        return [
            'preferences' => $normalized,
            'updated_at' => now()->toIso8601String(),
        ];
    }

    public function summary(Hotel $hotel, bool $withSync = false): array
    {
        if ($withSync) {
            $this->syncIfStale($hotel);
        }

        $prefs = $this->loadPreferences($hotel);
        $badges = $this->badges($hotel, $prefs);

        $notifications = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->orderByDesc('created_at')
            ->take(30)
            ->get()
            ->map(fn (HotelAdminNotification $n) => $this->notificationPayload($n))
            ->values()
            ->all();

        $unreadCount = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->whereNull('read_at')
            ->count();

        return [
            'badges' => $badges,
            'unread_count' => $unreadCount,
            'notifications' => $notifications,
            'preferences' => $prefs,
        ];
    }

    /** @deprecated Použij summary($hotel, true) nebo syncIfStale */
    public function sync(Hotel $hotel): array
    {
        $this->syncIfStale($hotel, force: true);

        return $this->summary($hotel);
    }

    public function markRead(Hotel $hotel, ?string $id = null, ?string $source = null): int
    {
        $query = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->whereNull('read_at');

        if ($id) {
            $query->where('id', $id);
        }

        if ($source && in_array($source, ['activity', 'concierge'], true)) {
            $query->where('source', $source);
        }

        return $query->update(['read_at' => now()]);
    }

    private function syncIfStale(Hotel $hotel, bool $force = false): void
    {
        $key = $this->syncCacheKey($hotel);

        if (! $force && Cache::has($key)) {
            return;
        }

        $prefs = $this->loadPreferences($hotel);
        $this->syncNotifications($hotel, $prefs);
        Cache::put($key, true, now()->addSeconds(self::SYNC_CACHE_SECONDS));
    }

    private function syncNotifications(Hotel $hotel, array $prefs): void
    {
        $this->syncActivityNotifications($hotel, $prefs);
        $this->syncConciergeNotifications($hotel, $prefs);
        $this->pruneStaleNotifications($hotel, $prefs);
    }

    private function loadPreferences(Hotel $hotel): array
    {
        $row = HotelAdminNotificationSetting::query()->find($hotel->id);

        return $this->normalizePreferences(array_merge(self::DEFAULT_PREFERENCES, $row?->preferences ?? []));
    }

    private function syncCacheKey(Hotel $hotel): string
    {
        return 'otelapps:notification_sync:'.$hotel->id;
    }

    private function badges(Hotel $hotel, array $prefs): array
    {
        $activity = 0;
        $concierge = 0;

        if ($prefs['activity_enabled'] && ModuleService::isEnabled('activity')) {
            $statuses = $prefs['activity_statuses'] ?: ['new'];
            $activity = HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', $statuses)
                ->count();
        }

        if ($prefs['concierge_enabled'] && ModuleService::isEnabled('concierge')) {
            $unread = (int) HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('status', '!=', 'archived')
                ->where(function ($q) {
                    $q->where('metadata->mode', 'staff')
                        ->orWhere('metadata->mode', 'waiting');
                })
                ->sum('unread_staff_count');

            $botChats = (int) HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('status', 'open')
                ->where(function ($q) {
                    $q->whereNull('metadata->mode')
                        ->orWhere('metadata->mode', 'bot')
                        ->orWhere('metadata->mode', '');
                })
                ->count();

            $waitingZeroUnread = (int) HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('status', '!=', 'archived')
                ->where('metadata->mode', 'waiting')
                ->where('unread_staff_count', 0)
                ->count();

            $concierge = $unread + $botChats + $waitingZeroUnread;
        }

        return [
            'activity' => $activity,
            'concierge' => $concierge,
            'total' => $activity + $concierge,
        ];
    }

    private function syncActivityNotifications(Hotel $hotel, array $prefs): void
    {
        if (! $prefs['activity_enabled'] || ! ModuleService::isEnabled('activity')) {
            return;
        }

        $statuses = $prefs['activity_statuses'] ?: ['new'];

        $requests = HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', $statuses)
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->take(40)
            ->get(['id', 'service_label', 'guest_display_name', 'room_number', 'status', 'updated_at']);

        if ($requests->isEmpty()) {
            return;
        }

        $statusLabels = [
            'new' => 'Nový požadavek',
            'pending' => 'Čekající požadavek',
            'in_progress' => 'Požadavek v řešení',
        ];

        $existing = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->where('source', 'activity')
            ->whereIn('source_id', $requests->pluck('id'))
            ->get()
            ->keyBy('source_id');

        foreach ($requests as $request) {
            $statusKey = (string) $request->status;
            $statusLabel = $statusLabels[$statusKey] ?? 'Požadavek';
            $title = $statusLabel.' · '.$request->service_label;
            $body = $request->guest_display_name.' · pokoj '.$request->room_number;
            $row = $existing->get($request->id);

            if ($row) {
                $changed = $row->title !== $title || $row->body !== $body;
                if ($changed) {
                    $row->forceFill([
                        'title' => $title,
                        'body' => $body,
                        'link_path' => '/activity',
                        'read_at' => null,
                    ])->save();
                }

                continue;
            }

            HotelAdminNotification::create([
                'hotel_id' => $hotel->id,
                'source' => 'activity',
                'source_id' => $request->id,
                'title' => $title,
                'body' => $body,
                'link_path' => '/activity',
                'created_at' => now(),
            ]);
        }
    }

    private function syncConciergeNotifications(Hotel $hotel, array $prefs): void
    {
        if (! $prefs['concierge_enabled'] || ! ModuleService::isEnabled('concierge')) {
            return;
        }

        $conversations = HotelConciergeConversation::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', '!=', 'archived')
            ->where(function ($q) {
                $q->where(function ($attention) {
                    $attention->where('metadata->mode', 'waiting')
                        ->orWhere(function ($staff) {
                            $staff->where('metadata->mode', 'staff')
                                ->where('unread_staff_count', '>', 0);
                        });
                })->orWhere(function ($bot) {
                    $bot->where('status', 'open')
                        ->where(function ($modes) {
                            $modes->whereNull('metadata->mode')
                                ->orWhere('metadata->mode', 'bot')
                                ->orWhere('metadata->mode', '');
                        });
                });
            })
            ->orderByDesc('last_message_at')
            ->take(40)
            ->get(['id', 'guest_display_name', 'room_number', 'unread_staff_count', 'metadata']);

        if ($conversations->isEmpty()) {
            return;
        }

        $existing = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->where('source', 'concierge')
            ->whereIn('source_id', $conversations->pluck('id'))
            ->get()
            ->keyBy('source_id');

        foreach ($conversations as $conv) {
            $mode = data_get($conv->metadata, 'mode', 'bot');
            $count = (int) $conv->unread_staff_count;

            if ($mode === 'waiting') {
                $title = 'Žádá člověka · '.$conv->guest_display_name;
                $body = ($conv->room_number ? 'Pokoj '.$conv->room_number.' · ' : '')
                    .'Host chce živou recepci';
            } elseif ($mode === 'staff') {
                $title = 'Nová zpráva · '.$conv->guest_display_name;
                $body = ($conv->room_number ? 'Pokoj '.$conv->room_number.' · ' : '')
                    .$count.' nepřečten'.($count === 1 ? 'á' : 'ých');
            } else {
                $title = 'Chat s AI · '.$conv->guest_display_name;
                $body = ($conv->room_number ? 'Pokoj '.$conv->room_number.' · ' : '')
                    .'Host řeší s chatbotem';
            }

            $row = $existing->get($conv->id);

            if ($row) {
                $changed = $row->title !== $title || $row->body !== $body;
                if ($changed) {
                    $row->forceFill([
                        'title' => $title,
                        'body' => $body,
                        'link_path' => '/concierge',
                        'read_at' => null,
                    ])->save();
                }

                continue;
            }

            HotelAdminNotification::create([
                'hotel_id' => $hotel->id,
                'source' => 'concierge',
                'source_id' => $conv->id,
                'title' => $title,
                'body' => $body,
                'link_path' => '/concierge',
                'created_at' => now(),
            ]);
        }
    }

    private function pruneStaleNotifications(Hotel $hotel, array $prefs): void
    {
        if ($prefs['activity_enabled'] && ModuleService::isEnabled('activity')) {
            $statuses = $prefs['activity_statuses'] ?: ['new'];
            $activeIds = HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', $statuses)
                ->pluck('id');

            HotelAdminNotification::query()
                ->where('hotel_id', $hotel->id)
                ->where('source', 'activity')
                ->whereNotIn('source_id', $activeIds)
                ->delete();
        } else {
            HotelAdminNotification::query()
                ->where('hotel_id', $hotel->id)
                ->where('source', 'activity')
                ->delete();
        }

        if ($prefs['concierge_enabled'] && ModuleService::isEnabled('concierge')) {
            $activeIds = HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('status', '!=', 'archived')
                ->where(function ($q) {
                    $q->where('metadata->mode', 'waiting')
                        ->orWhere(function ($staff) {
                            $staff->where('metadata->mode', 'staff')
                                ->where('unread_staff_count', '>', 0);
                        })
                        ->orWhere(function ($bot) {
                            $bot->where('status', 'open')
                                ->where(function ($modes) {
                                    $modes->whereNull('metadata->mode')
                                        ->orWhere('metadata->mode', 'bot')
                                        ->orWhere('metadata->mode', '');
                                });
                        });
                })
                ->pluck('id');

            HotelAdminNotification::query()
                ->where('hotel_id', $hotel->id)
                ->where('source', 'concierge')
                ->whereNotIn('source_id', $activeIds)
                ->delete();
        } else {
            HotelAdminNotification::query()
                ->where('hotel_id', $hotel->id)
                ->where('source', 'concierge')
                ->delete();
        }
    }

    private function notificationPayload(HotelAdminNotification $n): array
    {
        return [
            'id' => $n->id,
            'source' => $n->source,
            'source_id' => $n->source_id,
            'title' => $n->title,
            'body' => $n->body,
            'link_path' => $n->link_path,
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toIso8601String(),
        ];
    }

    private function normalizePreferences(array $prefs): array
    {
        $statuses = collect($prefs['activity_statuses'] ?? ['new'])
            ->filter(fn ($s) => in_array($s, ['new', 'pending', 'in_progress'], true))
            ->values()
            ->all();

        if ($statuses === []) {
            $statuses = ['new'];
        }

        $interval = (int) ($prefs['poll_interval_seconds'] ?? 15);
        if (! in_array($interval, [10, 15, 30, 60], true)) {
            $interval = 15;
        }

        return [
            'activity_enabled' => (bool) ($prefs['activity_enabled'] ?? true),
            'activity_statuses' => $statuses,
            'concierge_enabled' => (bool) ($prefs['concierge_enabled'] ?? true),
            'toast_enabled' => (bool) ($prefs['toast_enabled'] ?? true),
            'browser_notifications' => (bool) ($prefs['browser_notifications'] ?? true),
            'sound_enabled' => (bool) ($prefs['sound_enabled'] ?? true),
            'poll_interval_seconds' => $interval,
            'guest_push_enabled' => (bool) ($prefs['guest_push_enabled'] ?? true),
            'guest_push_on_status_change' => (bool) ($prefs['guest_push_on_status_change'] ?? true),
            'guest_push_on_concierge' => (bool) ($prefs['guest_push_on_concierge'] ?? true),
        ];
    }

    /**
     * Jednorázová / upsert admin notifikace pro Concierge (AI start, žádost o člověka, …).
     *
     * @param  'bot_started'|'waiting'|'staff_unread'  $kind
     */
    public function upsertConciergeAdminNotice(HotelConciergeConversation $conversation, string $kind): void
    {
        $hotel = Hotel::query()->find($conversation->hotel_id);
        if (! $hotel || ! ModuleService::isEnabled('concierge')) {
            return;
        }

        $prefs = $this->settings($hotel)['preferences'];
        if (! ($prefs['concierge_enabled'] ?? true)) {
            return;
        }

        [$title, $body] = match ($kind) {
            'bot_started' => [
                'Chat s AI · '.$conversation->guest_display_name,
                ($conversation->room_number ? 'Pokoj '.$conversation->room_number.' · ' : '')
                    .'Host začal řešení s chatbotem',
            ],
            'waiting' => [
                'Žádá člověka · '.$conversation->guest_display_name,
                ($conversation->room_number ? 'Pokoj '.$conversation->room_number.' · ' : '')
                    .'Host chce živou recepci',
            ],
            default => [
                'Nová zpráva · '.$conversation->guest_display_name,
                ($conversation->room_number ? 'Pokoj '.$conversation->room_number.' · ' : '')
                    .'Nepřečtená zpráva v Concierge',
            ],
        };

        $existing = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->where('source', 'concierge')
            ->where('source_id', $conversation->id)
            ->first();

        if ($existing) {
            $existing->forceFill([
                'title' => $title,
                'body' => $body,
                'link_path' => '/concierge',
                'read_at' => null,
                'created_at' => now(),
            ])->save();

            return;
        }

        HotelAdminNotification::create([
            'hotel_id' => $hotel->id,
            'source' => 'concierge',
            'source_id' => $conversation->id,
            'title' => $title,
            'body' => $body,
            'link_path' => '/concierge',
            'created_at' => now(),
        ]);

        Cache::forget($this->syncCacheKey($hotel));
    }
}
