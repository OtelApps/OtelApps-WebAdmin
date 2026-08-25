import React, { useState } from 'react';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { formatMoney } from '../../../utils/formatMoney';
import { formatClosingDateTime } from '../financeLabels';
import { PageLoadError } from '../../../components/ui/PageSkeleton';

export function PaymentsList() {
    const [methodId, setMethodId] = useState('');
    const [status, setStatus] = useState('');

    const params = {};
    if (methodId) params.payment_method_id = methodId;
    if (status) params.status = status;

    const { data, isLoading, error, refetch } = useHttpQuery(
        ['finance-payments', methodId, status],
        '/api/finance/payments',
        { params }
    );

    if (error) {
        return <PageLoadError onRetry={refetch} message="Transakce se nepodařilo načíst." />;
    }

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Transakce</h1>
            <p className="text-sm text-gray-500 mb-6">Platební ledger hotelu — zdroj očekávaných tržeb uzávěrky.</p>

            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                    <option value="">Všechny metody</option>
                    {(data?.methods || []).map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                    <option value="">Všechny stavy</option>
                    <option value="completed">completed</option>
                    <option value="pending">pending</option>
                    <option value="cancelled">cancelled</option>
                    <option value="refunded">refunded</option>
                    <option value="unknown">unknown</option>
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
                                    <th className="px-4 py-3 font-medium">Čas</th>
                                    <th className="px-4 py-3 font-medium">Metoda</th>
                                    <th className="px-4 py-3 font-medium">Host / poznámka</th>
                                    <th className="px-4 py-3 font-medium">Terminál</th>
                                    <th className="px-4 py-3 font-medium">Částka</th>
                                    <th className="px-4 py-3 font-medium">Stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.payments || []).map((p) => (
                                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700">
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatClosingDateTime(p.paid_at)}</td>
                                        <td className="px-4 py-3">{p.payment_method}</td>
                                        <td className="px-4 py-3">
                                            {p.guest_name || '—'}
                                            {p.note ? <div className="text-xs text-gray-400">{p.note}</div> : null}
                                        </td>
                                        <td className="px-4 py-3">{p.terminal || '—'}</td>
                                        <td className="px-4 py-3 tabular-nums font-medium">{formatMoney(p.amount, p.currency)}</td>
                                        <td className="px-4 py-3 text-xs">{p.status}</td>
                                    </tr>
                                ))}
                                {(data?.payments || []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Žádné platby.</td>
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
