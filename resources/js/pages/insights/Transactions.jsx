import React from 'react';
import { useInsightsData } from './useInsightsData';
import { INSIGHT_SEGMENTS } from './insightsTheme';
import { ChartCard, InsightsShell, StatCard } from './InsightsShell';
import { DonutChart, RevenueTimelineChart, TimelineAreaChart } from './InsightsCharts';
import { formatMoney } from '../../utils/formatMoney';
import { STATUS_CELL } from '../activity/activityStatus';

const SEG = INSIGHT_SEGMENTS.find((s) => s.key === 'transactions');

export function Transactions() {
    const { data, loading, error, period, setPeriod } = useInsightsData('transactions');
    const kpis = data?.kpis ?? {};
    const currency = data?.currency ?? 'CZK';

    return (
        <InsightsShell
            title={SEG.title}
            segmentKey="transactions"
            subtitle={SEG.description}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading}
            error={error}
        >
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Požadavky celkem" value={kpis.total_requests ?? 0} accent="blue" />
                <StatCard label="Placené objednávky" value={kpis.paid_orders ?? 0} accent="violet" />
                <StatCard
                    label="Tržby"
                    value={formatMoney(kpis.revenue ?? 0, currency)}
                    accent="orange"
                />
                <StatCard
                    label="Průměrná objednávka"
                    value={formatMoney(kpis.avg_order ?? 0, currency)}
                    accent="orange"
                />
                <StatCard label="Vyřešeno" value={`${kpis.solved_rate ?? 0} %`} accent="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <ChartCard title="Objem požadavků">
                    <TimelineAreaChart data={data?.volume_timeline} />
                </ChartCard>
                <ChartCard title="Tržby v čase">
                    <RevenueTimelineChart data={data?.revenue_timeline} currency={currency} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <ChartCard title="Stavy požadavků">
                    <DonutChart data={data?.status_breakdown} />
                </ChartCard>
                <ChartCard title="Kategorie služeb" className="xl:col-span-2">
                    {(data?.categories ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Žádné kategorie s cenou.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.categories.map((cat, i) => (
                                <div key={cat.key} className="flex items-center gap-3">
                                    <span className="w-32 shrink-0 text-sm text-gray-600 dark:text-gray-300 truncate">
                                        {cat.label}
                                    </span>
                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full"
                                            style={{ width: `${Math.max(cat.percent ?? 0, 4)}%` }}
                                        />
                                    </div>
                                    <span className="w-24 text-right text-sm font-medium tabular-nums">
                                        {cat.amount > 0 ? formatMoney(cat.amount, currency) : `${cat.count}×`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ChartCard>
            </div>

            {(data?.recent_orders ?? []).length > 0 && (
                <ChartCard title="Poslední objednávky" className="mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600 text-xs uppercase text-gray-500">
                                    <th className="py-3 pr-4">Služba</th>
                                    <th className="py-3 pr-4">Host</th>
                                    <th className="py-3 pr-4">Částka</th>
                                    <th className="py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent_orders.map((row) => {
                                    const st = STATUS_CELL[row.status] || STATUS_CELL.new;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-100 dark:border-gray-600 last:border-0">
                                            <td className="py-3 pr-4 font-medium">{row.service_label}</td>
                                            <td className="py-3 pr-4 text-gray-500">
                                                {row.guest_name} · {row.room_number}
                                            </td>
                                            <td className="py-3 pr-4 font-medium">
                                                {row.amount > 0 ? formatMoney(row.amount, currency) : '—'}
                                            </td>
                                            <td className="py-3">
                                                <span className={`text-xs font-medium ${st.textClass}`}>{st.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            )}
        </InsightsShell>
    );
}
