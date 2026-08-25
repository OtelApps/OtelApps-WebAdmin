<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelRoom;
use App\Models\HotelServiceRequest;
use App\Models\HotelServiceRequestType;
use App\Models\HotelStay;
use App\Models\HotelTicketEvent;
use App\Models\HotelTicketQueue;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TicketService
{
    public function __construct(
        private readonly GuestPushService $guestPushService,
    ) {}

    public const PRIORITY_LABELS = [
        0 => 'Nízká',
        1 => 'Střední',
        2 => 'Vysoká',
        3 => 'Kritická',
    ];

    public const STATUS_LABELS = [
        'new' => 'Nový',
        'pending' => 'Čeká',
        'in_progress' => 'Probíhá',
        'solved' => 'Hotovo',
        'rejected' => 'Zamítnuto',
        'archived' => 'Archivováno',
    ];

    public function list(Hotel $hotel, User $user, array $filters = []): array
    {
        $query = $this->visibleQuery($hotel, $user);

        if (! empty($filters['queue_key'])) {
            $query->where('queue_key', $filters['queue_key']);
        }

        if (! empty($filters['status'])) {
            $statuses = is_array($filters['status'])
                ? $filters['status']
                : array_filter(explode(',', (string) $filters['status']));
            if ($statuses !== []) {
                $query->whereIn('status', $statuses);
            }
        }

        $tickets = $query->orderByDesc('priority')->orderBy('due_at')->orderByDesc('created_at')->get();
        $queues = $this->queuesForHotel($hotel);
        $queueLabels = collect($queues)->mapWithKeys(fn ($q) => [$q['key'] => $q['label']]);

        return [
            'tickets' => $tickets
                ->map(fn (HotelServiceRequest $t) => $this->listItem($t, $queueLabels->all()))
                ->values()
                ->all(),
            'queues' => $queues,
            'service_types' => $this->serviceTypesForHotel($hotel, $queueLabels->all()),
        ];
    }

    public function stats(Hotel $hotel, User $user): array
    {
        $base = $this->visibleQuery($hotel, $user);

        $new = (clone $base)->whereIn('status', ['new', 'pending'])->count();
        $inProgress = (clone $base)->where('status', 'in_progress')->count();
        $doneToday = (clone $base)
            ->where('status', 'solved')
            ->where(function ($q) {
                $q->whereDate('completed_at', today())
                    ->orWhere(function ($q2) {
                        $q2->whereNull('completed_at')->whereDate('solved_at', today());
                    })
                    ->orWhere(function ($q3) {
                        $q3->whereNull('completed_at')->whereNull('solved_at')->whereDate('updated_at', today());
                    });
            })
            ->count();

        return [
            'new' => $new,
            'in_progress' => $inProgress,
            'done_today' => $doneToday,
        ];
    }

    public function show(Hotel $hotel, User $user, string $id): array
    {
        $ticket = $this->findVisibleOrFail($hotel, $user, $id);
        $ticket->load(['ticketEvents' => fn ($q) => $q->orderBy('created_at')]);

        $assignee = null;
        if ($ticket->assigned_user_id) {
            $assignee = User::query()->with('userType')->find($ticket->assigned_user_id);
        }

        $queueLabels = collect($this->queuesForHotel($hotel))->mapWithKeys(fn ($q) => [$q['key'] => $q['label']])->all();

        return [
            'ticket' => $this->detailItem($ticket, $assignee, $queueLabels),
            'events' => $ticket->ticketEvents->map(fn (HotelTicketEvent $e) => [
                'id' => $e->id,
                'event_type' => $e->event_type,
                'body' => $e->body,
                'actor_label' => $e->actor_label,
                'created_at' => optional($e->created_at)?->toIso8601String(),
                'metadata' => $e->metadata ?? [],
            ])->values()->all(),
            'room' => $this->roomContext($hotel, $ticket->room_number),
            'permissions' => [
                'claim' => $user->hasPermission('tickets.claim'),
                'complete' => $user->hasPermission('tickets.close'),
                'reassign' => $user->hasPermission('tickets.reassign'),
                'edit' => $user->hasPermission('tickets.edit'),
                'create' => $user->hasPermission('tickets.create'),
                'delete' => $user->hasPermission('tickets.edit'),
            ],
        ];
    }

    public function create(Hotel $hotel, User $user, array $data): HotelServiceRequest
    {
        if (! $user->hasPermission('tickets.create')) {
            throw ValidationException::withMessages(['ticket' => 'Nemáte oprávnění vytvořit tiket.']);
        }

        $serviceModule = $data['service_module'] ?? null;
        if (! $serviceModule) {
            $serviceModule = match ($data['queue_key'] ?? '') {
                'housekeeping' => 'laundry',
                'room_delivery' => 'room_service',
                'maintenance' => 'issues_repairs',
                'reception' => 'check_in_out',
                default => 'other',
            };
        }
        $queueKey = PermissionCatalog::queueForServiceModule($serviceModule, $hotel->id);
        if (! empty($data['queue_key']) && empty($data['service_module'])) {
            $queueKey = $data['queue_key'];
        }

        $type = HotelServiceRequestType::query()
            ->where('hotel_id', $hotel->id)
            ->where('module_key', $serviceModule)
            ->first();

        if (! $this->canSeeQueue($user, $queueKey) && ! $user->hasPermission('tickets.view_all')) {
            throw ValidationException::withMessages(['queue_key' => 'Nemáte přístup k této frontě.']);
        }

        return DB::connection(config('otelapps.db_connection'))->transaction(function () use ($hotel, $user, $data, $serviceModule, $queueKey, $type) {
            $ticket = HotelServiceRequest::query()->create([
                'hotel_id' => $hotel->id,
                'service_module' => $serviceModule,
                'service_label' => $data['service_label'] ?? $this->labelForModule($serviceModule, $type?->label),
                'service_icon' => $data['service_icon'] ?? $type?->icon_name ?? 'task_alt',
                'request_text' => $data['request_text'],
                'guest_display_name' => $data['guest_display_name'] ?? '—',
                'room_number' => $data['room_number'],
                'status' => 'new',
                'priority' => (int) ($data['priority'] ?? 1),
                'queue_key' => $queueKey,
                'due_at' => $data['due_at'] ?? null,
                'created_via' => 'web_admin',
                'created_by_user_id' => $user->id,
                'created_by_label' => $user->userType?->name ?: $user->name,
                'metadata' => $data['metadata'] ?? [],
            ]);

            $this->addEvent($ticket, 'created', 'Úkol vytvořen', $user);
            $this->addEvent($ticket, 'queued', 'Čeká na převzetí', $user, ['queue_key' => $queueKey]);

            return $ticket->fresh();
        });
    }

    public function claim(Hotel $hotel, User $user, string $id): HotelServiceRequest
    {
        if (! $user->hasPermission('tickets.claim')) {
            throw ValidationException::withMessages(['ticket' => 'Nemáte oprávnění převzít tiket.']);
        }

        $ticket = $this->findVisibleOrFail($hotel, $user, $id);

        if (in_array($ticket->status, ['solved', 'rejected', 'archived'], true)) {
            throw ValidationException::withMessages(['ticket' => 'Uzavřený tiket nelze převzít.']);
        }

        $from = $ticket->status;
        $ticket->assigned_user_id = $user->id;
        $ticket->assigned_user_name = $user->name;
        $ticket->assigned_staff_name = $user->name;
        $ticket->claimed_at = now();
        $ticket->status = 'in_progress';
        $ticket->save();

        $this->addEvent($ticket, 'claimed', 'Úkol převzat', $user);
        $this->addEvent($ticket, 'status_changed', 'Status → Probíhá', $user, [
            'from' => $from,
            'to' => 'in_progress',
        ]);

        return $ticket->fresh();
    }

    public function complete(Hotel $hotel, User $user, string $id, ?string $note = null): HotelServiceRequest
    {
        if (! $user->hasPermission('tickets.close')) {
            throw ValidationException::withMessages(['ticket' => 'Nemáte oprávnění dokončit tiket.']);
        }

        $ticket = $this->findVisibleOrFail($hotel, $user, $id);
        $from = $ticket->status;
        $ticket->status = 'solved';
        $ticket->solved_at = now();
        $ticket->completed_at = now();
        if ($note) {
            $ticket->staff_note = $note;
        }
        $ticket->save();

        $this->addEvent($ticket, 'completed', $note ?: 'Úkol dokončen', $user);
        $this->addEvent($ticket, 'status_changed', 'Status → Hotovo', $user, ['from' => $from, 'to' => 'solved']);

        return $ticket->fresh();
    }

    public function reassign(Hotel $hotel, User $actor, string $id, int $assigneeId): HotelServiceRequest
    {
        if (! $actor->hasPermission('tickets.reassign')) {
            throw ValidationException::withMessages(['ticket' => 'Nemáte oprávnění přeřadit tiket.']);
        }

        $ticket = $this->findVisibleOrFail($hotel, $actor, $id);
        $assignee = User::query()->where('is_active', true)->findOrFail($assigneeId);

        $ticket->assigned_user_id = $assignee->id;
        $ticket->assigned_user_name = $assignee->name;
        $ticket->assigned_staff_name = $assignee->name;
        if ($ticket->status === 'new' || $ticket->status === 'pending') {
            $ticket->status = 'in_progress';
            $ticket->claimed_at = $ticket->claimed_at ?: now();
        }
        $ticket->save();

        $this->addEvent($ticket, 'reassigned', 'Přeřazeno na '.$assignee->name, $actor, [
            'assignee_id' => $assignee->id,
        ]);

        return $ticket->fresh();
    }

    public function update(Hotel $hotel, User $user, string $id, array $data): HotelServiceRequest
    {
        if (! $user->hasPermission('tickets.edit')) {
            throw ValidationException::withMessages(['ticket' => 'Nemáte oprávnění upravit tiket.']);
        }

        $ticket = $this->findVisibleOrFail($hotel, $user, $id);

        if (array_key_exists('priority', $data) && (int) $data['priority'] !== (int) $ticket->priority) {
            $from = $ticket->priority;
            $ticket->priority = (int) $data['priority'];
            $this->addEvent($ticket, 'priority_changed', 'Priorita změněna', $user, [
                'from' => $from,
                'to' => $ticket->priority,
            ]);
        }

        if (array_key_exists('due_at', $data)) {
            $ticket->due_at = $data['due_at'];
            $this->addEvent($ticket, 'due_changed', 'Termín změněn', $user);
        }

        if (array_key_exists('request_text', $data) && $data['request_text']) {
            $ticket->request_text = $data['request_text'];
        }

        if (array_key_exists('staff_note', $data)) {
            $ticket->staff_note = $data['staff_note'];
            if ($data['staff_note']) {
                $this->addEvent($ticket, 'note', $data['staff_note'], $user);
            }
        }

        if (array_key_exists('guest_display_name', $data) && $data['guest_display_name']) {
            $ticket->guest_display_name = $data['guest_display_name'];
        }

        if (array_key_exists('room_number', $data) && $data['room_number']) {
            $ticket->room_number = $data['room_number'];
        }

        if (array_key_exists('guest_phone', $data)) {
            $ticket->guest_phone = $data['guest_phone'];
        }

        if (array_key_exists('status_guest_note', $data)) {
            $ticket->status_guest_note = $data['status_guest_note'];
        }

        if (array_key_exists('assigned_staff_name', $data)) {
            $ticket->assigned_staff_name = $data['assigned_staff_name'];
            if (! $ticket->assigned_user_id) {
                $ticket->assigned_user_name = $data['assigned_staff_name'];
            }
        }

        if (array_key_exists('service_module', $data) && $data['service_module']) {
            $ticket->service_module = $data['service_module'];
            $type = HotelServiceRequestType::query()
                ->where('hotel_id', $hotel->id)
                ->where('module_key', $data['service_module'])
                ->first();
            $ticket->service_label = $data['service_label']
                ?? $this->labelForModule($data['service_module'], $type?->label);
            $ticket->service_icon = $type?->icon_name ?? $ticket->service_icon;
            $ticket->queue_key = PermissionCatalog::queueForServiceModule($data['service_module'], $hotel->id);
        }

        if (array_key_exists('status', $data) && $data['status'] !== $ticket->status) {
            $this->applyStatus($hotel, $ticket, $user, (string) $data['status'], $data['staff_note'] ?? null);
        }

        $ticket->save();

        return $ticket->fresh();
    }

    public function destroy(Hotel $hotel, User $user, string $id): void
    {
        if (! $user->hasPermission('tickets.edit')) {
            throw ValidationException::withMessages(['ticket' => 'Nemáte oprávnění smazat tiket.']);
        }

        $ticket = $this->findVisibleOrFail($hotel, $user, $id);
        $ticket->delete();
    }

    private function applyStatus(
        Hotel $hotel,
        HotelServiceRequest $ticket,
        User $user,
        string $newStatus,
        ?string $staffNote = null,
    ): void {
        $from = $ticket->status;
        $ticket->status = $newStatus;

        if ($newStatus === 'solved') {
            $ticket->solved_at = $ticket->solved_at ?: now();
            $ticket->completed_at = $ticket->completed_at ?: now();
        }
        if ($newStatus === 'archived') {
            $ticket->archived_at = now();
        }
        if ($newStatus === 'in_progress' && ! $ticket->claimed_at) {
            $ticket->claimed_at = now();
        }

        $label = self::STATUS_LABELS[$newStatus] ?? $newStatus;
        $this->addEvent($ticket, 'status_changed', 'Status → '.$label, $user, [
            'from' => $from,
            'to' => $newStatus,
        ]);

        if (is_string($staffNote) && trim($staffNote) !== '') {
            $ticket->staff_note = trim($staffNote);
        }

        if ($ticket->guest_external_id) {
            $this->guestPushService->sendStatusChange(
                $hotel,
                (string) $ticket->guest_external_id,
                (string) $ticket->service_label,
                $ticket->request_number,
                (string) $ticket->id,
                $newStatus,
            );
        }
    }

    private function visibleQuery(Hotel $hotel, User $user)
    {
        $query = HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotIn('status', ['archived']);

        if ($user->hasPermission('tickets.view_all') || $user->isSuperAdmin()) {
            return $query;
        }

        $queues = $user->allowedQueueKeys();
        $query->where(function ($q) use ($queues, $user) {
            if ($queues !== []) {
                $q->whereIn('queue_key', $queues);
            } else {
                $q->whereRaw('1 = 0');
            }
            $q->orWhere('assigned_user_id', $user->id);
        });

        return $query;
    }

    private function findVisibleOrFail(Hotel $hotel, User $user, string $id): HotelServiceRequest
    {
        $ticket = $this->visibleQuery($hotel, $user)->where('id', $id)->first();
        if (! $ticket) {
            abort(404, 'Tiket nenalezen nebo nemáte oprávnění.');
        }

        return $ticket;
    }

    private function canSeeQueue(User $user, string $queueKey): bool
    {
        $queues = $user->allowedQueueKeys();

        return in_array('*', $queues, true) || in_array($queueKey, $queues, true);
    }

    private function addEvent(
        HotelServiceRequest $ticket,
        string $type,
        string $body,
        ?User $actor = null,
        array $metadata = [],
    ): void {
        HotelTicketEvent::query()->create([
            'request_id' => $ticket->id,
            'event_type' => $type,
            'body' => $body,
            'actor_user_id' => $actor?->id,
            'actor_label' => $actor?->name ?? 'system',
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    private function queuesForHotel(Hotel $hotel): array
    {
        return HotelTicketQueue::query()
            ->where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (HotelTicketQueue $q) => [
                'key' => $q->key,
                'label' => $q->label,
                'color' => $q->color,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, string>  $queueLabels
     * @return list<array<string, mixed>>
     */
    private function serviceTypesForHotel(Hotel $hotel, array $queueLabels): array
    {
        return HotelServiceRequestType::query()
            ->where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get()
            ->map(function (HotelServiceRequestType $type) use ($hotel, $queueLabels) {
                $queueKey = is_string($type->queue_key) && trim($type->queue_key) !== ''
                    ? trim($type->queue_key)
                    : PermissionCatalog::queueForServiceModule($type->module_key, $hotel->id);

                return [
                    'module_key' => $type->module_key,
                    'label' => $this->labelForModule($type->module_key, $type->label),
                    'icon_name' => $type->icon_name,
                    'queue_key' => $queueKey,
                    'queue_label' => $queueLabels[$queueKey] ?? $queueKey,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, string>  $queueLabels
     * @return array<string, mixed>
     */
    private function listItem(HotelServiceRequest $t, array $queueLabels = []): array
    {
        $queueKey = $t->queue_key;

        return [
            'id' => $t->id,
            'request_number' => $t->request_number,
            'title' => $this->title($t),
            'request_text' => $t->request_text,
            'room_number' => $t->room_number,
            'guest_display_name' => $t->guest_display_name,
            'status' => $t->status,
            'section' => $this->sectionForStatus($t),
            'priority' => (int) $t->priority,
            'priority_label' => self::PRIORITY_LABELS[(int) $t->priority] ?? 'Střední',
            'queue_key' => $queueKey,
            'queue_label' => $queueKey ? ($queueLabels[$queueKey] ?? $queueKey) : null,
            'service_module' => $t->service_module,
            'service_label' => $t->service_label,
            'assigned_user_id' => $t->assigned_user_id,
            'assigned_user_name' => $t->assigned_user_name ?: $t->assigned_staff_name,
            'staff_note' => $t->staff_note,
            'status_guest_note' => $t->status_guest_note,
            'guest_phone' => $t->guest_phone,
            'service_icon' => $t->service_icon,
            'due_at' => optional($t->due_at)?->toIso8601String(),
            'created_at' => optional($t->created_at)?->toIso8601String(),
            'created_by_label' => $t->created_by_label,
            'completed_at' => optional($t->completed_at ?? $t->solved_at)?->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, string>  $queueLabels
     * @return array<string, mixed>
     */
    private function detailItem(HotelServiceRequest $t, ?User $assignee, array $queueLabels = []): array
    {
        $base = $this->listItem($t, $queueLabels);
        $base['staff_note'] = $t->staff_note;
        $base['status_guest_note'] = $t->status_guest_note;
        $base['created_by_user_id'] = $t->created_by_user_id;
        $base['assignee'] = $assignee ? [
            'id' => $assignee->id,
            'name' => $assignee->name,
            'initials' => $assignee->initials ?: $assignee->makeInitials(),
            'job_title' => $assignee->job_title,
            'availability_status' => $assignee->availability_status,
            'user_type' => $assignee->userType?->name,
        ] : ($t->assigned_user_name ? [
            'id' => $t->assigned_user_id,
            'name' => $t->assigned_user_name,
            'initials' => null,
            'job_title' => null,
            'availability_status' => null,
            'user_type' => null,
        ] : null);

        return $base;
    }

    private function title(HotelServiceRequest $t): string
    {
        $short = mb_strimwidth(trim($t->request_text), 0, 48, '…');

        return 'Pokoj '.$t->room_number.' — '.$short;
    }

    private function sectionForStatus(HotelServiceRequest $t): string
    {
        if (in_array($t->status, ['new', 'pending'], true)) {
            return 'new';
        }
        if ($t->status === 'in_progress') {
            return 'in_progress';
        }
        if ($t->status === 'solved') {
            return 'done';
        }
        if (in_array($t->status, ['rejected', 'archived'], true)) {
            return 'other';
        }

        return 'other';
    }

    private function roomContext(Hotel $hotel, string $roomNumber): ?array
    {
        try {
            $room = HotelRoom::query()
                ->where('hotel_id', $hotel->id)
                ->where('room_number', $roomNumber)
                ->with('roomType')
                ->first();
        } catch (\Throwable) {
            return [
                'room_number' => $roomNumber,
                'floor' => null,
                'room_type' => null,
                'guest_name' => null,
                'stay_range' => null,
            ];
        }

        if (! $room) {
            return [
                'room_number' => $roomNumber,
                'floor' => null,
                'room_type' => null,
                'guest_name' => null,
                'stay_range' => null,
            ];
        }

        $stay = HotelStay::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_id', $room->id)
            ->where('status', 'active')
            ->with(['guests' => fn ($q) => $q->orderBy('sort_order')])
            ->first();

        $primaryGuest = $stay
            ? ($stay->guests->firstWhere('is_primary', true) ?? $stay->guests->first())
            : null;

        $guestName = $primaryGuest?->display_name
            ?? $primaryGuest?->full_name
            ?? null;

        $stayRange = null;
        if ($stay?->check_in_at && $stay?->check_out_at) {
            $stayRange = $stay->check_in_at->format('j. n. Y').' – '.$stay->check_out_at->format('j. n. Y');
        }

        return [
            'room_number' => $room->room_number,
            'floor' => $room->floor,
            'room_type' => $room->roomType?->title ?? null,
            'guest_name' => $guestName,
            'stay_range' => $stayRange,
        ];
    }

    private function labelForModule(string $module, ?string $fallback = null): string
    {
        return match ($module) {
            'laundry', 'housekeeping' => 'Úklid',
            'amenities', 'supplies' => 'Doplňky',
            'room_service' => 'Pokojová služba',
            'issues_repairs', 'maintenance' => 'Údržba',
            'check_in_out', 'reception' => 'Recepce',
            default => $fallback ?: 'Úkol',
        };
    }
}
