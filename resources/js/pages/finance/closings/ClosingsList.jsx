import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { useAuth } from '../../../context/AuthContext';
import { formatMoney } from '../../../utils/formatMoney';
import http from '../../../lib/http';
import { CLOSING_STATUS_LABELS, formatClosingDateTime, statusTone } from '../financeLabels';
import { PageLoadError } from '../../../components/ui/PageSkeleton';

function toneClasses(tone) {
    const map = {
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        blue: 'bg-sky-50 text-sky-700 border-sky-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return map[tone] || map.gray;
}

export function ClosingsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasPermission } = useAuth();
    const [status, setStatus] = useState('');
    const [hasVariance, setHasVariance] = useState('');

    const params = {};
    if (status) params.status = status;
    if (hasVariance !== '') params.has_variance = hasVariance;

    const { data, isLoading, error, refetch } = useHttpQuery(
        ['finance-closings', status, hasVariance],
        '/api/finance/closings',
        { params }
    );

    const dash = useHttpQuery(['finance-dashboard'], '/api/finance/dashboard');

    const startMutation = useMutation({
        mutationFn: async () => {
            const { data: res } = await http.post('/api/finance/closings');
            return res;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['finance-closings'] });
            queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
            navigate(`/finance/closings/${res.closing.id}`);
        },
    });

    if (error) {
        return <PageLoadError onRetry={refetch} message="Nepodařilo se načíst uzávěrky." />;
    }

    const open = dash.data?.open_closing;
    const canCreate = hasPermission('finance.closing.create');

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Uzávěrky</h1>
                    <p className="text-sm text-gray-500 mt-1">Historie nočních finančních uzávěrek</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {open && (
                        <Link
                            to={`/finance/closings/${open.id}`}
                            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
                        >
                            Pokračovat
                        </Link>
                    )}
                    {canCreate && !open && (
                        <button
                            type="button"
                            disabled={startMutation.isPending}
                            onClick={() => startMutation.mutate()}
                            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-60"
                        >
                            Zahájit uzávěrku
                        </button>
                    )}
                </div>
            </div>

            {startMutation.isError && (
                <p className="mb-4 text-sm text-red-600">
                    {startMutation.error?.response?.data?.message || 'Uzávěrku se nepodařilo zahájit.'}
                </p>
            )}

            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                    <option value="">Všechny stavy</option>
                    {Object.entries(CLOSING_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
                <select
                    value={hasVariance}
                    onChange={(e) => setHasVariance(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                    <option value="">Rozdíl: vše</option>
                    <option value="true">Jen s rozdílem</option>
                    <option value="false">Bez rozdílu</option>
                </select>
            </div>

            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-gray-500">Načítám…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Datum</th>
                                    <th className="px-4 py-3 font-medium">Období</th>
                                    <th className="px-4 py-3 font-medium">Recepční</th>
                                    <th className="px-4 py-3 font-medium">Očekáváno</th>
                                    <th className="px-4 py-3 font-medium">Skutečnost</th>
                                    <th className="px-4 py-3 font-medium">Rozdíl</th>
                                    <th className="px-4 py-3 font-medium">Odvod</th>
                                    <th className="px-4 py-3 font-medium">Stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.closings || []).map((c) => (
                                    <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                                        <td className="px-4 py-3">
                                            <Link to={`/finance/closings/${c.id}`} className="text-orange-600 font-medium hover:underline">
                                                {c.business_date}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {formatClosingDateTime(c.period_start)}
                                            <br />→ {formatClosingDateTime(c.period_end)}
                                        </td>
                                        <td className="px-4 py-3">{c.completed_by_name || c.started_by_name || '—'}</td>
                                        <td className="px-4 py-3 tabular-nums">{formatMoney(c.expected_total, c.primary_currency)}</td>
                                        <td className="px-4 py-3 tabular-nums">{formatMoney(c.actual_total, c.primary_currency)}</td>
                                        <td className="px-4 py-3 tabular-nums">{formatMoney(c.variance_total, c.primary_currency)}</td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {c.deposit_actual != null ? formatMoney(c.deposit_actual, c.primary_currency) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${toneClasses(statusTone(c.status))}`}>
                                                {CLOSING_STATUS_LABELS[c.status] || c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(data?.closings || []).length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                            Žádné uzávěrky neodpovídají filtru.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
