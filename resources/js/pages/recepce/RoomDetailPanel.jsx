import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import http from '../../lib/http';
import { useHttpQuery } from '../../hooks/useHttpQuery';
import { HashTabs } from '../../components/ui/HashTabs';
import { OCCUPANCY_DOT, OCCUPANCY_LABELS } from './receptionLabels';
import { OverviewTab } from './tabs/OverviewTab';
import { GuestsTab } from './tabs/GuestsTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import { MinibarTab } from './tabs/MinibarTab';
import { HistoryTab } from './tabs/HistoryTab';

const TABS = [
    { id: 'overview', label: 'Přehled' },
    { id: 'guests', label: 'Hosté' },
    { id: 'invoices', label: 'Faktury' },
    { id: 'minibar', label: 'Minibar' },
    { id: 'history', label: 'Historie' },
];

export function RoomDetailPanel({ roomNumber, onClose, onCheckedOut }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        setActiveTab('overview');
        setActionError(null);
    }, [roomNumber]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const { data, isLoading, error, refetch } = useHttpQuery(
        ['reception-room', roomNumber],
        `/api/reception/rooms/${encodeURIComponent(roomNumber)}`,
        { enabled: Boolean(roomNumber) },
    );

    const handleToggleRequest = async (requestId, isChecked) => {
        setActionError(null);
        try {
            await http.patch(
                `/api/reception/rooms/${encodeURIComponent(roomNumber)}/requests/${requestId}`,
                { is_checked: isChecked },
            );
            await refetch();
            queryClient.invalidateQueries({ queryKey: ['reception-rooms'] });
        } catch (err) {
            setActionError(err.response?.data?.message || 'Požadavek se nepodařilo uložit.');
        }
    };

    const handleCheckout = async () => {
        if (!data?.stay) return;
        if (!window.confirm(`Opravdu chceš udělat check-out pokoje ${roomNumber}?`)) return;

        setCheckoutLoading(true);
        setActionError(null);
        try {
            await http.post(`/api/reception/rooms/${encodeURIComponent(roomNumber)}/checkout`);
            await queryClient.invalidateQueries({ queryKey: ['reception-rooms'] });
            await refetch();
            onCheckedOut?.();
        } catch (err) {
            setActionError(
                err.response?.data?.message
                || err.response?.data?.errors?.room?.[0]
                || 'Check-out se nepodařil.',
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    const occupancy = data?.room?.occupancy_status;
    const guestCount = data?.stay?.guest_count;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
                onClick={onClose}
                aria-hidden
            />
            <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700 shrink-0">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Pokoj {roomNumber}
                        </h3>
                        {data?.room && (
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="inline-flex items-center gap-1.5">
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${OCCUPANCY_DOT[occupancy] || 'bg-gray-400'}`}
                                    />
                                    {OCCUPANCY_LABELS[occupancy] || occupancy}
                                </span>
                                {guestCount != null && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">person</span>
                                        {guestCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Zavřít"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="shrink-0 px-5 pt-3">
                    <HashTabs tabs={TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-4">
                    {isLoading && (
                        <p className="text-sm text-gray-500">Načítám detail pokoje…</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-600">
                            {error.response?.data?.message || 'Detail se nepodařilo načíst.'}
                        </p>
                    )}
                    {actionError && (
                        <p className="mb-3 text-sm text-red-600">{actionError}</p>
                    )}
                    {data && !isLoading && (
                        <>
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    detail={data}
                                    onToggleRequest={handleToggleRequest}
                                    onOpenInvoices={() => setActiveTab('invoices')}
                                />
                            )}
                            {activeTab === 'guests' && <GuestsTab guests={data.guests} />}
                            {activeTab === 'invoices' && (
                                <InvoicesTab lines={data.folio_lines} balance={data.balance} />
                            )}
                            {activeTab === 'minibar' && <MinibarTab items={data.minibar} />}
                            {activeTab === 'history' && <HistoryTab events={data.events} />}
                        </>
                    )}
                </div>

                <footer className="flex shrink-0 items-center gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
                    <button
                        type="button"
                        disabled={!data?.stay || checkoutLoading}
                        onClick={handleCheckout}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                        {checkoutLoading ? 'Odesílám…' : 'Check-out'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                    >
                        Rychlý účet
                    </button>
                </footer>
            </aside>
        </>
    );
}
