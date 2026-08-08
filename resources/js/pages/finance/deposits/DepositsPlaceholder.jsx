import React from 'react';
import { Link } from 'react-router-dom';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { formatMoney } from '../../../utils/formatMoney';
import { formatClosingDateTime } from '../financeLabels';
import { PageLoadError } from '../../../components/ui/PageSkeleton';

export function DepositsPlaceholder() {
    const { data, isLoading, error, refetch } = useHttpQuery(['finance-deposits'], '/api/finance/deposits');

    if (error) {
        return <PageLoadError onRetry={refetch} message="Odvody se nepodařilo načíst." />;
    }

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Odvody</h1>
            <p className="text-sm text-gray-500 mb-6">Odvody hotovosti z dokončených uzávěrek.</p>

            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-gray-500">Načítám…</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Datum</th>
                                <th className="px-4 py-3">Dokončeno</th>
                                <th className="px-4 py-3">Recepční</th>
                                <th className="px-4 py-3">Odvod</th>
                                <th className="px-4 py-3">Základ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.deposits || []).map((d) => (
                                <tr key={d.closing_id} className="border-t border-gray-100 dark:border-gray-700">
                                    <td className="px-4 py-3">
                                        <Link to={`/finance/closings/${d.closing_id}`} className="text-orange-600 hover:underline">
                                            {d.business_date}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{formatClosingDateTime(d.completed_at)}</td>
                                    <td className="px-4 py-3">{d.completed_by_name || '—'}</td>
                                    <td className="px-4 py-3 tabular-nums font-medium">{formatMoney(d.amount, d.currency)}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatMoney(d.cash_float, d.currency)}</td>
                                </tr>
                            ))}
                            {(data?.deposits || []).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">Zatím žádné odvody.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
