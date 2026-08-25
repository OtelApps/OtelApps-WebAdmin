import React from 'react';
import { Link } from 'react-router-dom';
import { NotFound } from '../shared/NotFound';
import { useModules } from '../../context/ModulesContext';
import { useHttpQuery } from '../../hooks/useHttpQuery';
import { HubPageSkeleton } from '../../components/ui/PageSkeleton';
import { CRM_SEGMENTS, SECTION_META } from './crmHubConfig';
import { CrmIcon, CrmNav, StatCard } from './CrmShell';

function SectionCard({ segmentKey, label, preview }) {
    const meta = SECTION_META[segmentKey] ?? {};
    const seg = CRM_SEGMENTS.find((s) => s.key === segmentKey);

    return (
        <Link
            to={seg?.path ?? '#'}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800/90"
        >
            <div className={`h-1.5 bg-gradient-to-r ${meta.gradient ?? 'from-gray-500 to-gray-600'}`} />
            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-md`}
                    >
                        <CrmIcon name={meta.icon ?? 'folder'} className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 transition group-hover:text-orange-500 dark:text-white">
                            {label}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{meta.description}</p>
                    </div>
                </div>
                {preview?.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                        {preview.map((item) => (
                            <li key={item.label} className="flex justify-between text-sm">
                                <span className="text-gray-500">{item.label}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-orange-500">
                    Otevřít <CrmIcon name="arrow_forward" className="text-base" />
                </span>
            </div>
        </Link>
    );
}

export function CrmHub() {
    const { isEnabled } = useModules();
    const enabled = isEnabled('crm');
    const query = useHttpQuery(['crm', 'overview'], '/api/crm/overview', { enabled });

    if (!enabled) return <NotFound />;

    if (query.isPending) {
        return <HubPageSkeleton />;
    }

    const data = query.data;
    const error = query.isError
        ? query.error?.response?.data?.message || 'CRM data se nepodařilo načíst.'
        : null;
    const kpis = data?.kpis ?? {};

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="relative mb-10 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-transparent to-orange-500/5" />
                <div className="relative px-6 py-10 sm:px-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">CRM</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                        Vztahy s{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-orange-500 bg-clip-text text-transparent">
                            hosty
                        </span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-gray-600 dark:text-gray-300">
                        Jednotný pohled na hosty, úkoly recepce, historii komunikace, upozornění a promo akce.
                        Data se propojují z Activity a Concierge.
                    </p>
                </div>
            </header>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20">
                    {error}
                </div>
            )}

            <CrmNav />

            <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard label="Hosté" value={kpis.guests_total ?? 0} accent="violet" />
                <StatCard label="VIP" value={kpis.vip_guests ?? 0} accent="orange" />
                <StatCard label="Aktivní alerty" value={kpis.active_alerts ?? 0} accent="blue" />
                <StatCard label="Otevřené úkoly" value={kpis.open_tasks ?? 0} accent="blue" />
                <StatCard label="Komunikace 7 dní" value={kpis.interactions_7d ?? 0} accent="violet" />
                <StatCard label="Promo akce" value={kpis.active_promotions ?? 0} accent="emerald" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <SectionCard
                    segmentKey="guests"
                    label="Guests"
                    preview={[
                        { label: 'Celkem hostů', value: kpis.guests_total ?? 0 },
                        { label: 'VIP segment', value: kpis.vip_guests ?? 0 },
                    ]}
                />
                <SectionCard
                    segmentKey="alerts"
                    label="Alerts"
                    preview={[
                        { label: 'Aktivní', value: kpis.active_alerts ?? 0 },
                        { label: 'Otevřené požadavky', value: kpis.open_requests ?? 0 },
                        { label: 'Nepřečtený chat', value: kpis.unread_chats ?? 0 },
                    ]}
                />
                <SectionCard
                    segmentKey="promotions"
                    label="Promotions"
                    preview={[
                        { label: 'Aktivní / naplánované', value: kpis.active_promotions ?? 0 },
                    ]}
                />
                <SectionCard
                    segmentKey="tasks"
                    label="Tasks"
                    preview={[
                        { label: 'Otevřené úkoly', value: kpis.open_tasks ?? 0 },
                    ]}
                />
                <SectionCard
                    segmentKey="history"
                    label="History"
                    preview={[
                        { label: 'Záznamy za 7 dní', value: kpis.interactions_7d ?? 0 },
                    ]}
                />
            </div>
        </div>
    );
}
