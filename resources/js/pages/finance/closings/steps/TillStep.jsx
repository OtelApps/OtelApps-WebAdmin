import React, { useMemo, useState } from 'react';
import { formatMoney } from '../../../../utils/formatMoney';
import { varianceTone } from '../../financeLabels';
import { CashCountModal } from '../CashCountModal';
import { VarianceResolveModal } from '../VarianceResolveModal';
import { TransactionDrawer } from '../TransactionDrawer';
import http from '../../../../lib/http';

export function TillStep({
    closing,
    settings,
    editable,
    onPatchLines,
    onCashCount,
    onResolveVariance,
    onContinue,
    actionError,
}) {
    const [cashOpen, setCashOpen] = useState(false);
    const [varianceLine, setVarianceLine] = useState(null);
    const [txLine, setTxLine] = useState(null);
    const [localActuals, setLocalActuals] = useState({});
    const [hints, setHints] = useState(null);

    const lines = closing.payment_lines || [];
    const currency = closing.primary_currency || 'CZK';

    const displayActual = (line) => {
        if (localActuals[line.id] !== undefined) return localActuals[line.id];
        return line.actual_amount ?? '';
    };

    const previewVariance = (line) => {
        const actual = displayActual(line);
        if (actual === '' || actual === null) return null;
        const v = Number(actual) - Number(line.expected_amount);
        return Number.isFinite(v) ? v : null;
    };

    const unresolved = useMemo(
        () => lines.filter((l) => {
            const actual = displayActual(l);
            if (actual === '' || actual === null) return true;
            const v = Number(actual) - Number(l.expected_amount);
            if (v === 0) return false;
            return !l.variance_reason;
        }),
        [lines, localActuals]
    );

    const commitActual = (line, value) => {
        setLocalActuals((prev) => ({ ...prev, [line.id]: value }));
        onPatchLines([{ id: line.id, actual_amount: value === '' ? null : Number(value) }]);
    };

    const loadHints = async (line) => {
        const { data } = await http.get(`/api/finance/closings/${closing.id}/reconciliation-hints`, {
            params: { line_id: line.id },
        });
        setHints(data);
        setVarianceLine(line);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rekapitulace tržeb</h2>
                    <p className="text-sm text-gray-500">Očekávané hodnoty spočítal systém. Doplňte jen skutečnost u hotovosti.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Způsob platby</th>
                                <th className="px-4 py-3 font-medium">Očekáváno</th>
                                <th className="px-4 py-3 font-medium">Skutečnost</th>
                                <th className="px-4 py-3 font-medium">Rozdíl</th>
                                <th className="px-4 py-3 font-medium">Stav</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line) => {
                                const v = previewVariance(line);
                                const ok = v === 0;
                                const level = line.variance_level || (ok ? 'ok' : 'warning');
                                return (
                                    <tr key={line.id} className="border-t border-gray-100 dark:border-gray-700">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">{line.payment_method_label}</div>
                                            <button
                                                type="button"
                                                onClick={() => setTxLine(line)}
                                                className="text-xs text-orange-600 hover:underline"
                                            >
                                                {line.transaction_count} transakcí — zobrazit
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">{formatMoney(line.expected_amount, line.currency)}</td>
                                        <td className="px-4 py-3">
                                            {line.requires_manual_count || line.is_cash ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        disabled={!editable}
                                                        value={displayActual(line)}
                                                        onChange={(e) => setLocalActuals((p) => ({ ...p, [line.id]: e.target.value }))}
                                                        onBlur={(e) => commitActual(line, e.target.value)}
                                                        className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 tabular-nums"
                                                    />
                                                    {line.is_cash && editable && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCashOpen(true)}
                                                            className="text-xs px-2 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50"
                                                        >
                                                            Spočítat
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="tabular-nums text-gray-700 dark:text-gray-200">
                                                    {formatMoney(line.actual_amount ?? line.expected_amount, line.currency)}
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 tabular-nums ${v && v !== 0 ? 'text-orange-600 font-medium' : ''}`}>
                                            {v === null ? '—' : formatMoney(v, line.currency)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {v === 0 && <span className="text-emerald-600 font-semibold">✓</span>}
                                            {v !== 0 && v !== null && (
                                                <button
                                                    type="button"
                                                    disabled={!editable}
                                                    onClick={() => loadHints(line)}
                                                    className={`text-xs font-medium ${
                                                        varianceTone(level) === 'red' ? 'text-red-600' : 'text-orange-600'
                                                    } hover:underline`}
                                                >
                                                    {line.variance_reason ? 'Upravit vysvětlení' : 'Vysvětlit'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30 font-semibold">
                                <td className="px-4 py-3">Celkem</td>
                                <td className="px-4 py-3 tabular-nums">{formatMoney(closing.expected_total, currency)}</td>
                                <td className="px-4 py-3 tabular-nums">{formatMoney(closing.actual_total, currency)}</td>
                                <td className="px-4 py-3 tabular-nums text-orange-600">{formatMoney(closing.variance_total, currency)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <aside className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-fit lg:sticky lg:top-4">
                <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Souhrn uzávěrky</h3>
                <dl className="space-y-3 mb-4">
                    <div>
                        <dt className="text-xs text-gray-500">Očekáváno</dt>
                        <dd className="text-2xl font-bold tabular-nums">{formatMoney(closing.expected_total, currency)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">Skutečnost</dt>
                        <dd className="text-2xl font-bold tabular-nums">{formatMoney(closing.actual_total, currency)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">Rozdíl</dt>
                        <dd className="text-2xl font-bold tabular-nums text-orange-600">{formatMoney(closing.variance_total, currency)}</dd>
                    </div>
                </dl>

                {unresolved.length > 0 && (
                    <div className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-800 mb-4">
                        {unresolved.length === 1
                            ? `${unresolved[0].payment_method_label} vyžaduje doplnění nebo vysvětlení.`
                            : `${unresolved.length} položky vyžadují doplnění nebo vysvětlení.`}
                    </div>
                )}

                {actionError && (
                    <p className="text-sm text-red-600 mb-3">
                        {actionError?.response?.data?.message
                            || Object.values(actionError?.response?.data?.errors || {})?.[0]?.[0]
                            || 'Akce se nezdařila.'}
                    </p>
                )}

                <button
                    type="button"
                    disabled={!editable || unresolved.length > 0}
                    onClick={onContinue}
                    className="w-full px-4 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                    Pokračovat na odvody
                </button>
            </aside>

            {cashOpen && (
                <CashCountModal
                    currency={currency}
                    denominations={settings?.denominations?.[currency] || settings?.denominations?.CZK || []}
                    initialRows={closing.cash_counts || []}
                    onClose={() => setCashOpen(false)}
                    onConfirm={async (rows) => {
                        await onCashCount({ currency, rows });
                        setCashOpen(false);
                    }}
                />
            )}

            {varianceLine && (
                <VarianceResolveModal
                    line={varianceLine}
                    reasons={settings?.variance_reasons || {}}
                    hints={hints}
                    onClose={() => { setVarianceLine(null); setHints(null); }}
                    onSubmit={async (payload) => {
                        await onResolveVariance({ line_id: varianceLine.id, ...payload });
                        setVarianceLine(null);
                        setHints(null);
                    }}
                />
            )}

            {txLine && (
                <TransactionDrawer
                    closingId={closing.id}
                    line={txLine}
                    onClose={() => setTxLine(null)}
                />
            )}
        </div>
    );
}
