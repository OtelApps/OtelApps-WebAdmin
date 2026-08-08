<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelCrmGuestProfile;
use App\Models\HotelFolioLine;
use App\Models\HotelRoom;
use App\Models\HotelRoomEvent;
use App\Models\HotelStay;
use App\Models\HotelStayGuest;
use App\Models\HotelStayRequest;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReceptionService
{
    /**
     * @return array{hotel: array{name: string, slug: string}, floors: list<array<string, mixed>>, rooms: list<array<string, mixed>>}
     */
    public function board(Hotel $hotel, ?int $floor = null, ?string $occupancy = null, ?string $cleaning = null): array
    {
        $this->syncCrmGuestsIntoReception($hotel);

        $roomsQuery = HotelRoom::query()
            ->where('hotel_id', $hotel->id)
            ->orderByDesc('floor')
            ->orderBy('sort_order')
            ->orderBy('room_number');

        if ($floor !== null) {
            $roomsQuery->where('floor', $floor);
        }
        if ($occupancy) {
            $roomsQuery->where('occupancy_status', $occupancy);
        }
        if ($cleaning) {
            $roomsQuery->where('cleaning_status', $cleaning);
        }

        $rooms = $roomsQuery->get();
        $roomIds = $rooms->pluck('id')->all();

        $activeStays = HotelStay::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', 'active')
            ->whereIn('room_id', $roomIds)
            ->with(['guests' => fn ($q) => $q->orderBy('sort_order')])
            ->get()
            ->keyBy('room_id');

        $balances = HotelFolioLine::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('stay_id', $activeStays->pluck('id')->all())
            ->selectRaw('stay_id, coalesce(sum(amount), 0) as total, max(currency) as currency')
            ->groupBy('stay_id')
            ->get()
            ->keyBy('stay_id');

        $openIssueRoomIds = DB::connection(config('otelapps.db_connection'))
            ->table('hotel_room_issues')
            ->where('hotel_id', $hotel->id)
            ->where('status', 'open')
            ->whereIn('room_id', $roomIds)
            ->pluck('room_id')
            ->unique()
            ->all();

        $openIssueSet = array_fill_keys($openIssueRoomIds, true);

        $mapped = $rooms->map(function (HotelRoom $room) use ($activeStays, $balances, $openIssueSet) {
            /** @var HotelStay|null $stay */
            $stay = $activeStays->get($room->id);
            $primaryGuest = $stay?->guests->firstWhere('is_primary', true) ?? $stay?->guests->first();
            $balanceRow = $stay ? $balances->get($stay->id) : null;

            return [
                'id' => $room->id,
                'room_number' => $room->room_number,
                'floor' => $room->floor,
                'occupancy_status' => $room->occupancy_status,
                'cleaning_status' => $room->cleaning_status,
                'cleaning_note' => $room->cleaning_note,
                'guest_name' => $primaryGuest?->display_name,
                'guest_count' => $stay?->guest_count,
                'balance' => $balanceRow ? (float) $balanceRow->total : 0.0,
                'currency' => $balanceRow->currency ?? 'CZK',
                'has_open_issue' => isset($openIssueSet[$room->id]),
                'stay_id' => $stay?->id,
            ];
        })->values()->all();

        $floors = collect($mapped)
            ->groupBy('floor')
            ->map(fn (Collection $items, $floorNum) => [
                'floor' => (int) $floorNum,
                'label' => $this->floorLabel((int) $floorNum),
                'rooms' => $items->values()->all(),
            ])
            ->sortByDesc('floor')
            ->values()
            ->all();

        return [
            'hotel' => [
                'name' => $hotel->name,
                'slug' => $hotel->slug,
            ],
            'floors' => $floors,
            'rooms' => $mapped,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function roomDetail(Hotel $hotel, string $roomNumber): array
    {
        $this->syncCrmGuestsIntoReception($hotel);

        $room = HotelRoom::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_number', $roomNumber)
            ->firstOrFail();

        $stay = HotelStay::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_id', $room->id)
            ->where('status', 'active')
            ->with([
                'guests' => fn ($q) => $q->orderBy('sort_order'),
                'requests' => fn ($q) => $q->orderBy('sort_order'),
                'folioLines' => fn ($q) => $q->orderBy('posted_at'),
                'minibarCharges' => fn ($q) => $q->orderBy('charged_at'),
            ])
            ->first();

        $events = HotelRoomEvent::query()
            ->where('room_id', $room->id)
            ->orderByDesc('occurred_at')
            ->limit(50)
            ->get();

        $issues = $room->issues()
            ->where('status', 'open')
            ->orderByDesc('reported_at')
            ->get();

        $balance = $stay
            ? (float) $stay->folioLines->sum('amount')
            : 0.0;
        $currency = $stay?->folioLines->first()?->currency ?? 'CZK';

        $primaryGuest = $stay
            ? ($stay->guests->firstWhere('is_primary', true) ?? $stay->guests->first())
            : null;

        $nights = null;
        if ($stay) {
            $nights = max(
                1,
                (int) $stay->check_in_at->copy()->startOfDay()
                    ->diffInDays($stay->check_out_at->copy()->startOfDay())
            );
        }

        return [
            'hotel' => [
                'name' => $hotel->name,
                'slug' => $hotel->slug,
            ],
            'room' => [
                'id' => $room->id,
                'room_number' => $room->room_number,
                'floor' => $room->floor,
                'floor_label' => $this->floorLabel($room->floor),
                'occupancy_status' => $room->occupancy_status,
                'cleaning_status' => $room->cleaning_status,
                'cleaning_note' => $room->cleaning_note,
                'has_open_issue' => $issues->isNotEmpty(),
                'issues' => $issues->map(fn ($i) => [
                    'id' => $i->id,
                    'title' => $i->title,
                    'body' => $i->body,
                    'status' => $i->status,
                    'reported_at' => optional($i->reported_at)?->toIso8601String(),
                ])->values()->all(),
            ],
            'stay' => $stay ? [
                'id' => $stay->id,
                'status' => $stay->status,
                'check_in_at' => $stay->check_in_at->toIso8601String(),
                'check_out_at' => $stay->check_out_at->toIso8601String(),
                'nights' => $nights,
                'guest_count' => $stay->guest_count,
                'notes' => $stay->notes,
            ] : null,
            'guest' => $primaryGuest ? [
                'id' => $primaryGuest->id,
                'display_name' => $primaryGuest->display_name,
                'phone' => $primaryGuest->phone,
                'email' => $primaryGuest->email,
            ] : null,
            'requests' => $stay
                ? $stay->requests->map(fn (HotelStayRequest $r) => [
                    'id' => $r->id,
                    'label' => $r->label,
                    'is_checked' => $r->is_checked,
                    'is_new' => $r->is_new,
                ])->values()->all()
                : [],
            'balance' => [
                'amount' => $balance,
                'currency' => $currency,
            ],
            'guests' => $stay
                ? $stay->guests->map(fn ($g) => [
                    'id' => $g->id,
                    'display_name' => $g->display_name,
                    'phone' => $g->phone,
                    'email' => $g->email,
                    'is_primary' => $g->is_primary,
                ])->values()->all()
                : [],
            'folio_lines' => $stay
                ? $stay->folioLines->map(fn (HotelFolioLine $line) => [
                    'id' => $line->id,
                    'description' => $line->description,
                    'amount' => (float) $line->amount,
                    'currency' => $line->currency,
                    'category' => $line->category,
                    'posted_at' => optional($line->posted_at)?->toIso8601String(),
                ])->values()->all()
                : [],
            'minibar' => $stay
                ? $stay->minibarCharges->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'quantity' => $c->quantity,
                    'unit_price' => (float) $c->unit_price,
                    'total' => (float) ($c->quantity * $c->unit_price),
                    'currency' => $c->currency,
                    'charged_at' => optional($c->charged_at)?->toIso8601String(),
                ])->values()->all()
                : [],
            'events' => $events->map(fn (HotelRoomEvent $e) => [
                'id' => $e->id,
                'event_type' => $e->event_type,
                'title' => $e->title,
                'body' => $e->body,
                'occurred_at' => optional($e->occurred_at)?->toIso8601String(),
                'actor_name' => $e->actor_name,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function checkout(Hotel $hotel, string $roomNumber): array
    {
        $room = HotelRoom::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_number', $roomNumber)
            ->firstOrFail();

        $stay = HotelStay::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_id', $room->id)
            ->where('status', 'active')
            ->first();

        if (! $stay) {
            throw ValidationException::withMessages([
                'room' => 'Pokoj nemá aktivní pobyt.',
            ]);
        }

        $connection = config('otelapps.db_connection');

        DB::connection($connection)->transaction(function () use ($hotel, $room, $stay) {
            $stay->update([
                'status' => 'checked_out',
                'check_out_at' => Carbon::now(),
            ]);

            $room->update([
                'occupancy_status' => 'vacant',
                'cleaning_status' => 'dirty',
                'cleaning_note' => 'Po check-outu',
            ]);

            if ($stay->primary_guest_profile_id) {
                HotelCrmGuestProfile::query()
                    ->where('id', $stay->primary_guest_profile_id)
                    ->update([
                        'room_number' => null,
                        'check_out_at' => Carbon::now(),
                    ]);
            }

            HotelRoomEvent::query()->create([
                'hotel_id' => $hotel->id,
                'room_id' => $room->id,
                'stay_id' => $stay->id,
                'event_type' => 'check_out',
                'title' => 'Check-out',
                'body' => 'Pobyt ukončen recepcí.',
                'occurred_at' => Carbon::now(),
                'actor_name' => 'Recepce',
            ]);
        });

        return $this->roomDetail($hotel, $roomNumber);
    }

    /**
     * @return array{id: string, label: string, is_checked: bool, is_new: bool}
     */
    public function toggleRequest(Hotel $hotel, string $roomNumber, string $requestId, bool $isChecked): array
    {
        $room = HotelRoom::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_number', $roomNumber)
            ->firstOrFail();

        $stay = HotelStay::query()
            ->where('hotel_id', $hotel->id)
            ->where('room_id', $room->id)
            ->where('status', 'active')
            ->firstOrFail();

        $request = HotelStayRequest::query()
            ->where('stay_id', $stay->id)
            ->where('id', $requestId)
            ->firstOrFail();

        $request->update([
            'is_checked' => $isChecked,
            'is_new' => false,
        ]);

        return [
            'id' => $request->id,
            'label' => $request->label,
            'is_checked' => $request->is_checked,
            'is_new' => $request->is_new,
        ];
    }

    /**
     * CRM login hosté (room_number) se propsají do inventáře recepce.
     */
    private function syncCrmGuestsIntoReception(Hotel $hotel): void
    {
        $profiles = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotNull('room_number')
            ->where('room_number', '!=', '')
            ->get();

        if ($profiles->isEmpty()) {
            return;
        }

        $today = Carbon::today();

        foreach ($profiles as $profile) {
            $roomNumber = trim((string) $profile->room_number);
            if ($roomNumber === '') {
                continue;
            }

            $checkIn = $profile->check_in_at?->copy() ?? Carbon::now()->subDay();
            $checkOut = $profile->check_out_at?->copy() ?? Carbon::now()->addDays(3);

            // Po odjezdu hosta už pokoj znovu neobsazujeme (check-out z recepce maže room_number).
            if ($profile->check_out_at && $profile->check_out_at->lt($today)) {
                // Demo login hosté držíme „in-house“, i když mají starší datumy v CRM seedu.
                if (! str_starts_with((string) $profile->guest_key, 'ext:demo-')) {
                    continue;
                }
                $checkIn = Carbon::now()->subDay()->setTime(14, 0);
                $checkOut = Carbon::now()->addDays(3)->setTime(11, 0);
                $profile->update([
                    'check_in_at' => $checkIn,
                    'check_out_at' => $checkOut,
                ]);
            }

            $floor = $this->inferFloor($roomNumber);
            $sortOrder = (int) (preg_replace('/\D+/', '', $roomNumber) ?: 0);

            $room = HotelRoom::query()->firstOrCreate(
                [
                    'hotel_id' => $hotel->id,
                    'room_number' => $roomNumber,
                ],
                [
                    'floor' => $floor,
                    'occupancy_status' => 'occupied',
                    'cleaning_status' => 'clean',
                    'cleaning_note' => null,
                    'sort_order' => $sortOrder,
                ],
            );

            $room->fill([
                'floor' => $floor,
                'sort_order' => $sortOrder,
                'occupancy_status' => 'occupied',
            ]);
            if ($room->isDirty()) {
                $room->save();
            }

            $stay = HotelStay::query()
                ->where('hotel_id', $hotel->id)
                ->where('room_id', $room->id)
                ->where('status', 'active')
                ->first();

            if (! $stay) {
                $stay = HotelStay::query()->create([
                    'hotel_id' => $hotel->id,
                    'room_id' => $room->id,
                    'status' => 'active',
                    'check_in_at' => $checkIn,
                    'check_out_at' => $checkOut,
                    'guest_count' => max(1, (int) (data_get($profile->metadata, 'guest_count', 1))),
                    'primary_guest_profile_id' => $profile->id,
                    'notes' => null,
                    'metadata' => ['source' => 'crm_sync'],
                ]);

                HotelRoomEvent::query()->create([
                    'hotel_id' => $hotel->id,
                    'room_id' => $room->id,
                    'stay_id' => $stay->id,
                    'event_type' => 'check_in',
                    'title' => 'Check-in',
                    'body' => 'Host '.$profile->display_name.' ubytován (CRM).',
                    'occurred_at' => $checkIn,
                    'actor_name' => 'Recepce',
                ]);
            } else {
                $stay->update([
                    'primary_guest_profile_id' => $profile->id,
                    'check_in_at' => $checkIn,
                    'check_out_at' => $checkOut,
                ]);
            }

            $primaryGuest = HotelStayGuest::query()
                ->where('stay_id', $stay->id)
                ->where('is_primary', true)
                ->first();

            if ($primaryGuest) {
                $primaryGuest->update([
                    'guest_profile_id' => $profile->id,
                    'display_name' => $profile->display_name ?: $primaryGuest->display_name,
                    'email' => $profile->email,
                    'phone' => $profile->phone,
                ]);
            } else {
                HotelStayGuest::query()->create([
                    'stay_id' => $stay->id,
                    'guest_profile_id' => $profile->id,
                    'display_name' => $profile->display_name ?: 'Host',
                    'email' => $profile->email,
                    'phone' => $profile->phone,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
            }
        }
    }

    private function inferFloor(string $roomNumber): int
    {
        $digits = preg_replace('/\D+/', '', $roomNumber) ?: '0';

        if (strlen($digits) >= 3 && str_starts_with($digits, '0')) {
            return 0;
        }

        return (int) substr($digits, 0, 1);
    }

    private function floorLabel(int $floor): string
    {
        if ($floor === 0) {
            return 'Přízemí';
        }

        return $floor.'. patro';
    }
}
