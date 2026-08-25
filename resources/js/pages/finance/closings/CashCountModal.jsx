import React, { useMemo, useState } from 'react';
import { formatMoney } from '../../../utils/formatMoney';

export function CashCountModal({ currency, denominations, initialRows, onClose, onConfirm }) {
    const initialMap = useMemo(() => {
        const m = {};
        (initialRows || []).forEach((r) => {
            m[String(r.denomination)] = r.quantity;
        });
        return m;
    }, [initialRows]);

    const [qty, setQty] = useState(() => {
        const m = {};
        denominations.forEach((d) => {
            m[String(d)] = initialMap[String(d)] || 0;
        });
        return m;
    });

    const rows = denominations.map((d) => {
        const q = Number(qty[String(d)] || 0);
        return {
            denomination: d,
            quantity: q,
            amount: q * Number(d),
        };
    });
    const total = rows.reduce((s, r) => s + r.amount, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Spočítat hotovost</h3>
                <p className="text-sm text-gray-500 mb-4">Zadejte počet bankovek a mincí ({currency}).</p>

                <div className="space-y-2 mb-4">
                    {rows.map((r) => (
                        <div key={r.denomination} className="flex items-center gap-3">
                            <span className="w-28 tabular-nums text-sm font-medium">{formatMoney(r.denomination, currency)}</span>
                            <span className="text-gray-400">×</span>
                            <input
                                type="number"
                                min={0}
                                value={qty[String(r.denomination)]}
                                onChange={(e) => setQty((p) => ({ ...p, [String(r.denomination)]: e.target.value }))}
                                className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm"
                            />
                            <span className="ml-auto tabular-nums text-sm text-gray-600">{formatMoney(r.amount, currency)}</span>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 px-4 py-3 flex justify-between mb-6">
                    <span className="font-medium">Celkem v pokladně</span>
                    <span className="text-xl font-bold tabular-nums">{formatMoney(total, currency)}</span>
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Zrušit</button>
                    <button
                        type="button"
                        onClick={() => onConfirm(rows.map((r) => ({
                            denomination: r.denomination,
                            quantity: Number(qty[String(r.denomination)] || 0),
                        })))}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium"
                    >
                        Potvrdit
                    </button>
                </div>
            </div>
        </div>
    );
}
