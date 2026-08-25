import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHttpQuery } from '../../../hooks/useHttpQuery';
import { useAuth } from '../../../context/AuthContext';
import http from '../../../lib/http';
import { CLOSING_STEPS, CLOSING_STATUS_LABELS, formatClosingDateTime } from '../financeLabels';
import { PageLoadError } from '../../../components/ui/PageSkeleton';
import { PreflightStep } from './steps/PreflightStep';
import { TillStep } from './steps/TillStep';
import { DepositStep } from './steps/DepositStep';
import { RecapStep } from './steps/RecapStep';
import { ClosingReport } from './ClosingReport';

export function ClosingWizard() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const { hasPermission } = useAuth();
    const [saveState, setSaveState] = useState('idle');
    const [showReport, setShowReport] = useState(false);
    const [reopenOpen, setReopenOpen] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const debounceRef = useRef(null);

    const { data, isLoading, error, refetch } = useHttpQuery(
        ['finance-closing', id],
        `/api/finance/closings/${id}`,
        { enabled: !!id }
    );

    const closing = data?.closing;
    const settings = data?.settings;
    const editable = closing?.editable;

    const patchMutation = useMutation({
        mutationFn: async (payload) => {
            setSaveState('saving');
            const { data: res } = await http.patch(`/api/finance/closings/${id}`, payload);
            return res;
        },
        onSuccess: (res) => {
            queryClient.setQueryData(['finance-closing', id], res);
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 1500);
        },
        onError: () => setSaveState('error'),
    });

    const actionMutation = useMutation({
        mutationFn: async ({ url, body }) => {
            const { data: res } = await http.post(url, body);
            return res;
        },
        onSuccess: (res) => {
            queryClient.setQueryData(['finance-closing', id], res);
            queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['finance-closings'] });
        },
    });

    const schedulePatch = (payload) => {
        if (!editable) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => patchMutation.mutate(payload), 400);
    };

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const step = closing?.current_step || 1;

    const goStep = (next) => {
        if (!editable) return;
        patchMutation.mutate({ current_step: next });
    };

    const varianceLines = useMemo(
        () => (closing?.payment_lines || []).filter((l) => Number(l.variance) !== 0),
        [closing]
    );

    if (isLoading) {
        return (
            <div className="max-w-screen-2xl mx-auto px-4 py-10">
                <div className="h-10 w-72 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (error || !closing) {
        return <PageLoadError onRetry={refetch} message="Uzávěrku se nepodařilo načíst." />;
    }

    if (showReport || (closing.status === 'completed' && closing.locked && step >= 4 && !editable)) {
        // show report when requested; completed still can show wizard read-only
    }

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div>
                    <Link to="/module/finance/finance_closings" className="text-sm text-orange-600 hover:underline">
                        ← Zpět na uzávěrky
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        Noční uzávěrka — {closing.business_date}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {formatClosingDateTime(closing.period_start)} → {formatClosingDateTime(closing.period_end)}
                        {' · '}
                        {CLOSING_STATUS_LABELS[closing.status] || closing.status}
                        {closing.started_by_name ? ` · ${closing.started_by_name}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    {saveState === 'saving' && <span>Ukládám…</span>}
                    {saveState === 'saved' && <span className="text-emerald-600">✓ Uloženo</span>}
                    {saveState === 'error' && <span className="text-red-600">Uložení selhalo</span>}
                    {closing.status === 'completed' && (
                        <button
                            type="button"
                            onClick={() => setShowReport(true)}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Report
                        </button>
                    )}
                    {closing.status === 'completed' && hasPermission('finance.closing.reopen') && (
                        <button
                            type="button"
                            onClick={() => setReopenOpen(true)}
                            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                        >
                            Znovu otevřít
                        </button>
                    )}
                </div>
            </div>

            <ClosingStepper step={step} editable={editable} onGo={goStep} />

            {showReport ? (
                <ClosingReport
                    closingId={id}
                    onClose={() => setShowReport(false)}
                />
            ) : (
                <div className="mt-6">
                    {step === 1 && (
                        <PreflightStep
                            closing={closing}
                            busy={actionMutation.isPending}
                            error={actionMutation.error}
                            onAcknowledge={() => actionMutation.mutate({
                                url: `/api/finance/closings/${id}/acknowledge-preflight`,
                            })}
                            onContinue={() => goStep(2)}
                        />
                    )}
                    {step === 2 && (
                        <TillStep
                            closing={closing}
                            settings={settings}
                            editable={editable}
                            onPatchLines={(lines) => schedulePatch({ lines })}
                            onCashCount={async (payload) => {
                                const res = await actionMutation.mutateAsync({
                                    url: `/api/finance/closings/${id}/cash-count`,
                                    body: payload,
                                });
                                return res;
                            }}
                            onResolveVariance={async (body) => {
                                await actionMutation.mutateAsync({
                                    url: `/api/finance/closings/${id}/resolve-variance`,
                                    body,
                                });
                            }}
                            onContinue={() => {
                                patchMutation.mutate({ current_step: 3 });
                            }}
                            actionError={actionMutation.error}
                        />
                    )}
                    {step === 3 && (
                        <DepositStep
                            closing={closing}
                            settings={settings}
                            editable={editable}
                            canEditFloat={hasPermission('finance.closing.edit_cash_float')}
                            onPatchFloat={(cash_float) => schedulePatch({ cash_float })}
                            onSaveDeposit={async (body) => {
                                await actionMutation.mutateAsync({
                                    url: `/api/finance/closings/${id}/deposit`,
                                    body,
                                });
                            }}
                            onContinue={() => goStep(4)}
                            busy={actionMutation.isPending}
                            error={actionMutation.error}
                        />
                    )}
                    {step === 4 && (
                        <RecapStep
                            closing={closing}
                            settings={settings}
                            varianceLines={varianceLines}
                            canComplete={data?.can_complete && hasPermission('finance.closing.complete')}
                            editable={editable}
                            busy={actionMutation.isPending}
                            error={actionMutation.error}
                            onComplete={async () => {
                                await actionMutation.mutateAsync({
                                    url: `/api/finance/closings/${id}/complete`,
                                });
                                setShowReport(true);
                            }}
                            onBack={() => goStep(3)}
                        />
                    )}
                </div>
            )}

            {reopenOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Znovu otevřít uzávěrku?</h3>
                        <p className="text-sm text-gray-500 mb-4">Zadejte důvod. Původní snapshot zůstane v auditu.</p>
                        <textarea
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm mb-4"
                            placeholder="Např. Oprava špatně zadaného odvodu"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setReopenOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300">
                                Zpět
                            </button>
                            <button
                                type="button"
                                disabled={reopenReason.trim().length < 3 || actionMutation.isPending}
                                onClick={async () => {
                                    await actionMutation.mutateAsync({
                                        url: `/api/finance/closings/${id}/reopen`,
                                        body: { reason: reopenReason.trim() },
                                    });
                                    setReopenOpen(false);
                                    setShowReport(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
                            >
                                Otevřít
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClosingStepper({ step, editable, onGo }) {
    return (
        <ol className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CLOSING_STEPS.map((s) => {
                const done = step > s.key;
                const current = step === s.key;
                return (
                    <li key={s.key}>
                        <button
                            type="button"
                            disabled={!editable && !done && !current}
                            onClick={() => {
                                if (editable && s.key <= step) onGo(s.key);
                            }}
                            className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                                current
                                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                    : done
                                        ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                        done
                                            ? 'bg-emerald-500 text-white'
                                            : current
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {done ? '✓' : s.key}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 pl-8">
                                {done ? 'Dokončeno' : current ? 'Právě probíhá' : 'Čeká'}
                            </p>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}
