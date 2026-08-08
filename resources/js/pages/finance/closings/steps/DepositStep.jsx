import React, { useState } from 'react';
import { formatMoney } from '../../../../utils/formatMoney';

export function DepositStep({
    closing,
    settings,
    editable,
    canEditFloat,
    onPatchFloat,
    onSaveDeposit,
    onContinue,
    busy,
    error,
}) {
    const currency = closing.primary_currency || 'CZK';
    const cashLine = (closing.payment_lines || []).find((l) => l.is_cash && l.currency === currency);
    const cashActual = cashLine?.actual_amount ?? 0;
    const [floatVal, setFloatVal] = useState(closing.cash_float ?? settings?.default_cash_float ?? 0);
    const [actualDeposit, setActualDeposit] = useState(
        closing.deposit_actual ?? closing.deposit_expected ?? Math.max(0, Number(cashActual) - Number(floatVal))
    );
    const [destination, setDestination] = useState(closing.deposits?.[0]?.destination || 'safe');
    const [reference, setReference] = useState(closing.deposits?.[0]?.reference || '');
    const [note, setNote] = useState(closing.deposits?.[0]?.note || '');
    const destinations = settings?.deposit_destinations || {};

    const recommended = Math.max(0, Number(cashActual) - Number(floatVal));

    return (
        <div className="max-w-2xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Odvody</h2>
            <p className="text-sm text-gray-500 mb-6">Systém spočítal doporučený odvod. Potvrďte skutečnou částku.</p>

            <dl className="space-y-4 mb-6">
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Hotovost v pokladně</dt>
                    <dd className="font-semibold tabular-nums">{formatMoney(cashActual, currency)}</dd>
                </div>
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Ponechat jako základ pokladny</label>
                    <input
                        type="number"
                        step="0.01"
                        disabled={!editable || !canEditFloat}
                        value={floatVal}
                        onChange={(e) => setFloatVal(e.target.value)}
                        onBlur={() => {
                            if (canEditFloat) onPatchFloat(Number(floatVal));
                        }}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 tabular-nums disabled:bg-gray-50"
                    />
                    {!canEditFloat && (
                        <p className="text-xs text-gray-400 mt-1">Základ pokladny může měnit jen manažer.</p>
                    )}
                </div>
                <div className="flex justify-between gap-4 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
                    <dt className="text-orange-800">Doporučený odvod</dt>
                    <dd className="font-bold tabular-nums text-orange-800">{formatMoney(recommended, currency)}</dd>
                </div>
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Skutečný odvod</label>
                    <input
                        type="number"
                        step="0.01"
                        disabled={!editable}
                        value={actualDeposit}
                        onChange={(e) => setActualDeposit(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 tabular-nums"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Kam</label>
                    <select
                        disabled={!editable}
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    >
                        {Object.entries(destinations).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Reference / číslo obálky</label>
                    <input
                        disabled={!editable}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Poznámka</label>
                    <textarea
                        disabled={!editable}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    />
                </div>
            </dl>

            {error && (
                <p className="text-sm text-red-600 mb-4">
                    {error?.response?.data?.message
                        || Object.values(error?.response?.data?.errors || {})?.[0]?.[0]
                        || 'Uložení odvodu selhalo.'}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    disabled={!editable || busy}
                    onClick={async () => {
                        await onSaveDeposit({
                            currency,
                            actual_amount: Number(actualDeposit),
                            destination,
                            reference: reference || null,
                            note: note || null,
                        });
                        onContinue();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                    Uložit odvod a pokračovat
                </button>
            </div>
        </div>
    );
}
