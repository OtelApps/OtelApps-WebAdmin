import React from 'react';
import { useInsightsData } from './useInsightsData';
import { INSIGHT_SEGMENTS } from './insightsTheme';
import { ChartCard, InsightsShell, StatCard } from './InsightsShell';
import {
    DonutChart,
    GroupedBarChart,
    HorizontalBarChart,
    PeakHoursChart,
    TimelineAreaChart,
} from './InsightsCharts';

const SEG = INSIGHT_SEGMENTS.find((s) => s.key === 'staff') ?? {
    title: 'Personál',
    description: 'Kdo kolik tiketů převzal a dokončil, časy a vytížení',
};

export function Staff() {
    const { data, loading, error, period, setPeriod } = useInsightsData('staff');
    const kpis = data?.kpis ?? {};
    const people = data?.staff ?? [];

    return (
        <InsightsShell
            title={SEG.title}
            segmentKey="staff"
            subtitle={SEG.description}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading}
            error={error}
        >
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                <StatCard label="Aktivní personál" value={kpis.active_staff ?? 0} accent="violet" />
                <StatCard label="Vytvořené" value={kpis.created ?? 0} hint="tikety v období" accent="blue" />
                <StatCard label="Převzaté" value={kpis.claimed ?? 0} accent="orange" />
                <StatCard label="Dokončené" value={kpis.completed ?? 0} accent="emerald" />
                <StatCard
                    label="Průměr do hotovo"
                    value={kpis.avg_complete_label ?? '—'}
                    hint="od vytvoření"
                    accent="orange"
                />
                <StatCard
                    label="Otevřené teď"
                    value={kpis.open_now ?? 0}
                    hint={`${kpis.unassigned ?? 0} nepřiřazených`}
                    accent="violet"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <ChartCard title="Převzaté vs. dokončené" subtitle="Podle člena personálu">
                    <GroupedBarChart data={data?.completed_by_staff} />
                </ChartCard>
                <ChartCard title="Dokončení v čase">
                    <TimelineAreaChart data={data?.completions_timeline} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <ChartCard title="Fronty dokončených tiketů">
                    <DonutChart data={data?.by_queue} />
                </ChartCard>
                <ChartCard title="Aktuální vytížení" subtitle="Otevřené tikety na osobu">
                    <HorizontalBarChart data={data?.workload} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
                <ChartCard title="Kdy personál pracuje" subtitle="Převzetí a dokončení podle hodiny">
                    <PeakHoursChart data={data?.peak_hours} />
                </ChartCard>
            </div>

            <ChartCard title="Výkon personálu" subtitle="Počty tiketů a průměrné časy ve zvoleném období">
                {people.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">
                        Za zvolené období zatím nikdo nepracoval s tikety.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600 text-xs uppercase text-gray-500">
                                    <th className="py-2 pr-3 text-left">Jméno</th>
                                    <th className="py-2 pr-3 text-right">Vytvořil</th>
                                    <th className="py-2 pr-3 text-right">Převzal</th>
                                    <th className="py-2 pr-3 text-right">Dokončil</th>
                                    <th className="py-2 pr-3 text-right">Zamítl</th>
                                    <th className="py-2 pr-3 text-right">Přeřadil</th>
                                    <th className="py-2 pr-3 text-right">Otevřené</th>
                                    <th className="py-2 pr-3 text-right">Ø převzetí</th>
                                    <th className="py-2 text-right">Ø hotovo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {people.map((p) => (
                                    <tr
                                        key={p.key}
                                        className="border-b border-gray-100 dark:border-gray-600 last:border-0"
                                    >
                                        <td className="py-2.5 pr-3 font-medium text-gray-800 dark:text-gray-200">
                                            {p.name}
                                        </td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums">{p.created}</td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums">{p.claimed}</td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">
                                            {p.completed}
                                        </td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums">{p.rejected}</td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums">{p.reassigned}</td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums">{p.open_assigned}</td>
                                        <td className="py-2.5 pr-3 text-right tabular-nums text-gray-500">
                                            {p.avg_claim_label}
                                        </td>
                                        <td className="py-2.5 text-right tabular-nums text-gray-500">
                                            {p.avg_complete_label}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ChartCard>
        </InsightsShell>
    );
}
