export const CRM_SEGMENTS = [
    { key: 'guests', label: 'Guests', path: '/module/crm/guests' },
    { key: 'alerts', label: 'Alerts', path: '/module/crm/alerts' },
    { key: 'promotions', label: 'Promotions', path: '/module/crm/promotions' },
    { key: 'tasks', label: 'Tasks', path: '/module/crm/tasks' },
    { key: 'history', label: 'History', path: '/module/crm/history' },
];

export const SECTION_META = {
    guests: {
        icon: 'groups',
        gradient: 'from-violet-500 to-purple-600',
        description: 'Profily hostů z Activity a Concierge — segmenty, GDPR, pobyt a věrnost.',
    },
    alerts: {
        icon: 'notifications_active',
        gradient: 'from-amber-500 to-orange-600',
        description: 'Upozornění pro recepci — otevřené požadavky, chat a vlastní alerty.',
    },
    promotions: {
        icon: 'campaign',
        gradient: 'from-emerald-500 to-teal-600',
        description: 'Promo akce a nabídky cílené na segmenty hostů v mobilní app.',
    },
    tasks: {
        icon: 'task_alt',
        gradient: 'from-blue-500 to-indigo-600',
        description: 'Úkoly a follow-up pro recepci — telefonáty, VIP servis, check-out.',
    },
    history: {
        icon: 'history',
        gradient: 'from-rose-500 to-pink-600',
        description: 'Historie komunikace s hosty — hovory, e-maily, poznámky a požadavky.',
    },
};

export const GUEST_SEGMENTS = [
    { key: 'all', label: 'Všichni' },
    { key: 'standard', label: 'Standard' },
    { key: 'vip', label: 'VIP' },
    { key: 'corporate', label: 'Corporate' },
    { key: 'returning', label: 'Vracející se' },
];

export const TASK_STATUS = {
    open: { label: 'Otevřeno', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
    done: { label: 'Hotovo', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
    cancelled: { label: 'Zrušeno', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

export const TASK_PRIORITY = {
    urgent: { label: 'Urgentní', className: 'text-red-600 dark:text-red-400' },
    high: { label: 'Vysoká', className: 'text-orange-600 dark:text-orange-400' },
    normal: { label: 'Normální', className: 'text-gray-600 dark:text-gray-300' },
    low: { label: 'Nízká', className: 'text-gray-400' },
};

export const TASK_TYPES = [
    { key: 'follow_up', label: 'Follow-up' },
    { key: 'call', label: 'Telefonát' },
    { key: 'email', label: 'E-mail' },
    { key: 'checkout', label: 'Check-out' },
    { key: 'vip_service', label: 'VIP servis' },
    { key: 'other', label: 'Jiné' },
];

export const INTERACTION_CHANNELS = [
    { key: 'note', label: 'Poznámka' },
    { key: 'phone', label: 'Telefon' },
    { key: 'email', label: 'E-mail' },
    { key: 'reception', label: 'Recepce' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'sms', label: 'SMS' },
    { key: 'in_person', label: 'Osobně' },
];

export const CHANNEL_ICONS = {
    note: 'sticky_note_2',
    phone: 'call',
    email: 'mail',
    reception: 'desk',
    whatsapp: 'chat',
    sms: 'sms',
    in_person: 'person',
    activity: 'room_service',
    request: 'room_service',
    interaction: 'forum',
    task: 'task_alt',
};

export const ALERT_SEVERITY = {
    critical: { label: 'Kritické', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
    warning: { label: 'Varování', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
    info: { label: 'Info', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
};

export const PROMO_STATUS = {
    draft: { label: 'Koncept', className: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200' },
    scheduled: { label: 'Naplánováno', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
    active: { label: 'Aktivní', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
    ended: { label: 'Ukončeno', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

export const SEGMENT_BADGE = {
    standard: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
    vip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    corporate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    returning: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
};

export function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}
