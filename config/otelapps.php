<?php

return [
    'hotel_slug' => env('OTELAPPS_HOTEL_SLUG', 'default'),

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
];
