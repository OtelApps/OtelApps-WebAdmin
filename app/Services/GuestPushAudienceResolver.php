<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelCrmGuestProfile;
use App\Models\HotelGuestPushToken;
use App\Models\HotelServiceRequest;
use Illuminate\Support\Collection;

class GuestPushAudienceResolver
{
    public const CRM_SEGMENTS = ['standard', 'vip', 'corporate', 'returning'];

    /** @var array<string, array{label: string, description: string, icon: string}> */
    public const COHORTS = [
        'frequent_orderers' => [
            'label' => 'Častí objednávající',
            'description' => 'Hosté se 3 a více požadavky v hotelu.',
            'icon' => 'shopping_bag',
        ],
        'long_stay' => [
            'label' => 'Dlouhodobý pobyt',
            'description' => 'Hosté s pobytem 5 a více dní.',
            'icon' => 'calendar_month',
        ],
        'recently_active' => [
            'label' => 'Nedávno aktivní',
            'description' => 'Objednávka nebo aktivita za posledních 7 dní.',
            'icon' => 'bolt',
        ],
        'returning_guests' => [
            'label' => 'Vracející se hosté',
            'description' => 'Hosté s 2 a více pobyty v historii.',
            'icon' => 'replay',
        ],
        'new_guests' => [
            'label' => 'Noví hosté',
            'description' => 'První nebo druhý pobyt — ideální pro welcome nabídky.',
            'icon' => 'person_add',
        ],
        'high_loyalty' => [
            'label' => 'Věrní hosté',
            'description' => '50 a více věrnostních bodů.',
            'icon' => 'stars',
        ],
    ];

    /**
     * @return array<int, array{key: string, label: string, description: string, icon: string, device_count: int, guest_count: int}>
     */
    public function listOptions(Hotel $hotel): array
    {
        $options = [
            [
                'key' => 'all',
                'type' => 'all',
                'label' => 'Všichni v aplikaci',
                'description' => 'Každý host s přihlášenou app a push tokenem.',
                'icon' => 'groups',
            ],
        ];

        foreach (self::COHORTS as $key => $meta) {
            $options[] = [
                'key' => $key,
                'type' => 'cohort',
                'label' => $meta['label'],
                'description' => $meta['description'],
                'icon' => $meta['icon'],
            ];
        }

        foreach ([
            'standard' => 'Standardní hosté',
            'vip' => 'VIP hosté',
            'corporate' => 'Corporate hosté',
            'returning' => 'Vracející se segment',
        ] as $segment => $label) {
            $options[] = [
                'key' => $segment,
                'type' => 'segment',
                'label' => $label,
                'description' => 'CRM segment podle profilu hosta.',
                'icon' => 'sell',
            ];
        }

        return array_map(function (array $option) use ($hotel) {
            $stats = $this->stats(
                $hotel,
                $option['type'] === 'all' ? 'all' : $option['type'],
                $option['type'] === 'segment' ? $option['key'] : null,
                $option['type'] === 'cohort' ? $option['key'] : null,
                null,
            );

            return array_merge($option, $stats);
        }, $options);
    }

    /**
     * @return array{device_count: int, guest_count: int, guest_external_ids: array<int, string>}
     */
    public function stats(
        Hotel $hotel,
        string $audience,
        ?string $segment = null,
        ?string $cohort = null,
        ?string $guestKey = null,
    ): array {
        $externalIds = $this->resolveGuestExternalIds($hotel, $audience, $segment, $cohort, $guestKey);
        $tokens = $this->loadTokens($hotel, $externalIds);

        return [
            'device_count' => $tokens->count(),
            'guest_count' => $externalIds->count(),
            'guest_external_ids' => $externalIds->values()->all(),
        ];
    }

    /**
     * @return Collection<int, string>
     */
    public function resolveGuestExternalIds(
        Hotel $hotel,
        string $audience,
        ?string $segment = null,
        ?string $cohort = null,
        ?string $guestKey = null,
    ): Collection {
        $externalIds = match ($audience) {
            'guest' => $this->resolveSingleGuestExternalId($hotel, $guestKey),
            'segment' => $this->resolveCrmSegmentExternalIds($hotel, $segment),
            'cohort' => $this->resolveCohortExternalIds($hotel, $cohort),
            default => $this->resolveAllRegisteredExternalIds($hotel),
        };

        return $this->intersectWithRegisteredExternalIds($hotel, $externalIds);
    }

    /**
     * @return Collection<int, HotelGuestPushToken>
     */
    public function loadTokens(Hotel $hotel, Collection $externalIds): Collection
    {
        if ($externalIds->isEmpty()) {
            return collect();
        }

        return HotelGuestPushToken::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('guest_external_id', $externalIds->all())
            ->get();
    }

    /**
     * @return Collection<int, string>
     */
    private function intersectWithRegisteredExternalIds(Hotel $hotel, Collection $externalIds): Collection
    {
        $registered = $this->resolveAllRegisteredExternalIds($hotel);

        if ($externalIds->isEmpty()) {
            return collect();
        }

        return $externalIds
            ->filter(fn (string $id) => $registered->contains($id))
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveAllRegisteredExternalIds(Hotel $hotel): Collection
    {
        return HotelGuestPushToken::query()
            ->where('hotel_id', $hotel->id)
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveSingleGuestExternalId(Hotel $hotel, ?string $guestKey): Collection
    {
        $guestKey = trim((string) $guestKey);
        if ($guestKey === '') {
            return collect();
        }

        if (str_starts_with($guestKey, 'ext:')) {
            return collect([substr($guestKey, 4)]);
        }

        $profile = HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('guest_key', $guestKey)
            ->first();

        if ($profile?->guest_external_id) {
            return collect([$profile->guest_external_id]);
        }

        return collect();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveCrmSegmentExternalIds(Hotel $hotel, ?string $segment): Collection
    {
        $segment = trim((string) $segment);
        if ($segment === '' || ! in_array($segment, self::CRM_SEGMENTS, true)) {
            return collect();
        }

        return HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->where('segment', $segment)
            ->whereNotNull('guest_external_id')
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveCohortExternalIds(Hotel $hotel, ?string $cohort): Collection
    {
        $cohort = trim((string) $cohort);
        if ($cohort === '' || ! array_key_exists($cohort, self::COHORTS)) {
            return collect();
        }

        return match ($cohort) {
            'frequent_orderers' => $this->resolveFrequentOrdererExternalIds($hotel),
            'long_stay' => $this->resolveLongStayExternalIds($hotel),
            'recently_active' => $this->resolveRecentlyActiveExternalIds($hotel),
            'returning_guests' => $this->resolveReturningGuestExternalIds($hotel),
            'new_guests' => $this->resolveNewGuestExternalIds($hotel),
            'high_loyalty' => $this->resolveHighLoyaltyExternalIds($hotel),
            default => collect(),
        };
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveFrequentOrdererExternalIds(Hotel $hotel): Collection
    {
        return HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotNull('guest_external_id')
            ->selectRaw('guest_external_id, COUNT(*) as request_count')
            ->groupBy('guest_external_id')
            ->havingRaw('COUNT(*) >= 3')
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveLongStayExternalIds(Hotel $hotel): Collection
    {
        return HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotNull('guest_external_id')
            ->whereNotNull('check_in_at')
            ->whereNotNull('check_out_at')
            ->get()
            ->filter(function (HotelCrmGuestProfile $profile) {
                if (! $profile->check_in_at || ! $profile->check_out_at) {
                    return false;
                }

                return $profile->check_in_at->diffInDays($profile->check_out_at) >= 5;
            })
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveRecentlyActiveExternalIds(Hotel $hotel): Collection
    {
        return HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->whereNotNull('guest_external_id')
            ->distinct()
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveReturningGuestExternalIds(Hotel $hotel): Collection
    {
        return HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotNull('guest_external_id')
            ->where('stay_count', '>=', 2)
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveNewGuestExternalIds(Hotel $hotel): Collection
    {
        return HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotNull('guest_external_id')
            ->where(function ($query) {
                $query->whereNull('stay_count')->orWhere('stay_count', '<=', 1);
            })
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveHighLoyaltyExternalIds(Hotel $hotel): Collection
    {
        return HotelCrmGuestProfile::query()
            ->where('hotel_id', $hotel->id)
            ->whereNotNull('guest_external_id')
            ->where('loyalty_points', '>=', 50)
            ->pluck('guest_external_id')
            ->filter()
            ->unique()
            ->values();
    }
}
