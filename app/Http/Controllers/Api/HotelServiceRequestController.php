<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelServiceRequest;
use App\Models\HotelServiceRequestType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HotelServiceRequestController extends Controller
{
    private const STATUSES = ['new', 'pending', 'in_progress', 'solved', 'rejected', 'archived'];

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $query = HotelServiceRequest::query()->where('hotel_id', $hotel->id);

        if ($request->filled('status')) {
            $statuses = array_filter(explode(',', (string) $request->query('status')));
            $statuses = array_values(array_intersect($statuses, self::STATUSES));
            if ($statuses !== []) {
                $query->whereIn('status', $statuses);
            }
        }

        if ($request->filled('service_module')) {
            $query->where('service_module', $request->query('service_module'));
        }

        if ($request->filled('q')) {
            $term = '%'.addcslashes($request->query('q'), '%_\\').'%';
            $query->where(function ($q) use ($term) {
                $q->where('guest_display_name', 'ilike', $term)
                    ->orWhere('room_number', 'ilike', $term)
                    ->orWhere('request_text', 'ilike', $term)
                    ->orWhere('request_number', 'ilike', $term);
            });
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->query('to').' 23:59:59');
        }

        $requests = $query->orderByDesc('created_at')->get();

        $statusCounts = HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $serviceTypes = HotelServiceRequestType::query()
            ->where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get();

        return response()->json([
            'requests' => $requests->map(fn ($r) => $this->listItem($r))->values(),
            'service_types' => $serviceTypes->map(fn ($t) => [
                'module_key' => $t->module_key,
                'label' => $t->label,
                'icon_name' => $t->icon_name,
            ])->values(),
            'status_counts' => collect(self::STATUSES)->mapWithKeys(
                fn ($s) => [$s => (int) ($statusCounts[$s] ?? 0)]
            ),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);

        $data = $request->validate([
            'service_module' => ['required', 'string', 'max:120'],
            'service_label' => ['nullable', 'string', 'max:255'],
            'service_icon' => ['nullable', 'string', 'max:120'],
            'request_text' => ['required', 'string', 'max:2000'],
            'guest_display_name' => ['required', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:40'],
            'guest_phone' => ['nullable', 'string', 'max:40'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'status_guest_note' => ['nullable', 'string', 'max:500'],
            'staff_note' => ['nullable', 'string', 'max:2000'],
            'assigned_staff_name' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'integer', 'between:0,3'],
            'metadata' => ['nullable', 'array'],
            'created_via' => ['nullable', Rule::in(['mobile_app', 'web_admin', 'api', 'system'])],
        ]);

        $type = HotelServiceRequestType::query()
            ->where('hotel_id', $hotel->id)
            ->where('module_key', $data['service_module'])
            ->first();

        $requestModel = HotelServiceRequest::create([
            'hotel_id' => $hotel->id,
            'service_module' => $data['service_module'],
            'service_label' => $data['service_label'] ?? $type?->label ?? $data['service_module'],
            'service_icon' => $data['service_icon'] ?? $type?->icon_name ?? 'help',
            'request_text' => $data['request_text'],
            'guest_display_name' => $data['guest_display_name'],
            'room_number' => $data['room_number'],
            'guest_phone' => $data['guest_phone'] ?? null,
            'guest_email' => $data['guest_email'] ?? null,
            'status' => $data['status'] ?? 'new',
            'status_guest_note' => $data['status_guest_note'] ?? null,
            'staff_note' => $data['staff_note'] ?? null,
            'assigned_staff_name' => $data['assigned_staff_name'] ?? null,
            'priority' => $data['priority'] ?? 0,
            'metadata' => $data['metadata'] ?? [],
            'created_via' => $data['created_via'] ?? 'web_admin',
        ]);

        return response()->json(['request' => $this->detailPayload($requestModel->fresh())], 201);
    }

    public function show(string $id): JsonResponse
    {
        $requestModel = $this->findRequest($id);
        $requestModel->load('statusLogs');

        return response()->json(['request' => $this->detailPayload($requestModel)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $requestModel = $this->findRequest($id);

        $data = $request->validate([
            'service_module' => ['sometimes', 'string', 'max:120'],
            'service_label' => ['sometimes', 'string', 'max:255'],
            'service_icon' => ['sometimes', 'string', 'max:120'],
            'request_text' => ['sometimes', 'string', 'max:2000'],
            'guest_display_name' => ['sometimes', 'string', 'max:255'],
            'room_number' => ['sometimes', 'string', 'max:40'],
            'guest_phone' => ['nullable', 'string', 'max:40'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'status_guest_note' => ['nullable', 'string', 'max:500'],
            'staff_note' => ['nullable', 'string', 'max:2000'],
            'assigned_staff_name' => ['nullable', 'string', 'max:255'],
            'priority' => ['sometimes', 'integer', 'between:0,3'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $requestModel->update($data);

        return response()->json(['request' => $this->detailPayload($requestModel->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->findRequest($id)->delete();

        return response()->json(['success' => true]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findRequest(string $id): HotelServiceRequest
    {
        return HotelServiceRequest::where('id', $id)->firstOrFail();
    }

    private function listItem(HotelServiceRequest $request): array
    {
        return [
            'id' => $request->id,
            'request_number' => $request->request_number,
            'service_module' => $request->service_module,
            'service_icon' => $request->service_icon,
            'service_label' => $request->service_label,
            'request' => $request->request_text,
            'guest_name' => $request->guest_display_name,
            'guest_room' => $request->room_number,
            'created' => $this->formatTimestamp($request->created_at),
            'modified' => $this->formatTimestamp($request->updated_at),
            'status' => $request->status,
            'status_note' => $request->status_guest_note,
            'staff_note' => $request->staff_note,
            'priority' => $request->priority,
            'assigned_staff_name' => $request->assigned_staff_name,
        ];
    }

    private function detailPayload(HotelServiceRequest $request): array
    {
        return [
            ...$this->listItem($request),
            'guest_phone' => $request->guest_phone,
            'guest_email' => $request->guest_email,
            'guest_external_id' => $request->guest_external_id,
            'metadata' => $request->metadata ?? [],
            'created_via' => $request->created_via,
            'created_at' => $request->created_at?->toIso8601String(),
            'updated_at' => $request->updated_at?->toIso8601String(),
            'status_logs' => $request->relationLoaded('statusLogs')
                ? $request->statusLogs->map(fn ($log) => [
                    'id' => $log->id,
                    'from_status' => $log->from_status,
                    'to_status' => $log->to_status,
                    'note' => $log->note,
                    'changed_by' => $log->changed_by,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])->values()
                : [],
        ];
    }

    private function formatTimestamp(?\Illuminate\Support\Carbon $dt): ?array
    {
        if (! $dt) {
            return null;
        }

        return [
            'date' => $dt->format('d/m/y'),
            'time' => $dt->format('H:i'),
        ];
    }
}
