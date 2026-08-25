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
        'recepce' => true,
        'ukoly' => true,
        'finance' => true,
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
        'surveys_welcome' => true,
        'surveys_generic' => true,
        'surveys_facilities' => true,
        'surveys_checkout' => true,
        'external_platforms' => true,
        'inbox' => true,
        'stats' => true,

        // Insights moduly
        'users' => true,
        'transactions' => true,
        'revenue' => true,
        'behavior' => true,
        'staff' => true,

        // Finance sub-moduly
        'finance_overview' => true,
        'finance_closings' => true,
        'finance_transactions' => true,
        'finance_deposits' => true,
        'finance_reports' => true,

        // Facilities sub-moduly
        'restaurants_bars' => true,
        'relax_sport' => false,
        'wellness_spa' => true,
        'sports' => true,
        'other_facilities' => true,

        // Other sub-moduly
        'hotel_info' => true,
        'hotel_rooms' => true,
        'parking' => true,
        'places_of_interest' => true,
        'transportation' => true,
        'where_to_go' => true,
        'generic_other' => true,
        'required_content' => true,

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
        'recepce' => 'Recepce',
        'ukoly' => 'Úkoly',
        'finance' => 'Finance',
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
        'other_facilities' => 'Other facilities',
        'room_service' => 'Pokojová služba',
        'amenities' => 'Doplňky',
        'laundry' => 'Úklid pokoje',
        'issues_repairs' => 'Údržba & opravy',
        'check_in_out' => 'Check-in/out',

        // Other dropdown labels
        'hotel_info' => 'Informace o hotelu',
        'hotel_rooms' => 'Nabídka pokojů',
        'parking' => 'Parkování',
        'places_of_interest' => 'Památky a místa',
        'transportation' => 'Doprava a MHD',
        'where_to_go' => 'Kam zajít',
        'generic_other' => 'Ostatní obsah',
        'required_content' => 'Required Content',

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
        'surveys_welcome' => 'Welcome',
        'surveys_generic' => 'Generic',
        'surveys_facilities' => 'Facilities & Services',
        'surveys_checkout' => 'Checkout',
        'external_platforms' => 'External Platforms',
        'inbox' => 'Inbox',
        'stats' => 'Stats',
        'users' => 'Users',
        'transactions' => 'Transactions',
        'revenue' => 'Revenue',
        'behavior' => 'Behavior',
        'staff' => 'Personál',
        'image_gallery' => 'Image Gallery',

        // Finance
        'finance_overview' => 'Přehled',
        'finance_closings' => 'Uzávěrky',
        'finance_transactions' => 'Transakce',
        'finance_deposits' => 'Odvody',
        'finance_reports' => 'Reporty',
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
        'recepce' => 'desk',
        'ukoly' => 'task_alt',
        'finance' => 'account_balance_wallet',
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
        'sports' => 'trophy',
        'other_facilities' => 'building-library',

        'hotel_info' => 'information-circle',
        'hotel_rooms' => 'home',
        'parking' => 'squares-plus',
        'places_of_interest' => 'map',
        'transportation' => 'truck',
        'where_to_go' => 'compass',
        'generic_other' => 'dots-horizontal',
        'required_content' => 'clipboard-check',

        // New icons
        'mobile_app' => 'phone',
        'web_app' => 'globe-alt',
        'requests' => 'clipboard-list',
        'guests' => 'user-group',
        'alerts' => 'exclamation-circle',
        'promotions' => 'ticket',
        'surveys' => 'clipboard-document-check',
        'surveys_welcome' => 'chat-bubble-left',
        'surveys_generic' => 'clipboard-document-list',
        'surveys_facilities' => 'building-office-2',
        'surveys_checkout' => 'arrow-right-on-rectangle',
        'external_platforms' => 'share',
        'inbox' => 'inbox',
        'stats' => 'presentation-chart-line',
        'users' => 'identification',
        'transactions' => 'credit-card',
        'revenue' => 'banknotes',
        'behavior' => 'finger-print',
        'staff' => 'badge',
        'image_gallery' => 'photo',

        // Finance
        'finance_overview' => 'dashboard',
        'finance_closings' => 'lock_clock',
        'finance_transactions' => 'payments',
        'finance_deposits' => 'savings',
        'finance_reports' => 'description',
    ],
];
