import React from 'react';
import { Link } from 'react-router-dom';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { formatMoney } from '../../../utils/formatMoney';
import { CLOSING_STATUS_LABELS, formatClosingDateTime } from '../financeLabels';
import { PageLoadError } from '../../../components/ui/PageSkeleton';

export function ReportsPlaceholder() {
    const { data, isLoading, error, refetch } = useHttpQuery(
        ['finance-closings', 'reports'],
        '/api/finance/closings',
        { params: { status: 'completed' } }
    );

    if (error) {
        return <PageLoadError onRetry={refetch} message="Reporty se nepodařilo načíst." />;
    }

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reporty</h1>
            <p className="text-sm text-gray-500 mb-6">
                Printable reporty dokončených uzávěrek. PDF export připravíme později — zatím použijte tisk z detailu.
            </p>

            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-gray-500">Načítám…</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Datum</th>
                                <th className="px-4 py-3">Dokončeno</th>
                                <th className="px-4 py-3">Tržby</th>
                                <th className="px-4 py-3">Rozdíl</th>
                                <th className="px-4 py-3">Stav</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.closings || []).map((c) => (
                                <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                                    <td className="px-4 py-3">
                                        <Link to={`/finance/closings/${c.id}`} className="text-orange-600 hover:underline font-medium">
                                            {c.business_date}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{formatClosingDateTime(c.completed_at)}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatMoney(c.expected_total, c.primary_currency)}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatMoney(c.variance_total, c.primary_currency)}</td>
                                    <td className="px-4 py-3">{CLOSING_STATUS_LABELS[c.status] || c.status}</td>
                                </tr>
                            ))}
                            {(data?.closings || []).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">Zatím žádné dokončené uzávěrky.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
