import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CRM_SEGMENTS } from './crmHubConfig';

export function CrmNav() {
    const location = useLocation();
    const isOverview = location.pathname === '/crm';
    const isActive = (key) => location.pathname === `/module/crm/${key}`;

    return (
        <nav className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-700">
            <Link
                to="/crm"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isOverview
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                }`}
            >
                Přehled
            </Link>
            {CRM_SEGMENTS.map((seg) => (
                <Link
                    key={seg.key}
                    to={seg.path}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        isActive(seg.key)
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                    {seg.label}
                </Link>
            ))}
        </nav>
    );
}

export function CrmShell({ title, segmentKey, subtitle, loading, error, children, actions = null }) {
    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
                        CRM{segmentKey ? ` · ${title}` : ''}
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    {subtitle && (
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                </div>
                {actions}
            </div>
            <CrmNav />
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    {error}
                </div>
            )}
            {loading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
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
        emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-200 dark:border-emerald-800/50',
        blue: 'from-blue-500/10 to-cyan-500/5 border-blue-200 dark:border-blue-800/50',
    };

    return (
        <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${accents[accent] ?? accents.orange}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
    );
}

export function CrmIcon({ name, className = '' }) {
    return (
        <span className={`material-symbols-outlined ${className}`} aria-hidden>
            {name}
        </span>
    );
}
