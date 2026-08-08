import React, { useState } from 'react';
import { formatMoney } from '../../../utils/formatMoney';

export function VarianceResolveModal({ line, reasons, hints, onClose, onSubmit }) {
    const [reason, setReason] = useState(line.variance_reason || '');
    const [note, setNote] = useState(line.variance_note || '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-1">Vysvětlit rozdíl</h3>
                <p className="text-sm text-gray-500 mb-4">
                    {line.payment_method_label} nesedí o {formatMoney(line.variance, line.currency)}.
                </p>

                {hints?.message && (
                    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                        <p className="font-medium mb-2">{hints.message}</p>
                        <ul className="space-y-1">
                            {(hints.hints || []).slice(0, 8).map((h) => (
                                <li key={h.id} className="text-xs">
                                    {formatMoney(h.amount, h.currency)} · {h.reason}
                                    {h.guest_name ? ` · ${h.guest_name}` : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <label className="block text-sm text-gray-500 mb-1">Důvod</label>
                <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 mb-3"
                >
                    <option value="">Vyberte…</option>
                    {Object.entries(reasons).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <label className="block text-sm text-gray-500 mb-1">Poznámka</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 mb-6"
                    placeholder="Např. Pravděpodobně špatně vrácená hotovost."
                />

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Zrušit</button>
                    <button
                        type="button"
                        disabled={!reason}
                        onClick={() => onSubmit({ reason, note: note || null })}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium disabled:opacity-50"
                    >
                        Uložit vysvětlení
                    </button>
                </div>
            </div>
        </div>
    );
}
