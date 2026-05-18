<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Module Configuration
    |--------------------------------------------------------------------------
    |
    | Tento soubor obsahuje konfiguraci všech modulů aplikace.
    | Každý modul může být zapnutý nebo vypnutý pomocí true/false.
    |
    */

    'enabled' => [
        // Hlavní sekce
        'dashboard' => true,
        'content' => true,
        'my_app' => true,
        'activity' => false,
        'crm' => true,
        'feedback' => true,
        'concierge' => true,
        'insights' => true,

        // Content moduly
        'facilities' => true,
        'services' => true,
        'leisure' => true,
        'other' => true,
        'welcome_message' => true,
        'smart_assistant' => true,
        'legal_texts' => true,

        // Facilities sub-moduly
        'restaurants_bars' => true,
        'wellness_spa' => true,
        'sports' => true,
        'other_facilities' => true,

        // Services sub-moduly
        'room_service' => true,
        'amenities' => true,
        'laundry' => true,
        'issues_repairs' => true,
        'housekeeping' => true,
        'check_in_out' => true,

        // Funkce
        'booking_system' => true,
        'room_service' => true,
        'concierge_chat' => true,
        'upsell' => true,
        'image_gallery' => true,
        'menu_editor' => true,
        'qr_code' => true,
        'web_app_access' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Labels
    |--------------------------------------------------------------------------
    |
    | Názvy modulů pro zobrazení v UI
    |
    */

    'labels' => [
        'dashboard' => 'Dashboard',
        'content' => 'Content',
        'my_app' => 'My App',
        'activity' => 'Activity',
        'crm' => 'CRM',
        'feedback' => 'Feedback',
        'concierge' => 'Concierge',
        'insights' => 'Insights',
        'facilities' => 'Facilities',
        'services' => 'Services',
        'leisure' => 'Leisure',
        'other' => 'Other',
        'welcome_message' => 'Welcome Message',
        'smart_assistant' => 'Smart Assistant',
        'legal_texts' => 'Legal Texts',
        'restaurants_bars' => 'Restaurants & Bars',
        'wellness_spa' => 'Wellness & SPA',
        'sports' => 'Sports',
        'other_facilities' => 'Other Facilities',
        'room_service' => 'Room service',
        'amenities' => 'Amenities',
        'laundry' => 'Laundry',
        'issues_repairs' => 'Issues & repairs',
        'housekeeping' => 'Housekeeping',
        'check_in_out' => 'Check-in/out',
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Icons
    |--------------------------------------------------------------------------
    |
    | SVG ikony pro moduly (můžete použít Heroicons nebo jiné)
    |
    */

    'icons' => [
        'dashboard' => 'home',
        'content' => 'document-text',
        'my_app' => 'device-phone-mobile',
        'activity' => 'clock',
        'crm' => 'users',
        'feedback' => 'chat-bubble-left-right',
        'concierge' => 'user-circle',
        'insights' => 'chart-bar',
        'facilities' => 'building-office',
        'services' => 'bell',
        'leisure' => 'calendar',
        'other' => 'dots-three-horizontal',
        'welcome_message' => 'chat-bubble-left',
        'smart_assistant' => 'headphones',
        'legal_texts' => 'document',
        'restaurants_bars' => 'cake',
        'wellness_spa' => 'sparkles',
        'sports' => 'trophy',
        'other_facilities' => 'squares-plus',
    ],
];
