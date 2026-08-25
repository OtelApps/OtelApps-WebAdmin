import React from 'react';
import { useInsightsData } from './useInsightsData';
import { INSIGHT_SEGMENTS } from './insightsTheme';
import { ChartCard, InsightsShell, StatCard } from './InsightsShell';
import { DonutChart, HorizontalBarChart, TimelineAreaChart } from './InsightsCharts';

const SEG = INSIGHT_SEGMENTS.find((s) => s.key === 'users');

export function Users() {
    const { data, loading, error, period, setPeriod } = useInsightsData('users');
    const kpis = data?.kpis ?? {};

    return (
        <InsightsShell
            title={SEG.title}
            segmentKey="users"
            subtitle={SEG.description}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading}
            error={error}
        >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Unikátní hosté" value={kpis.unique_guests ?? 0} accent="violet" />
                <StatCard label="S požadavkem" value={kpis.with_requests ?? 0} accent="blue" />
                <StatCard label="S chatem" value={kpis.with_chat ?? 0} accent="emerald" />
                <StatCard label="Vracející se" value={kpis.returning ?? 0} hint="více než 1 interakce" accent="orange" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <ChartCard title="Jazyky hostů">
                    <DonutChart data={data?.locale_breakdown} nameKey="label" />
                </ChartCard>
                <ChartCard title="Aktivní hosté v čase">
                    <TimelineAreaChart data={data?.engagement_timeline} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ChartCard title="Nejaktivnější pokoje">
                    <HorizontalBarChart
                        data={(data?.top_rooms ?? []).map((r) => ({
                            label: `Pokoj ${r.room}`,
                            count: r.score,
                        }))}
                    />
                </ChartCard>
                <ChartCard title="Top hosté" subtitle="Skóre = požadavky + 2× chat">
                    {(data?.top_guests ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Zatím žádní hosté.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-600 text-xs uppercase text-gray-500">
                                        <th className="py-2 pr-3 text-left">Host</th>
                                        <th className="py-2 pr-3 text-left">Pokoj</th>
                                        <th className="py-2 pr-3 text-right">Pož.</th>
                                        <th className="py-2 text-right">Chat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.top_guests.map((g) => (
                                        <tr key={g.key} className="border-b border-gray-100 dark:border-gray-600 last:border-0">
                                            <td className="py-2.5 pr-3 font-medium text-gray-800 dark:text-gray-200">
                                                {g.name}
                                            </td>
                                            <td className="py-2.5 pr-3 text-gray-500">{g.room}</td>
                                            <td className="py-2.5 pr-3 text-right tabular-nums">{g.requests}</td>
                                            <td className="py-2.5 text-right tabular-nums">{g.conversations}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ChartCard>
            </div>
        </InsightsShell>
    );
}
