<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Models\HotelServiceRequest;
use App\Models\HotelTicketEvent;
use App\Models\HotelTicketQueue;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class InsightsService
{
    public function __construct(
        private readonly ActivityRevenueService $revenueService,
    ) {}

    /**
     * @return array{from: Carbon, to: Carbon, bucket: string, period: string}
     */
    public function periodBounds(string $period): array
    {
        $tz = config('app.timezone', 'Europe/Prague');
        $now = Carbon::now($tz);

        [$from, $to, $bucket] = match ($period) {
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek(), 'day'],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), 'day'],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'hour'],
        };

        return compact('from', 'to', 'bucket') + ['period' => $period];
    }

    public function overview(Hotel $hotel, string $period = 'week'): array
    {
        $bounds = $this->periodBounds($period);
        $requests = $this->requestsInRange($hotel, $bounds['from'], $bounds['to']);
        $revenue = $this->revenueService->summarize($requests, $period);

        $conversations = $this->conversationsInRange($hotel, $bounds['from'], $bounds['to']);
        $messageCount = $this->messageCountInRange($hotel, $bounds['from'], $bounds['to']);

        $uniqueGuests = $this->uniqueGuestKeys($requests, $conversations)->count();

        $staffTickets = $this->ticketsTouchedInRange($hotel, $bounds['from'], $bounds['to']);

        return [
            'period' => $period,
            'currency' => config('otelapps.currency', 'CZK'),
            'activity_enabled' => ModuleService::isEnabled('activity'),
            'concierge_enabled' => ModuleService::isEnabled('concierge'),
            'kpis' => [
                'unique_guests' => $uniqueGuests,
                'requests' => $requests->count(),
                'open_requests' => $requests->whereIn('status', ['new', 'pending', 'in_progress'])->count(),
                'revenue' => $revenue['period_total'],
                'conversations' => $conversations->count(),
                'messages' => $messageCount,
                'completed_tickets' => $this->completedInPeriod($staffTickets, $bounds['from'], $bounds['to'])->count(),
                'active_staff' => $staffTickets->pluck('assigned_user_id')->filter()->unique()->count(),
            ],
            'requests_timeline' => $this->buildTimeline($requests, $bounds, fn (HotelServiceRequest $_) => 1),
            'revenue_timeline' => $this->buildRevenueTimeline($requests, $bounds),
            'status_breakdown' => $this->statusBreakdown($requests),
            'top_modules' => $this->moduleBreakdown($requests)->take(5)->values()->all(),
        ];
    }

    public function users(Hotel $hotel, string $period = 'week'): array
    {
        $bounds = $this->periodBounds($period);
        $requests = $this->requestsInRange($hotel, $bounds['from'], $bounds['to']);
        $conversations = $this->conversationsInRange($hotel, $bounds['from'], $bounds['to']);

        $guestMap = [];

        foreach ($requests as $request) {
            $key = $this->guestKey(
                $request->guest_external_id,
                $request->room_number,
                $request->guest_display_name,
            );
            if (! isset($guestMap[$key])) {
                $guestMap[$key] = [
                    'key' => $key,
                    'name' => $request->guest_display_name ?: 'Host',
                    'room' => $request->room_number ?: '—',
                    'locale' => $request->guest_locale ?: 'unknown',
                    'requests' => 0,
                    'conversations' => 0,
                    'last_seen' => null,
                ];
            }
            $guestMap[$key]['requests']++;
            $seen = $request->created_at;
            if ($seen && ($guestMap[$key]['last_seen'] === null || $seen->gt($guestMap[$key]['last_seen']))) {
                $guestMap[$key]['last_seen'] = $seen;
            }
            if ($request->guest_locale) {
                $guestMap[$key]['locale'] = $request->guest_locale;
            }
        }

        foreach ($conversations as $conversation) {
            $key = $this->guestKey(
                $conversation->guest_external_id,
                $conversation->room_number,
                $conversation->guest_display_name,
            );
            if (! isset($guestMap[$key])) {
                $guestMap[$key] = [
                    'key' => $key,
                    'name' => $conversation->guest_display_name ?: 'Host',
                    'room' => $conversation->room_number ?: '—',
                    'locale' => $conversation->guest_locale ?: 'unknown',
                    'requests' => 0,
                    'conversations' => 0,
                    'last_seen' => null,
                ];
            }
            $guestMap[$key]['conversations']++;
            $seen = $conversation->last_message_at ?? $conversation->created_at;
            if ($seen && ($guestMap[$key]['last_seen'] === null || $seen->gt($guestMap[$key]['last_seen']))) {
                $guestMap[$key]['last_seen'] = $seen;
            }
            if ($conversation->guest_locale) {
                $guestMap[$key]['locale'] = $conversation->guest_locale;
            }
        }

        $guests = collect($guestMap)->map(function (array $g) {
            $g['activity_score'] = $g['requests'] + $g['conversations'] * 2;
            $g['last_seen'] = $g['last_seen']?->toIso8601String();

            return $g;
        });

        $localeBreakdown = $guests
            ->groupBy(fn ($g) => $this->normalizeLocale($g['locale']))
            ->map(fn (Collection $group, string $locale) => [
                'locale' => $locale,
                'label' => $this->localeLabel($locale),
                'count' => $group->count(),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        $topRooms = $guests
            ->filter(fn ($g) => $g['room'] && $g['room'] !== '—')
            ->groupBy('room')
            ->map(fn (Collection $group, string $room) => [
                'room' => $room,
                'guests' => $group->count(),
                'requests' => $group->sum('requests'),
                'score' => $group->sum('activity_score'),
            ])
            ->sortByDesc('score')
            ->take(10)
            ->values()
            ->all();

        $engagementTimeline = $this->buildTimeline(
            $requests,
            $bounds,
            fn (HotelServiceRequest $_) => 1,
            'unique_guests',
            fn (HotelServiceRequest $r) => $this->guestKey(
                $r->guest_external_id,
                $r->room_number,
                $r->guest_display_name,
            ),
        );

        return [
            'period' => $period,
            'activity_enabled' => ModuleService::isEnabled('activity'),
            'concierge_enabled' => ModuleService::isEnabled('concierge'),
            'kpis' => [
                'unique_guests' => $guests->count(),
                'with_requests' => $guests->where('requests', '>', 0)->count(),
                'with_chat' => $guests->where('conversations', '>', 0)->count(),
                'returning' => $guests->filter(fn ($g) => ($g['requests'] + $g['conversations']) > 1)->count(),
            ],
            'locale_breakdown' => $localeBreakdown,
            'top_rooms' => $topRooms,
            'engagement_timeline' => $engagementTimeline,
            'top_guests' => $guests->sortByDesc('activity_score')->take(10)->values()->all(),
        ];
    }

    public function transactions(Hotel $hotel, string $period = 'week'): array
    {
        $bounds = $this->periodBounds($period);
        $requests = $this->requestsInRange($hotel, $bounds['from'], $bounds['to']);
        $revenue = $this->revenueService->summarize($requests, $period);

        $amounts = $requests
            ->reject(fn (HotelServiceRequest $r) => in_array($r->status, ['rejected', 'archived'], true))
            ->map(fn (HotelServiceRequest $r) => $this->revenueService->amountFromMetadata($r->metadata))
            ->filter(fn (float $a) => $a > 0);

        $avgOrder = $amounts->count() > 0 ? round($amounts->avg(), 2) : 0.0;

        return [
            'period' => $period,
            'currency' => config('otelapps.currency', 'CZK'),
            'activity_enabled' => ModuleService::isEnabled('activity'),
            'kpis' => [
                'total_requests' => $requests->count(),
                'paid_orders' => $amounts->count(),
                'revenue' => $revenue['period_total'],
                'avg_order' => $avgOrder,
                'solved_rate' => $this->solvedRate($requests),
            ],
            'volume_timeline' => $this->buildTimeline($requests, $bounds, fn (HotelServiceRequest $_) => 1),
            'revenue_timeline' => $this->buildRevenueTimeline($requests, $bounds),
            'status_breakdown' => $this->statusBreakdown($requests),
            'categories' => $revenue['categories'],
            'recent_orders' => $revenue['recent_orders'],
        ];
    }

    public function behavior(Hotel $hotel, string $period = 'week'): array
    {
        $bounds = $this->periodBounds($period);
        $requests = $this->requestsInRange($hotel, $bounds['from'], $bounds['to']);

        $hourly = array_fill(0, 24, 0);
        foreach ($requests as $request) {
            if (! $request->created_at) {
                continue;
            }
            $hourly[(int) $request->created_at->format('G')]++;
        }

        $peakHours = collect($hourly)
            ->map(fn (int $count, int $hour) => [
                'hour' => $hour,
                'label' => sprintf('%02d:00', $hour),
                'count' => $count,
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        $bySource = $requests
            ->groupBy(fn (HotelServiceRequest $r) => $r->created_via ?: 'unknown')
            ->map(fn (Collection $group, string $source) => [
                'source' => $source,
                'label' => $this->sourceLabel($source),
                'count' => $group->count(),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        $priorities = $requests
            ->groupBy(fn (HotelServiceRequest $r) => (string) ($r->priority ?? 0))
            ->map(fn (Collection $group, string $priority) => [
                'priority' => (int) $priority,
                'label' => $this->priorityLabel((int) $priority),
                'count' => $group->count(),
            ])
            ->sortBy('priority')
            ->values()
            ->all();

        return [
            'period' => $period,
            'activity_enabled' => ModuleService::isEnabled('activity'),
            'kpis' => [
                'total_requests' => $requests->count(),
                'modules_used' => $this->moduleBreakdown($requests)->count(),
                'peak_hour' => collect($peakHours)->sortByDesc('count')->first()['label'] ?? '—',
                'mobile_share' => $this->percent(
                    $requests->where('created_via', 'mobile_app')->count(),
                    max(1, $requests->count()),
                ),
            ],
            'module_breakdown' => $this->moduleBreakdown($requests)->values()->all(),
            'peak_hours' => $peakHours,
            'status_funnel' => $this->statusFunnel($requests),
            'by_source' => $bySource,
            'priorities' => $priorities,
        ];
    }

    public function staff(Hotel $hotel, string $period = 'week'): array
    {
        $bounds = $this->periodBounds($period);
        $from = $bounds['from'];
        $to = $bounds['to'];
        $ticketsEnabled = ModuleService::isEnabled('ukoly') || ModuleService::isEnabled('activity');

        $tickets = $this->ticketsTouchedInRange($hotel, $from, $to);
        $openNow = $ticketsEnabled
            ? HotelServiceRequest::query()
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', ['new', 'pending', 'in_progress'])
                ->get()
            : collect();
        $events = $this->ticketEventsInRange($hotel, $from, $to);
        $queueLabels = $this->queueLabels($hotel);

        $staff = [];
        $counted = [];

        $ensure = function (mixed $userId, ?string $label) use (&$staff): string {
            $userId = $userId !== null && $userId !== '' ? (int) $userId : null;
            $key = $this->staffKey($userId, $label);
            if (! isset($staff[$key])) {
                $staff[$key] = [
                    'key' => $key,
                    'user_id' => $userId,
                    'name' => $this->staffDisplayName($userId, $label),
                    'created' => 0,
                    'claimed' => 0,
                    'completed' => 0,
                    'rejected' => 0,
                    'reassigned' => 0,
                    'open_assigned' => 0,
                    'claim_minutes' => [],
                    'complete_minutes' => [],
                ];
            } else {
                if ($userId && $staff[$key]['user_id'] === null) {
                    $staff[$key]['user_id'] = $userId;
                }
                $name = $this->staffDisplayName($userId, $label);
                if ($name !== 'Personál' && ($staff[$key]['name'] === 'Personál' || $staff[$key]['name'] === 'Nepřiřazeno')) {
                    $staff[$key]['name'] = $name;
                }
            }

            return $key;
        };

        $bump = function (string $key, string $type, string $requestId) use (&$staff, &$counted): void {
            $id = $key.'|'.$type.'|'.$requestId;
            if (isset($counted[$id])) {
                return;
            }
            $counted[$id] = true;
            $staff[$key][$type]++;
        };

        foreach ($events as $event) {
            $requestId = (string) $event->request_id;
            $key = $ensure($event->actor_user_id, $event->actor_label);

            match ($event->event_type) {
                'created' => $bump($key, 'created', $requestId),
                'claimed' => $bump($key, 'claimed', $requestId),
                'completed' => $bump($key, 'completed', $requestId),
                'reassigned' => $bump($key, 'reassigned', $requestId),
                default => null,
            };

            if ($event->event_type === 'status_changed') {
                $toStatus = $event->metadata['to'] ?? null;
                if ($toStatus === 'rejected') {
                    $bump($key, 'rejected', $requestId);
                }
            }
        }

        foreach ($tickets as $ticket) {
            $requestId = (string) $ticket->id;
            $createdIn = $ticket->created_at && $ticket->created_at->between($from, $to);
            $claimedIn = $ticket->claimed_at && $ticket->claimed_at->between($from, $to);
            $completedAt = $ticket->completed_at ?? $ticket->solved_at;
            $completedIn = $completedAt && $completedAt->between($from, $to);

            if ($createdIn && ($ticket->created_by_user_id || trim((string) $ticket->created_by_label) !== '')) {
                $key = $ensure($ticket->created_by_user_id, $ticket->created_by_label);
                $bump($key, 'created', $requestId);
            }

            $assigneeKey = null;
            if ($ticket->assigned_user_id || trim((string) ($ticket->assigned_user_name ?: $ticket->assigned_staff_name)) !== '') {
                $assigneeKey = $ensure(
                    $ticket->assigned_user_id,
                    $ticket->assigned_user_name ?: $ticket->assigned_staff_name,
                );
            }

            if ($assigneeKey && $claimedIn) {
                $bump($assigneeKey, 'claimed', $requestId);
            }
            if ($assigneeKey && $completedIn) {
                $bump($assigneeKey, 'completed', $requestId);
            }
            if ($assigneeKey && $ticket->status === 'rejected' && $ticket->updated_at?->between($from, $to)) {
                $bump($assigneeKey, 'rejected', $requestId);
            }

            $start = $ticket->created_at;
            if ($assigneeKey && $start && $ticket->claimed_at && $claimedIn) {
                $staff[$assigneeKey]['claim_minutes'][] = max(0, $start->diffInMinutes($ticket->claimed_at));
            }
            if ($assigneeKey && $start && $completedAt && $completedIn) {
                $staff[$assigneeKey]['complete_minutes'][] = max(0, $start->diffInMinutes($completedAt));
            }
        }

        foreach ($openNow as $ticket) {
            if (! $ticket->assigned_user_id && trim((string) ($ticket->assigned_user_name ?: $ticket->assigned_staff_name)) === '') {
                continue;
            }
            $key = $ensure(
                $ticket->assigned_user_id,
                $ticket->assigned_user_name ?: $ticket->assigned_staff_name,
            );
            $staff[$key]['open_assigned']++;
        }

        $people = collect($staff)
            ->reject(fn (array $row) => $row['key'] === 'unassigned')
            ->map(function (array $row) {
                $avgClaim = $this->avgMinutes($row['claim_minutes']);
                $avgComplete = $this->avgMinutes($row['complete_minutes']);
                unset($row['claim_minutes'], $row['complete_minutes']);

                return $row + [
                    'avg_claim_minutes' => $avgClaim,
                    'avg_complete_minutes' => $avgComplete,
                    'avg_claim_label' => $this->formatMinutes($avgClaim),
                    'avg_complete_label' => $this->formatMinutes($avgComplete),
                ];
            })
            ->filter(fn (array $row) => $row['created'] + $row['claimed'] + $row['completed'] + $row['rejected'] + $row['reassigned'] + $row['open_assigned'] > 0)
            ->sortByDesc(fn (array $row) => [$row['completed'], $row['claimed'], $row['created']])
            ->values()
            ->all();

        $completed = $this->completedInPeriod($tickets, $from, $to);
        $createdInPeriod = $tickets->filter(fn (HotelServiceRequest $t) => $t->created_at && $t->created_at->between($from, $to));
        $claimedInPeriod = $tickets->filter(fn (HotelServiceRequest $t) => $t->claimed_at && $t->claimed_at->between($from, $to));

        $allClaimMinutes = $claimedInPeriod
            ->map(function (HotelServiceRequest $t) {
                if (! $t->created_at || ! $t->claimed_at) {
                    return null;
                }

                return max(0, $t->created_at->diffInMinutes($t->claimed_at));
            })
            ->filter(fn ($v) => $v !== null);
        $allCompleteMinutes = $completed
            ->map(function (HotelServiceRequest $t) {
                $start = $t->created_at;
                $end = $t->completed_at ?? $t->solved_at;
                if (! $start || ! $end) {
                    return null;
                }

                return max(0, $start->diffInMinutes($end));
            })
            ->filter(fn ($v) => $v !== null);

        $unassignedOpen = $openNow->filter(
            fn (HotelServiceRequest $t) => ! $t->assigned_user_id && trim((string) ($t->assigned_user_name ?: $t->assigned_staff_name)) === '',
        )->count();

        $byQueue = $completed
            ->groupBy(fn (HotelServiceRequest $t) => $t->queue_key ?: 'other')
            ->map(fn (Collection $group, string $key) => [
                'key' => $key,
                'label' => $queueLabels[$key] ?? $this->queueFallbackLabel($key),
                'count' => $group->count(),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        $hourly = array_fill(0, 24, 0);
        foreach ($tickets as $ticket) {
            foreach ([$ticket->claimed_at, $ticket->completed_at ?? $ticket->solved_at] as $stamp) {
                if (! $stamp || ! $stamp->between($from, $to)) {
                    continue;
                }
                $hourly[(int) $stamp->format('G')]++;
            }
        }
        $peakHours = collect($hourly)
            ->map(fn (int $count, int $hour) => [
                'hour' => $hour,
                'label' => sprintf('%02d:00', $hour),
                'count' => $count,
            ])
            ->values()
            ->all();

        $completionStamps = $completed
            ->map(fn (HotelServiceRequest $t) => $t->completed_at ?? $t->solved_at)
            ->filter();

        return [
            'period' => $period,
            'ukoly_enabled' => $ticketsEnabled,
            'kpis' => [
                'active_staff' => collect($people)->filter(fn (array $p) => $p['claimed'] + $p['completed'] + $p['open_assigned'] > 0)->count(),
                'created' => $createdInPeriod->count(),
                'claimed' => $claimedInPeriod->count(),
                'completed' => $completed->count(),
                'open_now' => $openNow->count(),
                'unassigned' => $unassignedOpen,
                'avg_complete_minutes' => $this->avgMinutes($allCompleteMinutes->all()),
                'avg_complete_label' => $this->formatMinutes($this->avgMinutes($allCompleteMinutes->all())),
                'avg_claim_minutes' => $this->avgMinutes($allClaimMinutes->all()),
                'avg_claim_label' => $this->formatMinutes($this->avgMinutes($allClaimMinutes->all())),
            ],
            'staff' => $people,
            'by_queue' => $byQueue,
            'workload' => collect($people)
                ->filter(fn (array $p) => $p['open_assigned'] > 0)
                ->map(fn (array $p) => [
                    'label' => $p['name'],
                    'count' => $p['open_assigned'],
                ])
                ->sortByDesc('count')
                ->values()
                ->all(),
            'completed_by_staff' => collect($people)
                ->filter(fn (array $p) => $p['completed'] > 0 || $p['claimed'] > 0)
                ->map(fn (array $p) => [
                    'label' => $p['name'],
                    'count' => $p['completed'],
                    'claimed' => $p['claimed'],
                    'completed' => $p['completed'],
                ])
                ->values()
                ->all(),
            'completions_timeline' => $this->buildTimestampTimeline($completionStamps, $bounds),
            'peak_hours' => $peakHours,
        ];
    }

    private function requestsInRange(Hotel $hotel, Carbon $from, Carbon $to): Collection
    {
        if (! ModuleService::isEnabled('activity')) {
            return collect();
        }

        return HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at')
            ->get();
    }

    private function ticketsTouchedInRange(Hotel $hotel, Carbon $from, Carbon $to): Collection
    {
        if (! ModuleService::isEnabled('ukoly') && ! ModuleService::isEnabled('activity')) {
            return collect();
        }

        return HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('created_at', [$from, $to])
                    ->orWhereBetween('claimed_at', [$from, $to])
                    ->orWhereBetween('completed_at', [$from, $to])
                    ->orWhereBetween('solved_at', [$from, $to]);
            })
            ->get();
    }

    private function ticketEventsInRange(Hotel $hotel, Carbon $from, Carbon $to): Collection
    {
        if (! ModuleService::isEnabled('ukoly') && ! ModuleService::isEnabled('activity')) {
            return collect();
        }

        return HotelTicketEvent::query()
            ->whereHas('request', fn ($q) => $q->where('hotel_id', $hotel->id))
            ->whereBetween('created_at', [$from, $to])
            ->get();
    }

    private function completedInPeriod(Collection $tickets, Carbon $from, Carbon $to): Collection
    {
        return $tickets->filter(function (HotelServiceRequest $ticket) use ($from, $to) {
            $done = $ticket->completed_at ?? $ticket->solved_at;

            return $done && $done->between($from, $to);
        });
    }

    private function staffKey(?int $userId, ?string $label): string
    {
        if ($userId) {
            return 'user:'.$userId;
        }

        $name = trim((string) $label);

        return $name !== '' ? 'name:'.mb_strtolower($name) : 'unassigned';
    }

    private function staffDisplayName(?int $userId, ?string $label): string
    {
        $name = trim((string) $label);
        if ($name !== '') {
            return $name;
        }

        return $userId ? 'Uživatel #'.$userId : 'Nepřiřazeno';
    }

    /**
     * @param  list<float|int>  $values
     */
    private function avgMinutes(array $values): ?float
    {
        if ($values === []) {
            return null;
        }

        return round(array_sum($values) / count($values), 1);
    }

    private function formatMinutes(?float $minutes): string
    {
        if ($minutes === null) {
            return '—';
        }

        $m = (int) round($minutes);
        if ($m < 60) {
            return $m.' min';
        }

        $h = intdiv($m, 60);
        $rest = $m % 60;

        return $rest === 0 ? $h.' h' : $h.' h '.$rest.' min';
    }

    /**
     * @return array<string, string>
     */
    private function queueLabels(Hotel $hotel): array
    {
        $fromDb = HotelTicketQueue::query()
            ->where('hotel_id', $hotel->id)
            ->get()
            ->mapWithKeys(fn (HotelTicketQueue $q) => [(string) $q->key => (string) $q->label])
            ->all();

        $fromCatalog = [];
        foreach (PermissionCatalog::all() as $perm) {
            $key = $perm['key'] ?? '';
            if (! str_starts_with($key, 'tickets.queue.')) {
                continue;
            }
            $queueKey = substr($key, strlen('tickets.queue.'));
            $fromCatalog[$queueKey] = $perm['label'] ?? $queueKey;
        }

        return $fromDb + $fromCatalog;
    }

    private function queueFallbackLabel(string $key): string
    {
        return match ($key) {
            'housekeeping' => 'Úklid',
            'room_delivery' => 'Donáška do pokoje',
            'maintenance' => 'Údržba',
            'reception' => 'Recepce',
            'other' => 'Ostatní',
            default => $key,
        };
    }

    private function buildTimestampTimeline(Collection $timestamps, array $bounds): array
    {
        $labels = $this->timelineLabels($bounds['from'], $bounds['to'], $bounds['bucket']);
        $buckets = [];
        foreach ($labels as $row) {
            $buckets[$row['key']] = [
                'key' => $row['key'],
                'label' => $row['label'],
                'value' => 0,
            ];
        }

        foreach ($timestamps as $time) {
            if (! $time instanceof Carbon) {
                continue;
            }
            $key = $this->bucketKey($time, $bounds['bucket']);
            if (isset($buckets[$key])) {
                $buckets[$key]['value']++;
            }
        }

        return array_values($buckets);
    }

    private function conversationsInRange(Hotel $hotel, Carbon $from, Carbon $to): Collection
    {
        if (! ModuleService::isEnabled('concierge')) {
            return collect();
        }

        return HotelConciergeConversation::query()
            ->where('hotel_id', $hotel->id)
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('created_at', [$from, $to])
                    ->orWhereBetween('last_message_at', [$from, $to]);
            })
            ->get();
    }

    private function messageCountInRange(Hotel $hotel, Carbon $from, Carbon $to): int
    {
        if (! ModuleService::isEnabled('concierge')) {
            return 0;
        }

        return HotelConciergeMessage::query()
            ->whereHas('conversation', fn ($q) => $q->where('hotel_id', $hotel->id))
            ->whereBetween('created_at', [$from, $to])
            ->count();
    }

    /**
     * @param  callable(HotelServiceRequest): int|float  $valueFn
     * @param  callable(HotelServiceRequest): string|null |null  $uniqueFn
     */
    private function buildTimeline(
        Collection $requests,
        array $bounds,
        callable $valueFn,
        string $mode = 'sum',
        ?callable $uniqueFn = null,
    ): array {
        $labels = $this->timelineLabels($bounds['from'], $bounds['to'], $bounds['bucket']);
        $buckets = [];

        foreach ($labels as $label) {
            $buckets[$label['key']] = [
                'key' => $label['key'],
                'label' => $label['label'],
                'value' => 0,
                'unique' => [],
            ];
        }

        foreach ($requests as $request) {
            if (! $request->created_at) {
                continue;
            }
            $key = $this->bucketKey($request->created_at, $bounds['bucket']);
            if (! isset($buckets[$key])) {
                continue;
            }
            if ($mode === 'unique_guests' && $uniqueFn) {
                $guestKey = $uniqueFn($request);
                $buckets[$key]['unique'][$guestKey] = true;
                $buckets[$key]['value'] = count($buckets[$key]['unique']);
            } else {
                $buckets[$key]['value'] += $valueFn($request);
            }
        }

        return collect($buckets)->map(function (array $row) {
            unset($row['unique']);

            return $row;
        })->values()->all();
    }

    private function buildRevenueTimeline(Collection $requests, array $bounds): array
    {
        return $this->buildTimeline(
            $requests->reject(fn (HotelServiceRequest $r) => in_array($r->status, ['rejected', 'archived'], true)),
            $bounds,
            fn (HotelServiceRequest $r) => round($this->revenueService->amountFromMetadata($r->metadata), 2),
        );
    }

    /**
     * @return list<array{key: string, label: string}>
     */
    private function timelineLabels(Carbon $from, Carbon $to, string $bucket): array
    {
        $step = $bucket === 'hour' ? '1 hour' : '1 day';
        $period = CarbonPeriod::create($from->copy(), $step, $to->copy());
        $labels = [];

        foreach ($period as $point) {
            $key = $this->bucketKey($point, $bucket);
            $labels[] = [
                'key' => $key,
                'label' => $bucket === 'hour'
                    ? $point->format('H:i')
                    : $point->format('d.m.'),
            ];
        }

        return $labels;
    }

    private function bucketKey(Carbon $time, string $bucket): string
    {
        return $bucket === 'hour'
            ? $time->format('Y-m-d H:00')
            : $time->format('Y-m-d');
    }

    private function statusBreakdown(Collection $requests): array
    {
        return $requests
            ->groupBy('status')
            ->map(fn (Collection $group, string $status) => [
                'status' => $status,
                'label' => $this->statusLabel($status),
                'count' => $group->count(),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    private function statusFunnel(Collection $requests): array
    {
        $order = ['new', 'pending', 'in_progress', 'solved', 'rejected', 'archived'];

        return collect($order)
            ->map(function (string $status) use ($requests) {
                $count = $requests->where('status', $status)->count();
                if ($count === 0) {
                    return null;
                }

                return [
                    'status' => $status,
                    'label' => $this->statusLabel($status),
                    'count' => $count,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function moduleBreakdown(Collection $requests): Collection
    {
        return $requests
            ->groupBy(fn (HotelServiceRequest $r) => $r->service_module ?: 'other')
            ->map(function (Collection $group, string $key) {
                $first = $group->first();

                return [
                    'key' => $key,
                    'label' => $first?->service_label ?: $key,
                    'count' => $group->count(),
                ];
            })
            ->sortByDesc('count');
    }

    private function uniqueGuestKeys(Collection $requests, Collection $conversations): Collection
    {
        $keys = collect();

        foreach ($requests as $request) {
            $keys->push($this->guestKey(
                $request->guest_external_id,
                $request->room_number,
                $request->guest_display_name,
            ));
        }

        foreach ($conversations as $conversation) {
            $keys->push($this->guestKey(
                $conversation->guest_external_id,
                $conversation->room_number,
                $conversation->guest_display_name,
            ));
        }

        return $keys->unique()->filter(fn ($k) => $k !== 'unknown');
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

    private function solvedRate(Collection $requests): float
    {
        $total = $requests->count();
        if ($total === 0) {
            return 0.0;
        }

        $solved = $requests->where('status', 'solved')->count();

        return round($solved / $total * 100, 1);
    }

    private function percent(int $part, int $whole): float
    {
        return round($part / $whole * 100, 1);
    }

    private function normalizeLocale(?string $locale): string
    {
        $locale = strtolower(trim((string) $locale));

        return $locale !== '' ? substr($locale, 0, 2) : 'unknown';
    }

    private function localeLabel(string $locale): string
    {
        return match ($locale) {
            'cs' => 'Čeština',
            'en' => 'English',
            'de' => 'Deutsch',
            'fr' => 'Français',
            'pl' => 'Polski',
            'unknown' => 'Neuvedeno',
            default => strtoupper($locale),
        };
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'new' => 'Nový',
            'pending' => 'Čeká',
            'in_progress' => 'Probíhá',
            'solved' => 'Vyřešeno',
            'rejected' => 'Zamítnuto',
            'archived' => 'Archiv',
            default => $status,
        };
    }

    private function sourceLabel(string $source): string
    {
        return match ($source) {
            'mobile_app' => 'Mobilní app',
            'web_app' => 'Web app',
            'staff' => 'Recepce',
            'unknown' => 'Neuvedeno',
            default => $source,
        };
    }

    private function priorityLabel(int $priority): string
    {
        return match ($priority) {
            0, 1 => 'Normální',
            2 => 'Vysoká',
            3 => 'Urgentní',
            default => 'Priorita '.$priority,
        };
    }
}
