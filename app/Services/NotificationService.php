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
        'activity_statuses' => ['new'],
        'concierge_enabled' => true,
        'toast_enabled' => true,
        'browser_notifications' => true,
        'sound_enabled' => false,
        'poll_interval_seconds' => 15,
        'guest_push_enabled' => true,
        'guest_push_on_status_change' => true,
    ];

    private const SYNC_CACHE_SECONDS = 30;

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
        $merged = array_merge($current, array_intersect_key($data, array_flip(array_keys(self::DEFAULT_PREFERENCES))));
        $normalized = $this->normalizePreferences($merged);

        HotelAdminNotificationSetting::query()->updateOrCreate(
            ['hotel_id' => $hotel->id],
            ['preferences' => $normalized],
        );

        Cache::forget($this->syncCacheKey($hotel));

        return $this->settings($hotel);
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
            $concierge = (int) HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('status', '!=', 'archived')
                ->sum('unread_staff_count');
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
            ->orderByDesc('created_at')
            ->take(25)
            ->get(['id', 'service_label', 'guest_display_name', 'room_number']);

        if ($requests->isEmpty()) {
            return;
        }

        $existing = HotelAdminNotification::query()
            ->where('hotel_id', $hotel->id)
            ->where('source', 'activity')
            ->whereIn('source_id', $requests->pluck('id'))
            ->get()
            ->keyBy('source_id');

        foreach ($requests as $request) {
            $title = 'Nový požadavek · '.$request->service_label;
            $body = $request->guest_display_name.' · pokoj '.$request->room_number;
            $row = $existing->get($request->id);

            if ($row) {
                $changed = $row->title !== $title || $row->body !== $body;
                if ($changed) {
                    $row->update([
                        'title' => $title,
                        'body' => $body,
                        'link_path' => '/activity',
                        'read_at' => null,
                    ]);
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
            ->where('unread_staff_count', '>', 0)
            ->orderByDesc('last_message_at')
            ->take(25)
            ->get(['id', 'guest_display_name', 'room_number', 'unread_staff_count']);

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
            $count = (int) $conv->unread_staff_count;
            $title = 'Nová zpráva · '.$conv->guest_display_name;
            $body = 'Pokoj '.$conv->room_number.' · '.$count.' nepřečten'.($count === 1 ? 'á' : 'ých');
            $row = $existing->get($conv->id);

            if ($row) {
                $changed = $row->title !== $title || $row->body !== $body;
                if ($changed) {
                    $row->update([
                        'title' => $title,
                        'body' => $body,
                        'link_path' => '/concierge',
                        'read_at' => null,
                    ]);
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
                ->where('unread_staff_count', '>', 0)
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
            'sound_enabled' => (bool) ($prefs['sound_enabled'] ?? false),
            'poll_interval_seconds' => $interval,
            'guest_push_enabled' => (bool) ($prefs['guest_push_enabled'] ?? true),
            'guest_push_on_status_change' => (bool) ($prefs['guest_push_on_status_change'] ?? true),
        ];
    }
}
