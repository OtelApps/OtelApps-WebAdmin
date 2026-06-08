<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeConversation;
use App\Models\HotelRoomType;
use App\Models\HotelServiceRequest;

class DashboardService
{
    public const WIDGET_IDS = [
        'hotel_overview',
        'guest_requests',
        'revenue_upsell',
        'add_content',
        'manage_requests',
        'concierge_inbox',
        'crm_snapshot',
        'insights_revenue',
    ];

    public const DEFAULT_LAYOUT = [
        'hotel_overview',
        'guest_requests',
        'revenue_upsell',
        'add_content',
        'manage_requests',
    ];

    public function __construct(
        private readonly CrmService $crmService,
    ) {}

    public function layout(Hotel $hotel): array
    {
        $catalog = $this->widgetCatalog();
        $saved = $this->loadLayoutWidgets($hotel);
        $widgets = $this->sanitizeLayout($saved, $catalog);

        return [
            'widgets' => $widgets,
            'catalog' => array_values($catalog),
            'default_layout' => self::DEFAULT_LAYOUT,
            'updated_at' => $this->layoutUpdatedAt($hotel),
        ];
    }

    public function updateLayout(Hotel $hotel, array $widgets): array
    {
        $catalog = $this->widgetCatalog();
        $sanitized = $this->sanitizeLayout($widgets, $catalog);

        \App\Models\HotelDashboardLayout::query()->updateOrCreate(
            ['hotel_id' => $hotel->id],
            ['widgets' => $sanitized],
        );

        return $this->layout($hotel);
    }

    public function bootstrap(Hotel $hotel): array
    {
        $moduleKeys = ['activity', 'crm', 'concierge', 'insights', 'content'];
        $modules = collect($moduleKeys)->mapWithKeys(
            fn (string $key) => [$key => ModuleService::isEnabled($key)]
        )->all();

        return [
            'modules' => $modules,
            'layout' => $this->layout($hotel),
            'overview' => $this->hotelOverview($hotel),
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function widgetCatalog(): array
    {
        $items = [
            'hotel_overview' => [
                'id' => 'hotel_overview',
                'title' => 'Hotel Overview',
                'description' => 'Obsazenost, příjezdy a odjezdy',
                'icon' => 'apartment',
                'module' => null,
            ],
            'guest_requests' => [
                'id' => 'guest_requests',
                'title' => 'Guest Requests',
                'description' => 'Poslední požadavky hostů z Activity',
                'icon' => 'moving',
                'module' => 'activity',
            ],
            'revenue_upsell' => [
                'id' => 'revenue_upsell',
                'title' => 'Revenue & Upsell',
                'description' => 'Dnešní tržby a top služby',
                'icon' => 'payments',
                'module' => 'activity',
            ],
            'add_content' => [
                'id' => 'add_content',
                'title' => 'Add Content',
                'description' => 'Rychlý odkaz do Content hubu',
                'icon' => 'article',
                'module' => 'content',
            ],
            'manage_requests' => [
                'id' => 'manage_requests',
                'title' => 'Manage Requests',
                'description' => 'Zkratka do Activity',
                'icon' => 'checklist',
                'module' => 'activity',
            ],
            'concierge_inbox' => [
                'id' => 'concierge_inbox',
                'title' => 'Concierge Inbox',
                'description' => 'Nepřečtené chaty s hosty',
                'icon' => 'chat',
                'module' => 'concierge',
            ],
            'crm_snapshot' => [
                'id' => 'crm_snapshot',
                'title' => 'CRM Snapshot',
                'description' => 'Hosté, alerty a úkoly',
                'icon' => 'group',
                'module' => 'crm',
            ],
            'insights_revenue' => [
                'id' => 'insights_revenue',
                'title' => 'Insights Revenue',
                'description' => 'Týdenní tržby z Insights',
                'icon' => 'bar_chart',
                'module' => 'insights',
            ],
        ];

        return collect($items)
            ->filter(function (array $item) {
                $module = $item['module'];
                if ($module === null) {
                    return true;
                }

                return ModuleService::isEnabled($module);
            })
            ->all();
    }

    /**
     * @param  array<string, array<string, mixed>>  $catalog
     * @return list<string>
     */
    private function sanitizeLayout(array $widgets, array $catalog): array
    {
        $allowed = array_keys($catalog);

        $clean = collect($widgets)
            ->filter(fn ($id) => is_string($id) && in_array($id, self::WIDGET_IDS, true) && in_array($id, $allowed, true))
            ->unique()
            ->values()
            ->all();

        if ($clean === []) {
            $clean = collect(self::DEFAULT_LAYOUT)
                ->filter(fn ($id) => in_array($id, $allowed, true))
                ->values()
                ->all();
        }

        return $clean;
    }

    private function loadLayoutWidgets(Hotel $hotel): array
    {
        try {
            $row = \App\Models\HotelDashboardLayout::query()->find($hotel->id);

            if ($row && is_array($row->widgets) && $row->widgets !== []) {
                return $row->widgets;
            }
        } catch (\Throwable) {
            // tabulka nemusí existovat
        }

        return self::DEFAULT_LAYOUT;
    }

    private function layoutUpdatedAt(Hotel $hotel): ?string
    {
        try {
            return \App\Models\HotelDashboardLayout::query()
                ->find($hotel->id)
                ?->updated_at
                ?->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

    public function hotelOverview(Hotel $hotel): array
    {
        $capacity = $this->roomCapacity($hotel);
        $metrics = $this->stayMetrics($hotel);

        $guestsStaying = $metrics['guests_staying'];
        $occupancy = $capacity > 0 ? round($guestsStaying / $capacity * 100, 1) : 0.0;

        $yesterdayGuests = $metrics['guests_staying_yesterday'];
        $occupancyYesterday = $capacity > 0 && $yesterdayGuests > 0
            ? round($yesterdayGuests / $capacity * 100, 1)
            : null;

        $trend = $occupancyYesterday !== null
            ? round($occupancy - $occupancyYesterday, 1)
            : null;

        $crmEnabled = ModuleService::isEnabled('crm');
        $roomsModuleEnabled = ModuleService::isEnabled('hotel_rooms');

        return [
            'hotel_name' => $hotel->name,
            'room_capacity' => $capacity,
            'guests_staying' => $guestsStaying,
            'arrivals_today' => $metrics['arrivals_today'],
            'departures_today' => $metrics['departures_today'],
            'occupancy_percent' => $occupancy,
            'occupancy_trend' => $trend,
            'data_source' => $metrics['data_source'],
            'crm_enabled' => $crmEnabled,
            'links' => [
                'rooms' => $roomsModuleEnabled ? '/module/facilities/hotel_rooms' : null,
                'guests' => $crmEnabled ? '/module/crm/guests' : '/activity',
            ],
            'highlights' => $this->highlights($hotel),
        ];
    }

    private function stayMetrics(Hotel $hotel): array
    {
        if (ModuleService::isEnabled('crm') || ModuleService::isEnabled('activity') || ModuleService::isEnabled('concierge')) {
            try {
                return $this->crmService->stayMetrics($hotel);
            } catch (\Throwable) {
                // CRM tabulky nemusí být nasazené
            }
        }

        return [
            'guests_staying' => 0,
            'arrivals_today' => 0,
            'departures_today' => 0,
            'guests_staying_yesterday' => 0,
            'data_source' => 'none',
        ];
    }

    private function roomCapacity(Hotel $hotel): int
    {
        $configured = (int) config('otelapps.room_capacity', 0);
        if ($configured > 0) {
            return $configured;
        }

        if (ModuleService::isEnabled('hotel_rooms')) {
            try {
                $types = HotelRoomType::query()
                    ->where('hotel_id', $hotel->id)
                    ->where('is_active', true)
                    ->count();

                if ($types > 0) {
                    return max($types * 25, 50);
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        return 100;
    }

    /**
     * @return list<array{label: string, value: int|string, hint?: string}>
     */
    private function highlights(Hotel $hotel): array
    {
        $items = [];

        if (ModuleService::isEnabled('activity')) {
            try {
                $open = HotelServiceRequest::query()
                    ->where('hotel_id', $hotel->id)
                    ->whereIn('status', ['new', 'pending', 'in_progress'])
                    ->count();
                if ($open > 0) {
                    $items[] = [
                        'label' => 'Otevřené požadavky',
                        'value' => $open,
                        'hint' => 'Activity',
                    ];
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        if (ModuleService::isEnabled('concierge')) {
            try {
                $unread = (int) \App\Models\HotelConciergeConversation::query()
                    ->where('hotel_id', $hotel->id)
                    ->sum('unread_staff_count');
                if ($unread > 0) {
                    $items[] = [
                        'label' => 'Nepřečtený chat',
                        'value' => $unread,
                        'hint' => 'Concierge',
                    ];
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        return $items;
    }
}
