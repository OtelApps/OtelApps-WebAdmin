import React from 'react';
import { Link } from 'react-router-dom';
import { useInsightsData } from './useInsightsData';
import { INSIGHT_SEGMENTS, PERIODS } from './insightsTheme';
import { InsightsNav } from './InsightsNav';
import { StatCard } from './InsightsShell';
import { formatMoney } from '../../utils/formatMoney';

function SegmentPreview({ segment, metrics, loading }) {
    return (
        <Link
            to={segment.path}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/80 p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 block"
        >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${segment.color}`} />
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition">
                        {segment.label}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{segment.description}</p>
                </div>
                <span className="text-orange-500 text-sm font-medium shrink-0 opacity-0 group-hover:opacity-100 transition">
                    Detail →
                </span>
            </div>
            {loading ? (
                <div className="h-16 flex items-center">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((m) => (
                        <div key={m.label} className="rounded-xl bg-gray-50 dark:bg-gray-600/40 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {m.label}
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{m.value}</p>
                        </div>
                    ))}
                </div>
            )}
        </Link>
    );
}

export function InsightsHub() {
    const { data, loading, error, period, setPeriod } = useInsightsData('overview');

    const kpis = data?.kpis ?? {};
    const currency = data?.currency ?? 'CZK';
    const topModule = data?.top_modules?.[0];

    const segmentMetrics = {
        users: [
            { label: 'Aktivní hosté', value: kpis.unique_guests ?? 0 },
            { label: 'Chat vlákna', value: kpis.conversations ?? 0 },
        ],
        transactions: [
            { label: 'Požadavky', value: kpis.requests ?? 0 },
            { label: 'Otevřené', value: kpis.open_requests ?? 0 },
        ],
        revenue: [
            { label: 'Tržby', value: formatMoney(kpis.revenue ?? 0, currency) },
            { label: 'Zprávy v chatu', value: kpis.messages ?? 0 },
        ],
        behavior: [
            { label: 'Top služba', value: topModule?.label ?? '—' },
            { label: 'Počet', value: topModule?.count ?? 0 },
        ],
    };

    return (
        <div className="max-w-screen-2xl mx-auto px-0.5 sm:px-1 lg:px-1.5 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insights</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                        Přehled rozdělený do sekcí sidebaru — Users, Transactions, Revenue a Behavior.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                period === p.key
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <InsightsNav />

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Hosté celkem" value={kpis.unique_guests ?? 0} accent="violet" />
                    <StatCard label="Požadavky" value={kpis.requests ?? 0} accent="blue" />
                    <StatCard label="Tržby" value={formatMoney(kpis.revenue ?? 0, currency)} accent="orange" />
                    <StatCard label="Chat zprávy" value={kpis.messages ?? 0} accent="emerald" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INSIGHT_SEGMENTS.map((seg) => (
                    <SegmentPreview
                        key={seg.key}
                        segment={seg}
                        metrics={segmentMetrics[seg.key] ?? []}
                        loading={loading}
                    />
                ))}
            </div>
        </div>
    );
}
