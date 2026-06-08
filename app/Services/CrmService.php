<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeConversation;
use App\Models\HotelCrmAlert;
use App\Models\HotelCrmGuestProfile;
use App\Models\HotelCrmInteraction;
use App\Models\HotelCrmPromotion;
use App\Models\HotelCrmTask;
use App\Models\HotelServiceRequest;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CrmService
{
    private const OPEN_STATUSES = ['new', 'pending', 'in_progress'];

    public function overview(Hotel $hotel): array
    {
        $guests = $this->buildGuestList($hotel);
        $alerts = $this->alerts($hotel);
        $promotions = HotelCrmPromotion::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', ['active', 'scheduled'])
            ->count();

        $openTasks = $this->openTaskCount($hotel);

        return [
            'kpis' => [
                'guests_total' => $guests->count(),
                'vip_guests' => $guests->where('segment', 'vip')->count(),
                'active_alerts' => collect($alerts)->where('status', 'active')->count(),
                'active_promotions' => $promotions,
                'open_requests' => $this->openRequestCount($hotel),
                'unread_chats' => $this->unreadChatCount($hotel),
                'open_tasks' => $openTasks,
                'interactions_7d' => $this->recentInteractionCount($hotel, 7),
            ],
            'recent_guests' => $guests->sortByDesc('last_seen')->take(5)->values()->all(),
            'recent_alerts' => collect($alerts)->where('status', 'active')->take(5)->values()->all(),
        ];
    }

    /**
     * Metriky pobytu pro dashboard — CRM profily + fallback z Activity/Concierge.
     *
     * @return array{
     *   guests_staying: int,
     *   arrivals_today: int,
     *   departures_today: int,
     *   guests_staying_yesterday: int,
     *   data_source: string
     * }
     */
    public function stayMetrics(Hotel $hotel): array
    {
        $tz = config('app.timezone', 'Europe/Prague');
        $today = \Carbon\Carbon::now($tz)->startOfDay();
        $yesterdayEnd = $today->copy()->subDay()->endOfDay();

        $inHouse = 0;
        $arrivalsToday = 0;
        $departuresToday = 0;
        $inHouseYesterday = 0;
        $dataSource = 'none';

        try {
            $profiles = HotelCrmGuestProfile::query()
                ->where('hotel_id', $hotel->id)
                ->get(['check_in_at', 'check_out_at']);

            if ($profiles->isNotEmpty()) {
                foreach ($profiles as $profile) {
                    $checkIn = $profile->check_in_at?->toIso8601String();
                    $checkOut = $profile->check_out_at?->toIso8601String();

                    if ($this->isInHouseAt($checkIn, $checkOut, now())) {
                        $inHouse++;
                    }
                    if ($this->isInHouseAt($checkIn, $checkOut, $yesterdayEnd)) {
                        $inHouseYesterday++;
                    }
                    if ($this->isDateOn($checkIn, $today)) {
                        $arrivalsToday++;
                    }
                    if ($this->isDateOn($checkOut, $today)) {
                        $departuresToday++;
                    }
                }
                $dataSource = 'crm_stays';
            }
        } catch (\Throwable) {
            // CRM tabulky nemusí existovat
        }

        if ($inHouse === 0 && ModuleService::isEnabled('activity')) {
            $inHouse = (int) HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', self::OPEN_STATUSES)
                ->whereNotNull('room_number')
                ->where('room_number', '!=', '')
                ->distinct()
                ->count('room_number');

            if ($inHouse > 0) {
                $dataSource = 'activity_rooms';
            }
        }

        return [
            'guests_staying' => $inHouse,
            'arrivals_today' => $arrivalsToday,
            'departures_today' => $departuresToday,
            'guests_staying_yesterday' => $inHouseYesterday,
            'data_source' => $dataSource,
        ];
    }

    public function guests(Hotel $hotel, ?string $q = null, ?string $segment = null, ?string $locale = null): array
    {
        $guests = $this->buildGuestList($hotel);

        if ($q) {
            $term = Str::lower($q);
            $guests = $guests->filter(function (array $g) use ($term) {
                return Str::contains(Str::lower($g['name']), $term)
                    || Str::contains(Str::lower((string) $g['room']), $term)
                    || Str::contains(Str::lower((string) $g['email']), $term)
                    || Str::contains(Str::lower((string) $g['guest_external_id']), $term);
            });
        }

        if ($segment && $segment !== 'all') {
            $guests = $guests->where('segment', $segment);
        }

        if ($locale && $locale !== 'all') {
            $guests = $guests->filter(fn (array $g) => $this->normalizeLocale($g['locale']) === $locale);
        }

        return [
            'guests' => $guests->sortByDesc('activity_score')->values()->all(),
            'segments' => $this->segmentCounts($guests),
        ];
    }

    public function guestDetail(Hotel $hotel, string $guestKey): ?array
    {
        $guests = $this->buildGuestList($hotel);
        $guest = $guests->firstWhere('key', $guestKey);

        if (! $guest) {
            return null;
        }

        $recentRequests = collect();
        if (ModuleService::isEnabled('activity')) {
            $recentRequests = HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->where(function ($query) use ($guest) {
                    if ($guest['guest_external_id']) {
                        $query->where('guest_external_id', $guest['guest_external_id']);
                    } else {
                        $query->where('guest_display_name', $guest['name'])
                            ->where('room_number', $guest['room']);
                    }
                })
                ->orderByDesc('created_at')
                ->take(8)
                ->get()
                ->map(fn (HotelServiceRequest $r) => [
                    'id' => $r->id,
                    'service_label' => $r->service_label,
                    'status' => $r->status,
                    'request_text' => $r->request_text,
                    'created_at' => $r->created_at?->toIso8601String(),
                ]);
        }

        return [
            ...$guest,
            'recent_requests' => $recentRequests->values()->all(),
            'timeline' => $this->guestTimeline($hotel, $guestKey),
        ];
    }

    public function guestTimeline(Hotel $hotel, string $guestKey): array
    {
        $events = collect();

        if (ModuleService::isEnabled('activity')) {
            $guest = $this->buildGuestList($hotel)->firstWhere('key', $guestKey);
            if ($guest) {
                $requests = HotelServiceRequest::query()
                    ->where('hotel_id', $hotel->id)
                    ->where(function ($query) use ($guest) {
                        if ($guest['guest_external_id']) {
                            $query->where('guest_external_id', $guest['guest_external_id']);
                        } else {
                            $query->where('guest_display_name', $guest['name'])
                                ->where('room_number', $guest['room']);
                        }
                    })
                    ->orderByDesc('created_at')
                    ->take(15)
                    ->get();

                foreach ($requests as $request) {
                    $events->push([
                        'type' => 'request',
                        'title' => $request->service_label,
                        'body' => $request->request_text,
                        'meta' => $request->status,
                        'at' => $request->created_at?->toIso8601String(),
                    ]);
                }
            }
        }

        foreach (
            HotelCrmInteraction::query()
                ->where('hotel_id', $hotel->id)
                ->where('guest_key', $guestKey)
                ->orderByDesc('created_at')
                ->take(15)
                ->get() as $interaction
        ) {
            $events->push($this->interactionPayload($interaction));
        }

        foreach (
            HotelCrmTask::query()
                ->where('hotel_id', $hotel->id)
                ->where('guest_key', $guestKey)
                ->orderByDesc('created_at')
                ->take(10)
                ->get() as $task
        ) {
            $events->push([
                'type' => 'task',
                'title' => $task->title,
                'body' => $task->description,
                'meta' => $task->status,
                'at' => ($task->completed_at ?? $task->created_at)?->toIso8601String(),
            ]);
        }

        return $events
            ->filter(fn (array $e) => ! empty($e['at']))
            ->sortByDesc('at')
            ->take(20)
            ->values()
            ->all();
    }

    public function history(Hotel $hotel, ?string $guestKey = null, int $limit = 50): array
    {
        $events = collect();

        $interactions = HotelCrmInteraction::query()
            ->where('hotel_id', $hotel->id)
            ->when($guestKey, fn ($q) => $q->where('guest_key', $guestKey))
            ->orderByDesc('created_at')
            ->take($limit)
            ->get();

        foreach ($interactions as $interaction) {
            $events->push($this->interactionPayload($interaction));
        }

        if (ModuleService::isEnabled('activity') && ! $guestKey) {
            $requests = HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->orderByDesc('created_at')
                ->take(20)
                ->get();

            foreach ($requests as $request) {
                $key = $this->guestKey($request->guest_external_id, $request->room_number, $request->guest_display_name);
                $events->push([
                    'type' => 'request',
                    'guest_key' => $key,
                    'title' => 'Požadavek · '.$request->service_label,
                    'body' => $request->guest_display_name.' · pokoj '.$request->room_number,
                    'meta' => $request->status,
                    'channel' => 'activity',
                    'direction' => 'inbound',
                    'staff_name' => null,
                    'at' => $request->created_at?->toIso8601String(),
                ]);
            }
        }

        return [
            'events' => $events
                ->filter(fn (array $e) => ! empty($e['at']))
                ->sortByDesc('at')
                ->take($limit)
                ->values()
                ->all(),
        ];
    }

    public function tasks(Hotel $hotel, ?string $status = null): array
    {
        $query = HotelCrmTask::query()
            ->where('hotel_id', $hotel->id)
            ->orderByRaw("case status when 'open' then 0 when 'done' then 1 else 2 end")
            ->orderByRaw("case priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end")
            ->orderBy('due_at');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $allTasks = HotelCrmTask::query()->where('hotel_id', $hotel->id)->get();
        $tasks = $query->get()->map(fn (HotelCrmTask $t) => $this->taskPayload($t))->values()->all();
        $guests = $this->buildGuestList($hotel)->keyBy('key');

        return [
            'tasks' => $tasks,
            'counts' => [
                'open' => $allTasks->where('status', 'open')->count(),
                'done' => $allTasks->where('status', 'done')->count(),
                'overdue' => $allTasks->filter(function (HotelCrmTask $t) {
                    return $t->status === 'open' && $t->due_at && now()->gt($t->due_at);
                })->count(),
            ],
            'guest_names' => collect($tasks)
                ->pluck('guest_key')
                ->filter()
                ->unique()
                ->mapWithKeys(fn (string $key) => [$key => $guests->get($key)['name'] ?? 'Host'])
                ->all(),
        ];
    }

    public function createTask(Hotel $hotel, array $data): array
    {
        $task = HotelCrmTask::create([
            'hotel_id' => $hotel->id,
            'guest_key' => $data['guest_key'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => 'open',
            'priority' => $data['priority'] ?? 'normal',
            'task_type' => $data['task_type'] ?? 'follow_up',
            'assigned_staff_name' => $data['assigned_staff_name'] ?? null,
            'due_at' => $data['due_at'] ?? null,
        ]);

        return $this->taskPayload($task);
    }

    public function updateTask(Hotel $hotel, string $id, array $data): ?array
    {
        $task = HotelCrmTask::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $id)
            ->first();

        if (! $task) {
            return null;
        }

        $fill = array_filter([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? null,
            'priority' => $data['priority'] ?? null,
            'task_type' => $data['task_type'] ?? null,
            'assigned_staff_name' => $data['assigned_staff_name'] ?? null,
            'due_at' => array_key_exists('due_at', $data) ? $data['due_at'] : null,
            'guest_key' => array_key_exists('guest_key', $data) ? $data['guest_key'] : null,
        ], fn ($v) => $v !== null);

        if (($fill['status'] ?? null) === 'done' && ! $task->completed_at) {
            $fill['completed_at'] = now();
        }

        if (($fill['status'] ?? null) === 'open') {
            $fill['completed_at'] = null;
        }

        $task->update($fill);

        return $this->taskPayload($task->fresh());
    }

    public function createInteraction(Hotel $hotel, array $data): array
    {
        $interaction = HotelCrmInteraction::create([
            'hotel_id' => $hotel->id,
            'guest_key' => $data['guest_key'] ?? null,
            'channel' => $data['channel'] ?? 'note',
            'direction' => $data['direction'] ?? 'outbound',
            'subject' => $data['subject'],
            'body' => $data['body'] ?? null,
            'staff_name' => $data['staff_name'] ?? null,
            'created_at' => now(),
        ]);

        return $this->interactionPayload($interaction);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportGuestsRows(Hotel $hotel): array
    {
        return $this->buildGuestList($hotel)
            ->sortByDesc('activity_score')
            ->map(fn (array $g) => [
                'name' => $g['name'],
                'room' => $g['room'],
                'email' => $g['email'] ?? '',
                'phone' => $g['phone'] ?? '',
                'segment' => $g['segment_label'],
                'locale' => $g['locale'],
                'loyalty_points' => $g['loyalty_points'] ?? 0,
                'stay_count' => $g['stay_count'] ?? 0,
                'marketing_consent' => ($g['marketing_consent'] ?? false) ? 'ano' : 'ne',
                'check_in' => $g['check_in_at'] ?? '',
                'check_out' => $g['check_out_at'] ?? '',
                'assigned_staff' => $g['assigned_staff_name'] ?? '',
                'company' => $g['company_name'] ?? '',
                'requests' => $g['requests'],
                'conversations' => $g['conversations'],
                'last_seen' => $g['last_seen'] ?? '',
                'notes' => $g['notes'] ?? '',
            ])
            ->values()
            ->all();
    }

    public function createGuest(Hotel $hotel, array $data): array
    {
        $displayName = trim((string) ($data['display_name'] ?? ''));
        $roomNumber = trim((string) ($data['room_number'] ?? ''));
        $externalId = trim((string) ($data['guest_external_id'] ?? ''));

        $guestKey = $this->guestKey(
            $externalId !== '' ? $externalId : null,
            $roomNumber,
            $displayName,
        );

        if (HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'display_name' => ['Host s tímto jménem a pokojem už v CRM existuje.'],
            ]);
        }

        return $this->upsertGuestProfile($hotel, $guestKey, array_merge($data, [
            'display_name' => $displayName,
            'room_number' => $roomNumber !== '' ? $roomNumber : null,
            'guest_external_id' => $externalId !== '' ? $externalId : null,
        ]));
    }

    public function upsertGuestProfile(Hotel $hotel, string $guestKey, array $data): array
    {
        $profile = HotelCrmGuestProfile::query()->firstOrNew([
            'hotel_id' => $hotel->id,
            'guest_key' => $guestKey,
        ]);

        $profile->fill([
            'guest_external_id' => $data['guest_external_id'] ?? $profile->guest_external_id,
            'display_name' => $data['display_name'] ?? $profile->display_name,
            'room_number' => $data['room_number'] ?? $profile->room_number,
            'email' => $data['email'] ?? $profile->email,
            'phone' => $data['phone'] ?? $profile->phone,
            'locale' => $data['locale'] ?? $profile->locale,
            'segment' => $data['segment'] ?? $profile->segment ?? 'standard',
            'tags' => $data['tags'] ?? $profile->tags ?? [],
            'notes' => $data['notes'] ?? $profile->notes,
            'check_in_at' => $data['check_in_at'] ?? $profile->check_in_at,
            'check_out_at' => $data['check_out_at'] ?? $profile->check_out_at,
            'marketing_consent' => $data['marketing_consent'] ?? $profile->marketing_consent ?? false,
            'marketing_consent_at' => array_key_exists('marketing_consent', $data)
                ? ($data['marketing_consent'] ? now() : null)
                : $profile->marketing_consent_at,
            'preferences' => $data['preferences'] ?? $profile->preferences ?? [],
            'loyalty_points' => $data['loyalty_points'] ?? $profile->loyalty_points ?? 0,
            'stay_count' => $data['stay_count'] ?? $profile->stay_count ?? 0,
            'assigned_staff_name' => $data['assigned_staff_name'] ?? $profile->assigned_staff_name,
            'company_name' => $data['company_name'] ?? $profile->company_name,
            'nationality' => $data['nationality'] ?? $profile->nationality,
        ]);
        $profile->save();

        $detail = $this->guestDetail($hotel, $guestKey);

        return $detail ?? [];
    }

    public function alerts(Hotel $hotel): array
    {
        $this->syncSystemAlerts($hotel);

        return HotelCrmAlert::query()
            ->where('hotel_id', $hotel->id)
            ->orderByRaw("case severity when 'critical' then 0 when 'warning' then 1 else 2 end")
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (HotelCrmAlert $a) => $this->alertPayload($a))
            ->values()
            ->all();
    }

    public function createAlert(Hotel $hotel, array $data): array
    {
        $alert = HotelCrmAlert::create([
            'hotel_id' => $hotel->id,
            'guest_key' => $data['guest_key'] ?? null,
            'alert_type' => 'manual',
            'severity' => $data['severity'] ?? 'info',
            'title' => $data['title'],
            'body' => $data['body'] ?? null,
            'status' => 'active',
            'source_module' => 'crm',
        ]);

        return $this->alertPayload($alert);
    }

    public function dismissAlert(Hotel $hotel, string $id): ?array
    {
        $alert = HotelCrmAlert::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $id)
            ->first();

        if (! $alert) {
            return null;
        }

        $alert->update([
            'status' => 'dismissed',
            'resolved_at' => now(),
        ]);

        return $this->alertPayload($alert->fresh());
    }

    public function promotions(Hotel $hotel): array
    {
        return HotelCrmPromotion::query()
            ->where('hotel_id', $hotel->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (HotelCrmPromotion $p) => $this->promotionPayload($p))
            ->values()
            ->all();
    }

    public function createPromotion(Hotel $hotel, array $data): array
    {
        $promotion = HotelCrmPromotion::create([
            'hotel_id' => $hotel->id,
            ...$this->promotionFillable($data),
        ]);

        return $this->promotionPayload($promotion);
    }

    public function updatePromotion(Hotel $hotel, string $id, array $data): ?array
    {
        $promotion = HotelCrmPromotion::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $id)
            ->first();

        if (! $promotion) {
            return null;
        }

        $promotion->update($this->promotionFillable($data));
        $promotion->refresh();

        return $this->promotionPayload($promotion);
    }

    public function deletePromotion(Hotel $hotel, string $id): bool
    {
        return HotelCrmPromotion::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $id)
            ->delete() > 0;
    }

    private function buildGuestList(Hotel $hotel): Collection
    {
        $map = [];
        $profiles = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->get()
            ->keyBy('guest_key');

        if (ModuleService::isEnabled('activity')) {
            foreach (HotelServiceRequest::query()->where('hotel_id', $hotel->id)->get() as $request) {
                $this->mergeGuestFromRequest($map, $request);
            }
        }

        if (ModuleService::isEnabled('concierge')) {
            foreach (HotelConciergeConversation::query()->where('hotel_id', $hotel->id)->get() as $conv) {
                $this->mergeGuestFromConversation($map, $conv);
            }
        }

        foreach ($profiles as $key => $profile) {
            if (! isset($map[$key])) {
                $map[$key] = $this->emptyGuest($key);
            }
            $map[$key]['name'] = $profile->display_name ?: $map[$key]['name'];
            $map[$key]['room'] = $profile->room_number ?: $map[$key]['room'];
            $map[$key]['email'] = $profile->email;
            $map[$key]['phone'] = $profile->phone;
            $map[$key]['locale'] = $profile->locale ?: $map[$key]['locale'];
            $map[$key]['segment'] = $profile->segment;
            $map[$key]['tags'] = $profile->tags ?? [];
            $map[$key]['notes'] = $profile->notes;
            $map[$key]['has_profile'] = true;
            $map[$key]['check_in_at'] = $profile->check_in_at?->toIso8601String();
            $map[$key]['check_out_at'] = $profile->check_out_at?->toIso8601String();
            $map[$key]['marketing_consent'] = (bool) $profile->marketing_consent;
            $map[$key]['marketing_consent_at'] = $profile->marketing_consent_at?->toIso8601String();
            $map[$key]['preferences'] = $profile->preferences ?? [];
            $map[$key]['loyalty_points'] = (int) ($profile->loyalty_points ?? 0);
            $map[$key]['stay_count'] = (int) ($profile->stay_count ?? 0);
            $map[$key]['assigned_staff_name'] = $profile->assigned_staff_name;
            $map[$key]['company_name'] = $profile->company_name;
            $map[$key]['nationality'] = $profile->nationality;
        }

        return collect($map)->map(function (array $g) {
            $g['activity_score'] = $g['requests'] + $g['conversations'] * 2 + ($g['open_requests'] * 3);
            $g['last_seen'] = $g['last_seen']?->toIso8601String();
            $g['segment_label'] = $this->segmentLabel($g['segment']);
            $g['in_house'] = $this->isInHouse($g['check_in_at'], $g['check_out_at']);

            return $g;
        })->values();
    }

    private function mergeGuestFromRequest(array &$map, HotelServiceRequest $request): void
    {
        $key = $this->guestKey($request->guest_external_id, $request->room_number, $request->guest_display_name);
        if (! isset($map[$key])) {
            $map[$key] = $this->emptyGuest($key);
        }
        $g = &$map[$key];
        $g['name'] = $request->guest_display_name ?: $g['name'];
        $g['room'] = $request->room_number ?: $g['room'];
        $g['guest_external_id'] = $request->guest_external_id ?: $g['guest_external_id'];
        $g['locale'] = $request->guest_locale ?: $g['locale'];
        $g['email'] = $request->guest_email ?: $g['email'];
        $g['phone'] = $request->guest_phone ?: $g['phone'];
        $g['requests']++;
        if (in_array($request->status, self::OPEN_STATUSES, true)) {
            $g['open_requests']++;
        }
        if ($request->created_at && ($g['last_seen_raw'] === null || $request->created_at->gt($g['last_seen_raw']))) {
            $g['last_seen_raw'] = $request->created_at;
            $g['last_seen'] = $request->created_at;
        }
        if (($g['requests'] + $g['conversations']) > 1 && $g['segment'] === 'standard') {
            $g['segment'] = 'returning';
        }
    }

    private function mergeGuestFromConversation(array &$map, HotelConciergeConversation $conv): void
    {
        $key = $this->guestKey($conv->guest_external_id, $conv->room_number, $conv->guest_display_name);
        if (! isset($map[$key])) {
            $map[$key] = $this->emptyGuest($key);
        }
        $g = &$map[$key];
        $g['name'] = $conv->guest_display_name ?: $g['name'];
        $g['room'] = $conv->room_number ?: $g['room'];
        $g['guest_external_id'] = $conv->guest_external_id ?: $g['guest_external_id'];
        $g['locale'] = $conv->guest_locale ?: $g['locale'];
        $g['conversations']++;
        $g['unread_chat'] += (int) $conv->unread_staff_count;
        $seen = $conv->last_message_at ?? $conv->created_at;
        if ($seen && ($g['last_seen_raw'] === null || $seen->gt($g['last_seen_raw']))) {
            $g['last_seen_raw'] = $seen;
            $g['last_seen'] = $seen;
        }
    }

    private function emptyGuest(string $key): array
    {
        return [
            'key' => $key,
            'name' => 'Host',
            'room' => '—',
            'guest_external_id' => null,
            'email' => null,
            'phone' => null,
            'locale' => 'cs',
            'segment' => 'standard',
            'segment_label' => 'Standard',
            'tags' => [],
            'notes' => null,
            'has_profile' => false,
            'requests' => 0,
            'conversations' => 0,
            'open_requests' => 0,
            'unread_chat' => 0,
            'last_seen' => null,
            'last_seen_raw' => null,
            'check_in_at' => null,
            'check_out_at' => null,
            'marketing_consent' => false,
            'marketing_consent_at' => null,
            'preferences' => [],
            'loyalty_points' => 0,
            'stay_count' => 0,
            'assigned_staff_name' => null,
            'company_name' => null,
            'nationality' => null,
            'in_house' => false,
        ];
    }

    private function syncSystemAlerts(Hotel $hotel): void
    {
        HotelCrmAlert::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('alert_type', ['open_request', 'unread_chat'])
            ->where('status', 'active')
            ->update(['status' => 'resolved', 'resolved_at' => now()]);

        if (ModuleService::isEnabled('activity')) {
            $open = HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', self::OPEN_STATUSES)
                ->orderByDesc('created_at')
                ->get();

            foreach ($open->take(20) as $request) {
                $key = $this->guestKey($request->guest_external_id, $request->room_number, $request->guest_display_name);
                $exists = HotelCrmAlert::query()
                    ->where('hotel_id', $hotel->id)
                    ->where('source_module', 'activity')
                    ->where('source_id', $request->id)
                    ->where('status', 'active')
                    ->exists();

                if ($exists) {
                    continue;
                }

                HotelCrmAlert::create([
                    'hotel_id' => $hotel->id,
                    'guest_key' => $key,
                    'alert_type' => 'open_request',
                    'severity' => $request->priority >= 2 ? 'critical' : 'warning',
                    'title' => 'Otevřený požadavek · '.$request->service_label,
                    'body' => $request->guest_display_name.' · pokoj '.$request->room_number,
                    'status' => 'active',
                    'source_module' => 'activity',
                    'source_id' => $request->id,
                ]);
            }
        }

        if (ModuleService::isEnabled('concierge')) {
            $unread = HotelConciergeConversation::query()
                ->where('hotel_id', $hotel->id)
                ->where('unread_staff_count', '>', 0)
                ->get();

            foreach ($unread as $conv) {
                $key = $this->guestKey($conv->guest_external_id, $conv->room_number, $conv->guest_display_name);
                HotelCrmAlert::create([
                    'hotel_id' => $hotel->id,
                    'guest_key' => $key,
                    'alert_type' => 'unread_chat',
                    'severity' => 'warning',
                    'title' => 'Nepřečtený chat · '.$conv->guest_display_name,
                    'body' => 'Pokoj '.$conv->room_number.' · '.$conv->unread_staff_count.' zpráv',
                    'status' => 'active',
                    'source_module' => 'concierge',
                    'source_id' => $conv->id,
                ]);
            }
        }
    }

    private function openRequestCount(Hotel $hotel): int
    {
        if (! ModuleService::isEnabled('activity')) {
            return 0;
        }

        return HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', self::OPEN_STATUSES)
            ->count();
    }

    private function unreadChatCount(Hotel $hotel): int
    {
        if (! ModuleService::isEnabled('concierge')) {
            return 0;
        }

        return (int) HotelConciergeConversation::query()
            ->where('hotel_id', $hotel->id)
            ->sum('unread_staff_count');
    }

    private function openTaskCount(Hotel $hotel): int
    {
        return HotelCrmTask::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', 'open')
            ->count();
    }

    private function recentInteractionCount(Hotel $hotel, int $days): int
    {
        return HotelCrmInteraction::query()
            ->where('hotel_id', $hotel->id)
            ->where('created_at', '>=', now()->subDays($days))
            ->count();
    }

    private function taskPayload(HotelCrmTask $t): array
    {
        return [
            'id' => $t->id,
            'guest_key' => $t->guest_key,
            'title' => $t->title,
            'description' => $t->description,
            'status' => $t->status,
            'status_label' => $this->taskStatusLabel($t->status),
            'priority' => $t->priority,
            'priority_label' => $this->taskPriorityLabel($t->priority),
            'task_type' => $t->task_type,
            'task_type_label' => $this->taskTypeLabel($t->task_type),
            'assigned_staff_name' => $t->assigned_staff_name,
            'due_at' => $t->due_at?->toIso8601String(),
            'completed_at' => $t->completed_at?->toIso8601String(),
            'created_at' => $t->created_at?->toIso8601String(),
            'is_overdue' => $t->status === 'open' && $t->due_at && now()->gt($t->due_at),
        ];
    }

    private function interactionPayload(HotelCrmInteraction $i): array
    {
        return [
            'id' => $i->id,
            'type' => 'interaction',
            'guest_key' => $i->guest_key,
            'channel' => $i->channel,
            'channel_label' => $this->channelLabel($i->channel),
            'direction' => $i->direction,
            'title' => $i->subject,
            'body' => $i->body,
            'staff_name' => $i->staff_name,
            'at' => $i->created_at?->toIso8601String(),
        ];
    }

    private function isInHouse(?string $checkIn, ?string $checkOut): bool
    {
        if (! $checkIn || ! $checkOut) {
            return false;
        }

        return $this->isInHouseAt($checkIn, $checkOut, now());
    }

    private function isInHouseAt(?string $checkIn, ?string $checkOut, \Carbon\Carbon $at): bool
    {
        if (! $checkIn || ! $checkOut) {
            return false;
        }

        $in = \Carbon\Carbon::parse($checkIn);
        $out = \Carbon\Carbon::parse($checkOut);

        return $at->gte($in) && $at->lte($out);
    }

    private function isDateOn(?string $iso, \Carbon\Carbon $day): bool
    {
        if (! $iso) {
            return false;
        }

        return \Carbon\Carbon::parse($iso)->timezone($day->timezone)->startOfDay()->equalTo($day);
    }

    private function taskStatusLabel(string $status): string
    {
        return match ($status) {
            'done' => 'Hotovo',
            'cancelled' => 'Zrušeno',
            default => 'Otevřeno',
        };
    }

    private function taskPriorityLabel(string $priority): string
    {
        return match ($priority) {
            'urgent' => 'Urgentní',
            'high' => 'Vysoká',
            'low' => 'Nízká',
            default => 'Normální',
        };
    }

    private function taskTypeLabel(string $type): string
    {
        return match ($type) {
            'call' => 'Telefonát',
            'email' => 'E-mail',
            'checkout' => 'Check-out',
            'vip_service' => 'VIP servis',
            'other' => 'Jiné',
            default => 'Follow-up',
        };
    }

    private function channelLabel(string $channel): string
    {
        return match ($channel) {
            'phone' => 'Telefon',
            'email' => 'E-mail',
            'reception' => 'Recepce',
            'whatsapp' => 'WhatsApp',
            'sms' => 'SMS',
            'in_person' => 'Osobně',
            default => 'Poznámka',
        };
    }

    private function segmentCounts(Collection $guests): array
    {
        return collect(['standard', 'vip', 'corporate', 'returning'])
            ->map(fn (string $seg) => [
                'key' => $seg,
                'label' => $this->segmentLabel($seg),
                'count' => $guests->where('segment', $seg)->count(),
            ])
            ->values()
            ->all();
    }

    private function alertPayload(HotelCrmAlert $a): array
    {
        return [
            'id' => $a->id,
            'guest_key' => $a->guest_key,
            'alert_type' => $a->alert_type,
            'severity' => $a->severity,
            'title' => $a->title,
            'body' => $a->body,
            'status' => $a->status,
            'source_module' => $a->source_module,
            'source_id' => $a->source_id,
            'created_at' => $a->created_at?->toIso8601String(),
        ];
    }

    private function promotionPayload(HotelCrmPromotion $p): array
    {
        return [
            'id' => $p->id,
            'title' => $p->title,
            'subtitle' => $p->subtitle,
            'body' => $p->body,
            'cta_label' => $p->cta_label,
            'cta_url' => $p->cta_url,
            'image_url' => $p->image_url,
            'segment' => $p->segment,
            'segment_label' => $this->promotionSegmentLabel($p->segment),
            'channels' => $p->channels ?? ['mobile_app'],
            'status' => $p->status,
            'starts_at' => $p->starts_at?->toIso8601String(),
            'ends_at' => $p->ends_at?->toIso8601String(),
            'created_at' => $p->created_at?->toIso8601String(),
        ];
    }

    private function promotionFillable(array $data): array
    {
        return [
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'body' => $data['body'] ?? null,
            'cta_label' => $data['cta_label'] ?? null,
            'cta_url' => $data['cta_url'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'segment' => $data['segment'] ?? 'all',
            'channels' => $data['channels'] ?? ['mobile_app'],
            'status' => $data['status'] ?? 'draft',
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ];
    }

    private function guestKey(?string $externalId, ?string $room, ?string $name): string
    {
        if ($externalId) {
            return 'ext:'.$externalId;
        }

        $room = trim((string) $room);
        $name = trim((string) $name);

        if ($room !== '' || $name !== '') {
            return 'local:'.$room.'|'.$name;
        }

        return 'unknown';
    }

    private function normalizeLocale(?string $locale): string
    {
        $locale = strtolower(trim((string) $locale));

        return $locale !== '' ? substr($locale, 0, 2) : 'unknown';
    }

    private function segmentLabel(string $segment): string
    {
        return match ($segment) {
            'vip' => 'VIP',
            'corporate' => 'Corporate',
            'returning' => 'Vracející se',
            default => 'Standard',
        };
    }

    private function promotionSegmentLabel(string $segment): string
    {
        return match ($segment) {
            'all' => 'Všichni hosté',
            'vip' => 'VIP',
            'corporate' => 'Corporate',
            'returning' => 'Vracející se',
            default => 'Standard',
        };
    }
}
