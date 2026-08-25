export const DEFAULT_LAYOUT = [
    'hotel_overview',
    'guest_requests',
    'revenue_upsell',
    'add_content',
    'manage_requests',
];

export const WIDGET_META = {
    hotel_overview: { title: 'Hotel Overview', icon: 'apartment' },
    guest_requests: { title: 'Guest Requests', icon: 'moving' },
    revenue_upsell: { title: 'Revenue & Upsell', icon: 'payments' },
    add_content: { title: 'Add Content', icon: 'article' },
    manage_requests: { title: 'Manage Requests', icon: 'checklist' },
    concierge_inbox: { title: 'Concierge Inbox', icon: 'chat' },
    crm_snapshot: { title: 'CRM Snapshot', icon: 'group' },
    insights_revenue: { title: 'Insights Revenue', icon: 'bar_chart' },
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
