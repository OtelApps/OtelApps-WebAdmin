<?php

return [
    'hotel_slug' => env('OTELAPPS_HOTEL_SLUG', 'default'),

    'db_connection' => env('OTELAPPS_DB_CONNECTION', env('DB_CONNECTION', 'sqlite')),

    'venue_image_keys' => [
        'restaurantFoodMood' => '/images/hotelRestaurant.png',
        'barLobby' => null,
    ],
];
