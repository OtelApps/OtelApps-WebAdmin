import React from 'react';
import { PERIODS } from './insightsTheme';
import { InsightsNav } from './InsightsNav';

export function InsightsShell({
    title,
    subtitle,
    segmentKey,
    period,
    onPeriodChange,
    loading,
    error,
    children,
}) {
    return (
        <div className="max-w-screen-2xl mx-auto px-0.5 sm:px-1 lg:px-1.5 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-1">
                        Insights{segmentKey ? ` · ${title}` : ''}
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{subtitle}</p>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => onPeriodChange(p.key)}
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

            {loading ? (
                <div className="flex items-center justify-center min-h-[320px]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Načítání analytiky…</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </div>
    );
}

export function StatCard({ label, value, hint, accent = 'orange' }) {
    const accents = {
        orange: 'from-orange-500/10 to-amber-500/5 border-orange-200 dark:border-orange-800/50',
        violet: 'from-violet-500/10 to-purple-500/5 border-violet-200 dark:border-violet-800/50',
        blue: 'from-blue-500/10 to-cyan-500/5 border-blue-200 dark:border-blue-800/50',
        emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-200 dark:border-emerald-800/50',
    };

    return (
        <div
            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${accents[accent] ?? accents.orange}`}
        >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
            {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

export function ChartCard({ title, subtitle, children, className = '' }) {
    return (
        <div
            className={`bg-white dark:bg-gray-700/80 rounded-2xl shadow-md border border-gray-200 dark:border-gray-600 p-5 ${className}`}
        >
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

export function EmptyChart({ message = 'Pro zvolené období nejsou data.' }) {
    return (
        <div className="flex items-center justify-center h-[240px] text-sm text-gray-400 dark:text-gray-500">
            {message}
        </div>
    );
}
