<?php

return [
    'hotel_slug' => env('OTELAPPS_HOTEL_SLUG', 'default'),

    'currency' => env('OTELAPPS_CURRENCY', 'CZK'),

    'db_connection' => env('OTELAPPS_DB_CONNECTION', env('DB_CONNECTION', 'sqlite')),

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
