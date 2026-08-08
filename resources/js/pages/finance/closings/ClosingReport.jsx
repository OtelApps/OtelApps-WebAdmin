import React from 'react';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { formatMoney } from '../../../utils/formatMoney';
import { formatClosingDateTime } from '../financeLabels';
import { PageLoadError } from '../../../components/ui/PageSkeleton';

export function ClosingReport({ closingId, onClose }) {
    const { data, isLoading, error, refetch } = useHttpQuery(
        ['finance-closing-report', closingId],
        `/api/finance/closings/${closingId}/report`
    );

    if (isLoading) {
        return <div className="rounded-2xl bg-white p-8 text-gray-500">Načítám report…</div>;
    }
    if (error) {
        return <PageLoadError onRetry={refetch} message="Report se nepodařilo načíst." />;
    }

    const report = data?.report || {};
    const currency = report.primary_currency || 'CZK';

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm print:border-0 print:shadow-none">
            <div className="flex items-start justify-between gap-4 mb-6 print:hidden">
                <h2 className="text-xl font-semibold">Report uzávěrky</h2>
                <div className="flex gap-2">
                    <button type="button" onClick={() => window.print()} className="px-3 py-1.5 rounded-lg border text-sm">
                        Tisk / PDF
                    </button>
                    <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border text-sm">
                        Zavřít
                    </button>
                </div>
            </div>

            <div className="space-y-1 mb-6">
                <p className="text-2xl font-bold">{report.hotel?.name}</p>
                <p className="text-sm text-gray-500">
                    Business date {report.business_date} · {formatClosingDateTime(report.period_start)} → {formatClosingDateTime(report.period_end)}
                </p>
                <p className="text-sm text-gray-500">
                    Provedl: {report.completed_by_name || report.started_by_name || '—'}
                    {report.completed_at ? ` · ${formatClosingDateTime(report.completed_at)}` : ''}
                </p>
                {data?.from_snapshot && <p className="text-xs text-emerald-600">Immutable snapshot</p>}
            </div>

            <dl className="grid sm:grid-cols-2 gap-3 mb-6 text-sm">
                <Stat label="Tržby" value={formatMoney(report.expected_total, currency)} />
                <Stat label="Skutečnost" value={formatMoney(report.actual_total, currency)} />
                <Stat label="Rozdíl" value={formatMoney(report.variance_total, currency)} />
                <Stat label="Odvod" value={formatMoney(report.deposit_actual, currency)} />
                <Stat label="Základ pokladny" value={formatMoney(report.cash_float, currency)} />
            </dl>

            <h3 className="font-semibold mb-2">Platební metody</h3>
            <table className="w-full text-sm mb-6">
                <thead className="text-gray-500">
                    <tr>
                        <th className="text-left py-2">Metoda</th>
                        <th className="text-right py-2">Očekáváno</th>
                        <th className="text-right py-2">Skutečnost</th>
                        <th className="text-right py-2">Rozdíl</th>
                    </tr>
                </thead>
                <tbody>
                    {(report.payment_lines || []).map((l, i) => (
                        <tr key={i} className="border-t border-gray-100">
                            <td className="py-2">{l.payment_method_label}</td>
                            <td className="py-2 text-right tabular-nums">{formatMoney(l.expected_amount, l.currency)}</td>
                            <td className="py-2 text-right tabular-nums">{formatMoney(l.actual_amount, l.currency)}</td>
                            <td className="py-2 text-right tabular-nums">{formatMoney(l.variance, l.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {data?.handover_summary && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4">
                    <h3 className="font-semibold mb-2">Předání směny</h3>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{data.handover_summary}</pre>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
        </div>
    );
}
