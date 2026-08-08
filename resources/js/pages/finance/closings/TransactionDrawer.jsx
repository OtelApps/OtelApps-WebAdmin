import React from 'react';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { formatMoney } from '../../../utils/formatMoney';
import { formatClosingDateTime } from '../financeLabels';

export function TransactionDrawer({ closingId, line, onClose }) {
    const { data, isLoading } = useHttpQuery(
        ['finance-closing-tx', closingId, line.payment_method_id],
        `/api/finance/closings/${closingId}/transactions`,
        { params: { payment_method_id: line.payment_method_id, currency: line.currency } }
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <button type="button" className="flex-1" aria-label="Zavřít" onClick={onClose} />
            <aside className="w-full max-w-md h-full bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{line.payment_method_label}</h3>
                        <p className="text-sm text-gray-500">
                            {formatMoney(line.expected_amount, line.currency)} · {line.transaction_count} transakcí
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>

                {isLoading ? (
                    <p className="text-sm text-gray-500">Načítám…</p>
                ) : (
                    <ul className="space-y-3">
                        {(data?.transactions || []).map((t) => (
                            <li key={t.id} className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium tabular-nums">{formatMoney(t.amount, t.currency)}</span>
                                    <span className="text-xs text-gray-400">{t.status}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatClosingDateTime(t.paid_at)}
                                    {t.guest_name ? ` · ${t.guest_name}` : ''}
                                    {t.terminal ? ` · ${t.terminal}` : ''}
                                </div>
                                {t.note && <div className="text-xs text-gray-400 mt-0.5">{t.note}</div>}
                            </li>
                        ))}
                        {(data?.transactions || []).length === 0 && (
                            <li className="text-sm text-gray-500">Žádné transakce.</li>
                        )}
                    </ul>
                )}
            </aside>
        </div>
    );
}
