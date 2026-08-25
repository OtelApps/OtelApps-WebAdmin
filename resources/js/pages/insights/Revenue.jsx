import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import { useModules } from '../../context/ModulesContext';
import { RevenueUpsellPanel } from '../../components/dashboard/RevenueUpsellPanel';
import { formatMoney } from '../../utils/formatMoney';
import { STATUS_CELL } from '../ukoly/ticketStatus';
import { useInsightsData } from './useInsightsData';
import { INSIGHT_SEGMENTS } from './insightsTheme';
import { ChartCard, InsightsShell } from './InsightsShell';
import { DonutChart, RevenueTimelineChart, VerticalBarChart } from './InsightsCharts';

const SEG = INSIGHT_SEGMENTS.find((s) => s.key === 'revenue');

export function Revenue() {
    const navigate = useNavigate();
    const { isEnabled } = useModules();
    const activityEnabled = isEnabled('activity');
    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [revenueError, setRevenueError] = useState(null);

    const { data: txData, loading: txLoading, error: txError, period, setPeriod } = useInsightsData('transactions');

    useEffect(() => {
        if (!activityEnabled) {
            setRevenueLoading(false);
            setRevenueData(null);
            return;
        }
        setRevenueLoading(true);
        setRevenueError(null);
        http.get('/api/activity/revenue-summary', { params: { period } })
            .then((res) => setRevenueData(res.data))
            .catch((err) => {
                setRevenueData(null);
                setRevenueError(
                    err.response?.data?.message ||
                        'Tržby se nepodařilo načíst. Zkontroluj připojení k Activity / Supabase.',
                );
            })
            .finally(() => setRevenueLoading(false));
    }, [activityEnabled, period]);

    const currency = revenueData?.currency ?? txData?.currency ?? 'CZK';
    const loading = txLoading || revenueLoading;
    const error = txError || revenueError;

    return (
        <InsightsShell
            title={SEG.title}
            segmentKey="revenue"
            subtitle={SEG.description}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading}
            error={error}
        >
            {!activityEnabled ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                    Zapněte modul Activity pro přehled tržeb z objednávek hostů.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-1 bg-white dark:bg-gray-700/80 rounded-2xl shadow-md border border-gray-200 dark:border-gray-600 p-6">
                            <RevenueUpsellPanel
                                data={revenueData}
                                loading={revenueLoading}
                                error={null}
                                activityEnabled={activityEnabled}
                                showPeriodLabel
                            />
                            <button
                                type="button"
                                onClick={() => navigate('/ukoly')}
                                className="mt-6 w-full px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium"
                            >
                                Otevřít Úkoly
                            </button>
                        </div>

                        <ChartCard title="Tržby v čase" className="lg:col-span-2">
                            <RevenueTimelineChart
                                data={txData?.revenue_timeline}
                                currency={currency}
                                height={260}
                            />
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                        <ChartCard title="Podíl kategorií">
                            <DonutChart
                                data={(revenueData?.categories ?? []).map((c) => ({
                                    label: c.label,
                                    count: c.amount > 0 ? c.amount : c.count,
                                }))}
                            />
                        </ChartCard>
                        <ChartCard title="Objem podle služby">
                            <VerticalBarChart
                                data={(revenueData?.categories ?? []).map((c) => ({
                                    label: c.label,
                                    count: c.count,
                                }))}
                            />
                        </ChartCard>
                    </div>

                    <ChartCard title="Objednávky v období">
                        {(revenueData?.recent_orders ?? []).length === 0 ? (
                            <p className="text-sm text-gray-500 py-6 text-center">V tomto období nejsou žádné objednávky.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-600 text-xs uppercase text-gray-500">
                                            <th className="py-3 pr-4">Služba</th>
                                            <th className="py-3 pr-4">Požadavek</th>
                                            <th className="py-3 pr-4">Host</th>
                                            <th className="py-3 pr-4">Částka</th>
                                            <th className="py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenueData.recent_orders.map((row) => {
                                            const st = STATUS_CELL[row.status] || STATUS_CELL.new;
                                            return (
                                                <tr
                                                    key={row.id}
                                                    className="border-b border-gray-100 dark:border-gray-600 last:border-0"
                                                >
                                                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200">
                                                        {row.service_label}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                                                        {row.request_text}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                                                        {row.guest_name}
                                                        <span className="text-gray-400"> · {row.room_number}</span>
                                                    </td>
                                                    <td className="py-3 pr-4 font-medium">
                                                        {row.amount > 0
                                                            ? formatMoney(row.amount, currency)
                                                            : '—'}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`text-xs font-medium ${st.textClass}`}>
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </ChartCard>
                </>
            )}
        </InsightsShell>
    );
}
