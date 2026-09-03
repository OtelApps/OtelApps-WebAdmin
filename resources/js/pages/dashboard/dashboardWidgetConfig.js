export const DEFAULT_LAYOUT = [
    'hotel_overview',
    'ops_pulse',
    'guest_requests',
    'concierge_inbox',
    'revenue_upsell',
];

export const WIDGET_META = {
    hotel_overview: { title: 'Přehled hotelu', icon: 'apartment' },
    ops_pulse: { title: 'Směna teď', icon: 'bolt' },
    guest_requests: { title: 'Otevřené úkoly', icon: 'task_alt' },
    revenue_upsell: { title: 'Tržby a upsell', icon: 'payments' },
    add_content: { title: 'Přidat obsah', icon: 'article' },
    manage_requests: { title: 'Správa úkolů', icon: 'checklist' },
    concierge_inbox: { title: 'Concierge inbox', icon: 'chat' },
    crm_snapshot: { title: 'CRM přehled', icon: 'group' },
    insights_revenue: { title: 'Tržby (týden)', icon: 'bar_chart' },
};

export function reorderWidgets(list, fromId, toId) {
    if (fromId === toId) return list;
    const next = [...list];
    const fromIdx = next.indexOf(fromId);
    const toIdx = next.indexOf(toId);
    if (fromIdx < 0 || toIdx < 0) return list;
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, fromId);
    return next;
}
