import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHttpQuery } from '../../hooks/useHttpQuery';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/formatMoney';
import http from '../../lib/http';
import { CLOSING_STATUS_LABELS, formatClosingDateTime, statusTone } from './financeLabels';
import { PageLoadError } from '../../components/ui/PageSkeleton';

function toneClasses(tone) {
    const map = {
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        blue: 'bg-sky-50 text-sky-700 border-sky-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return map[tone] || map.gray;
}

export function FinanceDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasPermission } = useAuth();
    const { data, isLoading, error, refetch } = useHttpQuery(['finance-dashboard'], '/api/finance/dashboard');

    const startMutation = useMutation({
        mutationFn: async () => {
            const { data: res } = await http.post('/api/finance/closings');
            return res;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['finance-closings'] });
            navigate(`/finance/closings/${res.closing.id}`);
        },
    });

    if (isLoading) {
        return (
            <div className="max-w-screen-2xl mx-auto px-4 py-10">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (error) {
        return <PageLoadError onRetry={refetch} message="Nepodařilo se načíst Finance." />;
    }

    const today = data?.today;
    const open = data?.open_closing;
    const kpis = data?.manager_kpis?.last_7_days;
    const currency = data?.settings?.primary_currency || 'CZK';
    const canCreate = hasPermission('finance.closing.create');

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance</h1>
                <p className="text-sm text-gray-500 mt-1">Noční uzávěrka, transakce a odvody — bez Excelu.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Dnešní stav</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{today?.message}</p>

                    {open && (
                        <div className="mb-4 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
                            Máte rozpracovanou uzávěrku ({CLOSING_STATUS_LABELS[open.status] || open.status}).
                            <Link to={`/finance/closings/${open.id}`} className="ml-2 font-semibold underline">
                                Pokračovat
                            </Link>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {open ? (
                            <Link
                                to={`/finance/closings/${open.id}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
                            >
                                Pokračovat v uzávěrce
                            </Link>
                        ) : canCreate && !today?.completed ? (
                            <button
                                type="button"
                                disabled={startMutation.isPending}
                                onClick={() => startMutation.mutate()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-60"
                            >
                                {startMutation.isPending ? 'Zahajuji…' : 'Zahájit uzávěrku'}
                            </button>
                        ) : null}
                        <Link
                            to="/module/finance/finance_closings"
                            className="inline-flex items-center px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                        >
                            Historie uzávěrek
                        </Link>
                    </div>

                    {startMutation.isError && (
                        <p className="mt-3 text-sm text-red-600">
                            {startMutation.error?.response?.data?.message || 'Uzávěrku se nepodařilo zahájit.'}
                        </p>
                    )}
                </div>

                <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Posledních 7 dní</p>
                    <dl className="space-y-3">
                        <div className="flex justify-between gap-3">
                            <dt className="text-sm text-gray-500">Tržby</dt>
                            <dd className="font-semibold tabular-nums">{formatMoney(kpis?.expected_total, currency)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-sm text-gray-500">Rozdíly</dt>
                            <dd className="font-semibold tabular-nums text-orange-600">
                                {formatMoney(kpis?.variance_total, currency)}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-sm text-gray-500">Uzávěrky s rozdílem</dt>
                            <dd className="font-semibold tabular-nums">{kpis?.with_variance_count ?? 0}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-sm text-gray-500">Odvody</dt>
                            <dd className="font-semibold tabular-nums">{formatMoney(kpis?.deposit_total, currency)}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <RecentClosings />
        </div>
    );
}

function RecentClosings() {
    const { data, isLoading } = useHttpQuery(['finance-closings', 'recent'], '/api/finance/closings');

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">Poslední uzávěrky</h2>
                <Link to="/module/finance/finance_closings" className="text-sm text-orange-600 hover:underline">
                    Zobrazit vše
                </Link>
            </div>
            {isLoading ? (
                <div className="p-6 text-sm text-gray-500">Načítám…</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Datum</th>
                                <th className="px-4 py-3 font-medium">Recepční</th>
                                <th className="px-4 py-3 font-medium">Očekáváno</th>
                                <th className="px-4 py-3 font-medium">Skutečnost</th>
                                <th className="px-4 py-3 font-medium">Rozdíl</th>
                                <th className="px-4 py-3 font-medium">Stav</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.closings || []).slice(0, 8).map((c) => (
                                <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-700/40">
                                    <td className="px-4 py-3">
                                        <Link to={`/finance/closings/${c.id}`} className="text-orange-600 hover:underline font-medium">
                                            {c.business_date}
                                        </Link>
                                        <div className="text-xs text-gray-400">{formatClosingDateTime(c.completed_at || c.started_at)}</div>
                                    </td>
                                    <td className="px-4 py-3">{c.completed_by_name || c.started_by_name || '—'}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatMoney(c.expected_total, c.primary_currency)}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatMoney(c.actual_total, c.primary_currency)}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatMoney(c.variance_total, c.primary_currency)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${toneClasses(statusTone(c.status))}`}>
                                            {CLOSING_STATUS_LABELS[c.status] || c.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(data?.closings || []).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Zatím žádné uzávěrky.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
