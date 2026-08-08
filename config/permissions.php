<?php

/**
 * Katalog oprávnění pro typy uživatelů.
 * Klíče modules.* řídí viditelnost top-level navigace.
 * Klíče tickets.queue.* určují fronty tiketů.
 */
return [
    'catalog' => [
        // Moduly
        ['key' => 'modules.recepce.view', 'group' => 'modules', 'label' => 'Recepce', 'sort_order' => 10],
        ['key' => 'modules.dashboard.view', 'group' => 'modules', 'label' => 'Dashboard', 'sort_order' => 20],
        ['key' => 'modules.ukoly.view', 'group' => 'modules', 'label' => 'Úkoly', 'sort_order' => 30],
        ['key' => 'modules.content.view', 'group' => 'modules', 'label' => 'Content', 'sort_order' => 40],
        ['key' => 'modules.activity.view', 'group' => 'modules', 'label' => 'Activity', 'sort_order' => 50],
        ['key' => 'modules.crm.view', 'group' => 'modules', 'label' => 'CRM', 'sort_order' => 60],
        ['key' => 'modules.feedback.view', 'group' => 'modules', 'label' => 'Feedback', 'sort_order' => 70],
        ['key' => 'modules.concierge.view', 'group' => 'modules', 'label' => 'Concierge', 'sort_order' => 80],
        ['key' => 'modules.insights.view', 'group' => 'modules', 'label' => 'Insights', 'sort_order' => 90],
        ['key' => 'modules.my_app.view', 'group' => 'modules', 'label' => 'My App', 'sort_order' => 100],
        ['key' => 'modules.finance.view', 'group' => 'modules', 'label' => 'Finance', 'sort_order' => 35],

        // Finance
        ['key' => 'finance.closing.view', 'group' => 'finance', 'label' => 'Zobrazit uzávěrky', 'sort_order' => 160],
        ['key' => 'finance.closing.create', 'group' => 'finance', 'label' => 'Zahájit uzávěrku', 'sort_order' => 170],
        ['key' => 'finance.closing.complete', 'group' => 'finance', 'label' => 'Dokončit uzávěrku', 'sort_order' => 180],
        ['key' => 'finance.closing.reopen', 'group' => 'finance', 'label' => 'Znovu otevřít uzávěrku', 'sort_order' => 190],
        ['key' => 'finance.closing.edit_cash_float', 'group' => 'finance', 'label' => 'Upravit základ pokladny', 'sort_order' => 195],
        ['key' => 'finance.reports.view', 'group' => 'finance', 'label' => 'Zobrazit reporty', 'sort_order' => 196],
        ['key' => 'finance.reports.export', 'group' => 'finance', 'label' => 'Exportovat reporty', 'sort_order' => 197],

        // Fronty tiketů
        ['key' => 'tickets.queue.housekeeping', 'group' => 'queues', 'label' => 'Úklid', 'sort_order' => 110],
        ['key' => 'tickets.queue.room_delivery', 'group' => 'queues', 'label' => 'Donáška do pokoje', 'sort_order' => 120],
        ['key' => 'tickets.queue.maintenance', 'group' => 'queues', 'label' => 'Údržba', 'sort_order' => 130],
        ['key' => 'tickets.queue.reception', 'group' => 'queues', 'label' => 'Recepce', 'sort_order' => 140],
        ['key' => 'tickets.queue.other', 'group' => 'queues', 'label' => 'Ostatní', 'sort_order' => 150],

        // Akce tiketů
        ['key' => 'tickets.view_all', 'group' => 'ticket_actions', 'label' => 'Vidět všechny tikety', 'description' => 'Ignoruje členství ve frontách', 'sort_order' => 200],
        ['key' => 'tickets.create', 'group' => 'ticket_actions', 'label' => 'Vytvořit tiket', 'sort_order' => 210],
        ['key' => 'tickets.claim', 'group' => 'ticket_actions', 'label' => 'Převzít tiket', 'sort_order' => 220],
        ['key' => 'tickets.reassign', 'group' => 'ticket_actions', 'label' => 'Přeřadit tiket', 'sort_order' => 230],
        ['key' => 'tickets.close', 'group' => 'ticket_actions', 'label' => 'Dokončit / uzavřít tiket', 'sort_order' => 240],
        ['key' => 'tickets.edit', 'group' => 'ticket_actions', 'label' => 'Upravit prioritu a termín', 'sort_order' => 250],

        // Správa
        ['key' => 'users.manage_types', 'group' => 'admin', 'label' => 'Správa typů uživatelů', 'sort_order' => 300],
        ['key' => 'users.manage_users', 'group' => 'admin', 'label' => 'Správa uživatelů', 'sort_order' => 310],
    ],

    'group_labels' => [
        'modules' => 'Moduly',
        'finance' => 'Finance',
        'queues' => 'Fronty tiketů',
        'ticket_actions' => 'Akce tiketů',
        'admin' => 'Administrace',
    ],

    /** Mapování service_module → queue_key */
    'service_module_queues' => [
        'laundry' => 'housekeeping',
        'housekeeping' => 'housekeeping',
        'amenities' => 'room_delivery',
        'room_service' => 'room_delivery',
        'supplies' => 'room_delivery',
        'issues_repairs' => 'maintenance',
        'maintenance' => 'maintenance',
        'check_in_out' => 'reception',
        'reception' => 'reception',
    ],
];
