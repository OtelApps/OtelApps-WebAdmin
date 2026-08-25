<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\ModuleService;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $tickets,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('ukoly')) {
            return response()->json(['message' => 'Modul Úkoly je vypnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $data = $this->tickets->list($hotel, $request->user(), $request->only(['queue_key', 'status']));

        return response()->json($data);
    }

    public function stats(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('ukoly')) {
            return response()->json(['message' => 'Modul Úkoly je vypnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json($this->tickets->stats($hotel, $request->user()));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);

        return response()->json($this->tickets->show($hotel, $request->user(), $id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_number' => ['required', 'string', 'max:32'],
            'request_text' => ['required', 'string', 'max:2000'],
            'service_module' => ['nullable', 'string', 'max:64'],
            'service_label' => ['nullable', 'string', 'max:120'],
            'queue_key' => ['nullable', 'string', 'max:64'],
            'priority' => ['nullable', 'integer', 'between:0,3'],
            'due_at' => ['nullable', 'date'],
            'guest_display_name' => ['nullable', 'string', 'max:120'],
        ]);

        $hotel = $this->resolveHotel($request);
        $ticket = $this->tickets->create($hotel, $request->user(), $data);

        return response()->json($this->tickets->show($hotel, $request->user(), $ticket->id), 201);
    }

    public function claim(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $this->tickets->claim($hotel, $request->user(), $id);

        return response()->json($this->tickets->show($hotel, $request->user(), $id));
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $hotel = $this->resolveHotel($request);
        $this->tickets->complete($hotel, $request->user(), $id, $data['note'] ?? null);

        return response()->json($this->tickets->show($hotel, $request->user(), $id));
    }

    public function reassign(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $hotel = $this->resolveHotel($request);
        $this->tickets->reassign($hotel, $request->user(), $id, (int) $data['user_id']);

        return response()->json($this->tickets->show($hotel, $request->user(), $id));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'priority' => ['sometimes', 'integer', 'between:0,3'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'request_text' => ['sometimes', 'string', 'max:2000'],
            'staff_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'comment' => ['sometimes', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(['new', 'pending', 'in_progress', 'solved', 'rejected', 'archived'])],
            'guest_display_name' => ['sometimes', 'string', 'max:255'],
            'room_number' => ['sometimes', 'string', 'max:40'],
            'guest_phone' => ['nullable', 'string', 'max:40'],
            'status_guest_note' => ['nullable', 'string', 'max:500'],
            'assigned_staff_name' => ['nullable', 'string', 'max:255'],
            'service_module' => ['sometimes', 'string', 'max:64'],
            'service_label' => ['sometimes', 'string', 'max:120'],
        ]);

        $hotel = $this->resolveHotel($request);
        $this->tickets->update($hotel, $request->user(), $id, $data);

        return response()->json($this->tickets->show($hotel, $request->user(), $id));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $this->tickets->destroy($hotel, $request->user(), $id);

        return response()->json(['success' => true]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
