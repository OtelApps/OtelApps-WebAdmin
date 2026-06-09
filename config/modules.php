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
        'my_app' => false,
        'activity' => true,
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

        // My App moduly
        'mobile_app' => true,
        'web_app' => true,

        // Activity moduly
        'requests' => true,

        // CRM moduly
        'guests' => true,
        'alerts' => true,
        'promotions' => true,
        'tasks' => true,
        'history' => true,

        // Feedback moduly
        'surveys' => true,
        'external_platforms' => true,
        'inbox' => true,
        'stats' => true,

        // Insights moduly
        'users' => true,
        'transactions' => true,
        'revenue' => true,
        'behavior' => true,

        // Facilities sub-moduly
        'restaurants_bars' => true,
        'relax_sport' => true,
        'wellness_spa' => false,
        'hotel_info' => true,
        'hotel_rooms' => true,
        'sports' => false,
        'parking' => true,
        'other_facilities' => true,

        // Services sub-moduly
        'room_service' => true,
        'amenities' => true,
        'laundry' => true,
        'issues_repairs' => true,
        'check_in_out' => true,

        // Funkce
        'booking_system' => true,
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
        'relax_sport' => 'Relax & Sport',
        'wellness_spa' => 'Wellness & SPA',
        'hotel_info' => 'Informace o hotelu',
        'hotel_rooms' => 'Nabídka pokojů',
        'sports' => 'Posilovna & Sport',
        'parking' => 'Parkování',
        'other_facilities' => 'Other facilities',
        'room_service' => 'Pokojová služba',
        'amenities' => 'Doplňky',
        'laundry' => 'Úklid pokoje',
        'issues_repairs' => 'Údržba & opravy',
        'check_in_out' => 'Check-in/out',

        // New labels
        'mobile_app' => 'Mobile App',
        'web_app' => 'Web App',
        'requests' => 'Requests',
        'guests' => 'Guests',
        'alerts' => 'Alerts',
        'promotions' => 'Promotions',
        'tasks' => 'Tasks',
        'history' => 'History',
        'surveys' => 'Surveys',
        'external_platforms' => 'External Platforms',
        'inbox' => 'Inbox',
        'stats' => 'Stats',
        'users' => 'Users',
        'transactions' => 'Transactions',
        'revenue' => 'Revenue',
        'behavior' => 'Behavior',
        'image_gallery' => 'Image Gallery',
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
        'relax_sport' => 'heart',
        'wellness_spa' => 'sparkles',
        'hotel_info' => 'information-circle',
        'hotel_rooms' => 'home',
        'sports' => 'trophy',
        'parking' => 'squares-plus',
        'other_facilities' => 'building-library',

        // New icons
        'mobile_app' => 'phone',
        'web_app' => 'globe-alt',
        'requests' => 'clipboard-list',
        'guests' => 'user-group',
        'alerts' => 'exclamation-circle',
        'promotions' => 'ticket',
        'surveys' => 'clipboard-document-check',
        'external_platforms' => 'share',
        'inbox' => 'inbox',
        'stats' => 'presentation-chart-line',
        'users' => 'identification',
        'transactions' => 'credit-card',
        'revenue' => 'banknotes',
        'behavior' => 'finger-print',
        'image_gallery' => 'photo',
    ],
];
