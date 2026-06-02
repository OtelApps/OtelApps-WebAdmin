import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import { RevenueUpsellPanel } from '../../components/RevenueUpsellPanel';
import { formatMoney } from '../../utils/formatMoney';
import { STATUS_CELL } from '../activity/activityStatus';

const PERIODS = [
    { key: 'today', label: 'Dnes' },
    { key: 'week', label: 'Týden' },
    { key: 'month', label: 'Měsíc' },
];

export function Revenue() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState('today');
    const [activityEnabled, setActivityEnabled] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        http.get('/api/modules/check/activity')
            .then((res) => setActivityEnabled(Boolean(res.data.enabled)))
            .catch(() => setActivityEnabled(false));
    }, []);

    useEffect(() => {
        if (!activityEnabled) {
            setLoading(false);
            setData(null);
            return;
        }
        setLoading(true);
        setError(null);
        http.get('/api/activity/revenue-summary', { params: { period } })
            .then((res) => setData(res.data))
            .catch((err) => {
                setData(null);
                setError(
                    err.response?.data?.message ||
                        'Tržby se nepodařilo načíst. Zkontroluj připojení k Activity / Supabase.',
                );
            })
            .finally(() => setLoading(false));
    }, [activityEnabled, period]);

    const currency = data?.currency ?? 'CZK';

    return (
        <div className="max-w-screen-2xl mx-auto px-0.5 sm:px-1 lg:px-1.5 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue & Upsell</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Tržby a kategorie služeb z objednávek v Activity (metadata: total_amount, položky s unit_price).
                    </p>
                </div>
                <div className="flex gap-2">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                period === p.key
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-6">
                    <RevenueUpsellPanel
                        data={data}
                        loading={loading}
                        error={error}
                        activityEnabled={activityEnabled}
                        showPeriodLabel
                    />
                    <button
                        type="button"
                        disabled={!activityEnabled}
                        onClick={() => navigate('/activity')}
                        className="mt-6 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                    >
                        Otevřít Activity
                    </button>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Objednávky v období</h2>
                    {!activityEnabled ? (
                        <p className="text-sm text-gray-500">Activity není dostupné.</p>
                    ) : loading ? (
                        <p className="text-sm text-gray-500">Načítání…</p>
                    ) : (data?.recent_orders ?? []).length === 0 ? (
                        <p className="text-sm text-gray-500">V tomto období nejsou žádné objednávky.</p>
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
                                    {data.recent_orders.map((row) => {
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
                </div>
            </div>
        </div>
    );
}
