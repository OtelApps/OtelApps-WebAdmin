import React from 'react';

export function PreflightStep({ closing, busy, error, onAcknowledge, onContinue }) {
    const result = closing.preflight_result || {};
    const items = result.items || [];
    const blocking = result.blocking_count || 0;
    const warnings = result.warning_count || 0;
    const acked = !!closing.preflight_ack_at;

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Kontrola plateb</h2>
            <p className="text-sm text-gray-500 mb-6">
                Systém automaticky zkontroloval data za uzavírané období. Nemusíte nic hledat ručně.
            </p>

            {items.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 mb-6">
                    ✓ Vše vypadá v pořádku. Můžete pokračovat.
                </div>
            ) : (
                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                        Našli jsme {items.length} {items.length === 1 ? 'věc' : 'věci'}, které doporučujeme zkontrolovat.
                    </p>
                    <ul className="space-y-2">
                        {items.map((item) => (
                            <li
                                key={item.code}
                                className={`rounded-xl border px-4 py-3 text-sm ${
                                    item.level === 'blocking'
                                        ? 'border-red-200 bg-red-50 text-red-800'
                                        : item.level === 'warning'
                                            ? 'border-orange-200 bg-orange-50 text-orange-800'
                                            : 'border-sky-200 bg-sky-50 text-sky-800'
                                }`}
                            >
                                <span className="font-semibold uppercase text-[10px] tracking-wide mr-2">
                                    {item.level === 'blocking' ? 'Blokující' : item.level === 'warning' ? 'Varování' : 'Info'}
                                </span>
                                {item.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 mb-4">
                    {error?.response?.data?.message
                        || error?.response?.data?.errors?.preflight?.[0]
                        || 'Akce se nezdařila.'}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                {blocking > 0 ? (
                    <p className="text-sm text-red-700">
                        Blokující problémy musí být vyřešeny v datech, než půjdete dál.
                    </p>
                ) : warnings > 0 && !acked ? (
                    <button
                        type="button"
                        disabled={busy || !closing.editable}
                        onClick={onAcknowledge}
                        className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                        Potvrdit varování a pokračovat
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={busy || !closing.editable}
                        onClick={onContinue}
                        className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                        Pokračovat na pokladnu
                    </button>
                )}
            </div>
        </div>
    );
}
