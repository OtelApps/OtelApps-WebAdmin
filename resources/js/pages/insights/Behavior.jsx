import React from 'react';
import { useInsightsData } from './useInsightsData';
import { INSIGHT_SEGMENTS } from './insightsTheme';
import { ChartCard, InsightsShell, StatCard } from './InsightsShell';
import {
    DonutChart,
    FunnelChart,
    HorizontalBarChart,
    PeakHoursChart,
    VerticalBarChart,
} from './InsightsCharts';

const SEG = INSIGHT_SEGMENTS.find((s) => s.key === 'behavior');

export function Behavior() {
    const { data, loading, error, period, setPeriod } = useInsightsData('behavior');
    const kpis = data?.kpis ?? {};

    return (
        <InsightsShell
            title={SEG.title}
            segmentKey="behavior"
            subtitle={SEG.description}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading}
            error={error}
        >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Požadavky" value={kpis.total_requests ?? 0} accent="blue" />
                <StatCard label="Typů služeb" value={kpis.modules_used ?? 0} accent="violet" />
                <StatCard label="Špička dne" value={kpis.peak_hour ?? '—'} accent="orange" />
                <StatCard label="Mobilní app" value={`${kpis.mobile_share ?? 0} %`} accent="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <ChartCard title="Vytížení podle hodiny" subtitle="Kdy hosté nejčastěji posílají požadavky">
                    <PeakHoursChart data={data?.peak_hours} />
                </ChartCard>
                <ChartCard title="Funnel stavů">
                    <FunnelChart data={data?.status_funnel} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <ChartCard title="Služby / moduly" className="xl:col-span-2">
                    <HorizontalBarChart
                        data={(data?.module_breakdown ?? []).slice(0, 8).map((m) => ({
                            label: m.label,
                            count: m.count,
                        }))}
                    />
                </ChartCard>
                <ChartCard title="Zdroj požadavku">
                    <DonutChart data={data?.by_source} nameKey="label" />
                </ChartCard>
            </div>

            {(data?.priorities ?? []).length > 0 && (
                <ChartCard title="Priorita požadavků" className="mt-6">
                    <VerticalBarChart
                        data={data.priorities.map((p) => ({ label: p.label, count: p.count }))}
                    />
                </ChartCard>
            )}
        </InsightsShell>
    );
}
