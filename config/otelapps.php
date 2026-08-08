<?php

return [
    'hotel_slug' => env('OTELAPPS_HOTEL_SLUG', 'default'),

    'currency' => env('OTELAPPS_CURRENCY', 'CZK'),

    /** Celková kapacita pokojů pro výpočet obsazenosti na dashboardu */
    'room_capacity' => (int) env('OTELAPPS_ROOM_CAPACITY', 100),

    'db_connection' => env('OTELAPPS_DB_CONNECTION', env('DB_CONNECTION', 'sqlite')),

    /**
     * Finanční uzávěrka — výchozí hodnoty (hotel může override přes hotel_finance_settings).
     */
    'finance' => [
        'financial_day_start_time' => env('OTELAPPS_FINANCIAL_DAY_START', '06:00'),
        'default_cash_float' => (float) env('OTELAPPS_DEFAULT_CASH_FLOAT', 5000),
        'closing_variance_warning' => (float) env('OTELAPPS_CLOSING_VARIANCE_WARNING', 10),
        'closing_variance_blocking' => (float) env('OTELAPPS_CLOSING_VARIANCE_BLOCKING', 100),
        'denominations' => [
            'CZK' => [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
            'EUR' => [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01],
        ],
        'variance_reasons' => [
            'change_error' => 'Chyba při vracení',
            'unrecorded_payment' => 'Nezaevidovaná platba',
            'fx_difference' => 'Kurzový rozdíl',
            'terminal_error' => 'Chyba terminálu',
            'shortage' => 'Manko',
            'overage' => 'Přebytek',
            'other' => 'Jiné',
        ],
        'deposit_destinations' => [
            'safe' => 'Trezor',
            'bank_deposit' => 'Bankovní vklad',
            'manager' => 'Předání managerovi',
            'other_till' => 'Jiná pokladna',
            'other' => 'Jiné',
        ],
    ],

    /**
     * Demo přepínač profilů v navbaru (bez hesla).
     * Default: zapnuto mimo production.
     */
    'demo_user_switcher' => filter_var(
        env('OTELAPPS_DEMO_USER_SWITCHER', env('APP_ENV', 'local') !== 'production' ? 'true' : 'false'),
        FILTER_VALIDATE_BOOLEAN
    ),

    'venue_image_keys' => [
        'restaurantFoodMood' => '/images/hotelRestaurant.png',
        'barLobby' => null,
    ],

    'wellness_image_keys' => [
        'pool' => '/images/pool.jpg',
        'SPAwellness' => '/images/sauna.jpg',
        'SPAthai' => '/images/massage.jpg',
    ],

    'relax_sport_home_image_keys' => [
        'sauna' => null,
        'gym' => null,
    ],

    'fitness_image_keys' => [
        'gym' => null,
        'room' => null,
    ],

    'hotel_info_image_keys' => [
        'welcome' => null,
        'reception' => null,
        'intouch' => null,
        'safe' => null,
        'homeMap' => null,
        'prague' => null,
    ],

    'hotel_room_image_keys' => [
        'room' => null,
    ],

    'hotel_parking_image_keys' => [
        'reception' => null,
        'prague' => null,
    ],

    'hotel_supplies_image_keys' => [
        'headerDoplnky' => null,
    ],

    'hotel_maintenance_image_keys' => [
        'headerMaintenance' => null,
    ],

    'hotel_housekeeping_image_keys' => [
        'headerMaintenance' => null,
        'roomServiceIcon' => null,
        'lostFoundIcon' => null,
    ],

    'hotel_room_service_list_image_keys' => [
        'breakfast' => null,
        'lunch' => null,
        'dinner' => null,
    ],

    'hotel_room_service_header_image_keys' => [
        'snidaneHeader' => null,
        'obedHeader' => null,
        'vecereHeader' => null,
    ],
];
