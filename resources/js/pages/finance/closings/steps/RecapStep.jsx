import React, { useState } from 'react';
import { formatMoney } from '../../../../utils/formatMoney';

export function RecapStep({
    closing,
    settings,
    varianceLines,
    canComplete,
    editable,
    busy,
    error,
    onComplete,
    onBack,
}) {
    const [confirm, setConfirm] = useState(false);
    const currency = closing.primary_currency || 'CZK';
    const reasonLabels = settings?.variance_reasons || {};

    if (closing.status === 'completed' && !editable) {
        return (
            <div className="max-w-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 mb-4">
                    ✓ Uzávěrka je dokončena a uzamčena.
                </div>
                {closing.handover_summary && (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4">
                        {closing.handover_summary}
                    </pre>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Uzávěrka {closing.business_date}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Zkontrolujte souhrn a dokončete uzávěrku.</p>

            <dl className="space-y-3 mb-6 text-sm">
                <Row label="Tržby" value={formatMoney(closing.expected_total, currency)} />
                <Row label="Skutečnost" value={formatMoney(closing.actual_total, currency)} />
                <Row label="Rozdíl" value={formatMoney(closing.variance_total, currency)} accent />
                <Row
                    label="Hotovost"
                    value={formatMoney(
                        (closing.payment_lines || []).find((l) => l.is_cash)?.actual_amount ?? 0,
                        currency
                    )}
                />
                <Row label="Odvod" value={formatMoney(closing.deposit_actual ?? 0, currency)} />
                <Row label="Ponecháno v pokladně" value={formatMoney(closing.cash_float, currency)} />
                <Row label="Provedl" value={closing.started_by_name || '—'} />
            </dl>

            {varianceLines.length > 0 && (
                <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                    <p className="text-sm font-medium text-orange-900 mb-2">Rozdíly</p>
                    <ul className="space-y-1 text-sm text-orange-800">
                        {varianceLines.map((l) => (
                            <li key={l.id}>
                                {l.payment_method_label}: {formatMoney(l.variance, l.currency)}
                                {l.variance_reason ? ` — ${reasonLabels[l.variance_reason] || l.variance_reason}` : ''}
                                {l.variance_note ? ` (${l.variance_note})` : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900 mb-6">
                Uzávěrka bude po dokončení uzamčena a bude dostupná pouze pro čtení.
            </div>

            {error && (
                <p className="text-sm text-red-600 mb-4">
                    {error?.response?.data?.message
                        || Object.values(error?.response?.data?.errors || {})?.[0]?.[0]
                        || 'Dokončení selhalo.'}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onBack} className="px-4 py-2.5 rounded-xl border border-gray-300">
                    Zpět
                </button>
                <button
                    type="button"
                    disabled={!editable || !canComplete || busy}
                    onClick={() => setConfirm(true)}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                    Dokončit uzávěrku
                </button>
            </div>

            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">Dokončit uzávěrku?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Po dokončení budou hodnoty uzamčeny a vytvoří se finální report.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setConfirm(false)} className="px-4 py-2 rounded-lg border">
                                Zpět
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                    await onComplete();
                                    setConfirm(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium"
                            >
                                Dokončit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Row({ label, value, accent }) {
    return (
        <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            <dt className="text-gray-500">{label}</dt>
            <dd className={`font-semibold tabular-nums ${accent ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </dd>
        </div>
    );
}
