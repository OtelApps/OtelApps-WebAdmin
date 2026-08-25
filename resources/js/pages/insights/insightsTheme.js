/** Paleta pro Recharts — konzistentní s brandem OtelApps */
export const CHART_COLORS = [
    '#f97316', // orange-500
    '#8b5cf6', // violet-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#6366f1', // indigo-500
];

export const PERIODS = [
    { key: 'today', label: 'Dnes' },
    { key: 'week', label: 'Týden' },
    { key: 'month', label: 'Měsíc' },
];

/** Segmenty Insights — stejné pořadí a klíče jako v sidebaru (ModuleService) */
export const INSIGHT_SEGMENTS = [
    {
        key: 'users',
        label: 'Users',
        title: 'Users',
        description: 'Aktivní hosté, jazyky a nejaktivnější pokoje',
        path: '/module/insights/users',
        color: 'from-violet-500 to-purple-600',
        accent: 'violet',
    },
    {
        key: 'transactions',
        label: 'Transactions',
        title: 'Transactions',
        description: 'Objem požadavků, stavy a průběh v čase',
        path: '/module/insights/transactions',
        color: 'from-blue-500 to-cyan-600',
        accent: 'blue',
    },
    {
        key: 'revenue',
        label: 'Revenue',
        title: 'Revenue',
        description: 'Tržby a upsell z objednávek Activity',
        path: '/module/insights/revenue',
        color: 'from-orange-500 to-amber-600',
        accent: 'orange',
    },
    {
        key: 'behavior',
        label: 'Behavior',
        title: 'Behavior',
        description: 'Využití služeb, špičky a zdroje požadavků',
        path: '/module/insights/behavior',
        color: 'from-emerald-500 to-teal-600',
        accent: 'emerald',
    },
    {
        key: 'staff',
        label: 'Personál',
        title: 'Personál',
        description: 'Kdo kolik tiketů převzal a dokončil, časy a vytížení',
        path: '/module/insights/staff',
        color: 'from-slate-500 to-indigo-600',
        accent: 'violet',
    },
];

/** @deprecated použij INSIGHT_SEGMENTS */
export const INSIGHT_MODULES = INSIGHT_SEGMENTS;

export const chartTooltipStyle = {
    contentStyle: {
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        fontSize: '13px',
    },
};

export const axisStyle = {
    tick: { fill: '#94a3b8', fontSize: 11 },
    axisLine: { stroke: '#e2e8f0' },
};

export const gridStyle = {
    strokeDasharray: '4 4',
    stroke: '#e2e8f0',
};
