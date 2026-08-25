import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHttpQuery } from '../../hooks/useHttpQuery';
import http from '../../lib/http';
import { useAuth } from '../../context/AuthContext';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketStatusModal } from './TicketStatusModal';
import { EditTicketModal } from './EditTicketModal';

export function Ukoly() {
    const { hasPermission } = useAuth();
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [acting, setActing] = useState(false);
    const [statusTicket, setStatusTicket] = useState(null);
    const [editId, setEditId] = useState(null);

    const listQuery = useHttpQuery(['tickets', 'list'], '/api/tickets', {
        refetchInterval: 15000,
    });
    const statsQuery = useHttpQuery(['tickets', 'stats'], '/api/tickets/stats', {
        refetchInterval: 15000,
    });
    const detailQuery = useHttpQuery(
        ['tickets', 'detail', selectedId],
        `/api/tickets/${selectedId}`,
        {
            enabled: Boolean(selectedId),
            refetchInterval: selectedId ? 10000 : false,
        },
    );

    const tickets = listQuery.data?.tickets || [];
    const queues = listQuery.data?.queues || [];
    const serviceTypes = listQuery.data?.service_types || [];
    const stats = statsQuery.data || { new: 0, in_progress: 0, done_today: 0 };

    useEffect(() => {
        if (!selectedId && tickets.length > 0) {
            const firstOpen = tickets.find((t) => t.section === 'new') || tickets[0];
            setSelectedId(firstOpen.id);
        }
    }, [tickets, selectedId]);

    const invalidateAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] }),
            queryClient.invalidateQueries({ queryKey: ['tickets', 'stats'] }),
            selectedId
                ? queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', selectedId] })
                : Promise.resolve(),
        ]);
    };

    const handleClaim = async () => {
        if (!selectedId) return;
        setActing(true);
        try {
            await http.post(`/api/tickets/${selectedId}/claim`);
            await invalidateAll();
        } finally {
            setActing(false);
        }
    };

    const handleComplete = async (note) => {
        if (!selectedId) return;
        setActing(true);
        try {
            await http.post(`/api/tickets/${selectedId}/complete`, { note: note || null });
            await invalidateAll();
        } finally {
            setActing(false);
        }
    };

    const handleDelete = async (ticket) => {
        if (!ticket?.id) return;
        if (!window.confirm('Opravdu smazat tento úkol?')) return;
        try {
            await http.delete(`/api/tickets/${ticket.id}`);
            if (selectedId === ticket.id) setSelectedId(null);
            await invalidateAll();
        } catch {
            window.alert('Smazání se nezdařilo.');
        }
    };

    const statCards = useMemo(
        () => [
            {
                key: 'new',
                label: 'Nových úkolů',
                value: stats.new,
                icon: 'description',
                className: 'bg-orange-500 text-white',
            },
            {
                key: 'in_progress',
                label: 'Probíhajících úkolů',
                value: stats.in_progress,
                icon: 'schedule',
                className: 'bg-blue-600 text-white',
            },
            {
                key: 'done_today',
                label: 'Hotových úkolů dnes',
                value: stats.done_today,
                icon: 'check_circle',
                className: 'bg-emerald-600 text-white',
            },
        ],
        [stats],
    );

    return (
        <div className="flex h-full flex-col bg-gray-100 p-4 md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Úkoly</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Správa úkolů pro pokojské a servisní tým
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {statCards.map((card) => (
                        <div
                            key={card.key}
                            className={`flex min-w-[150px] items-center gap-3 rounded-xl px-4 py-3 shadow-sm ${card.className}`}
                        >
                            <span className="material-symbols-outlined text-[28px] opacity-90">
                                {card.icon}
                            </span>
                            <div>
                                <p className="text-2xl font-bold leading-none">{card.value}</p>
                                <p className="mt-1 text-xs opacity-90">{card.label}</p>
                            </div>
                        </div>
                    ))}
                    {hasPermission('tickets.create') ? (
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                        >
                            + Nový úkol
                        </button>
                    ) : null}
                </div>
            </div>

            {listQuery.isError ? (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Načtení úkolů selhalo. Zkontrolujte přihlášení a oprávnění.
                </p>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                <TicketList
                    tickets={tickets}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
                <TicketDetail
                    detail={detailQuery.data}
                    loading={detailQuery.isLoading}
                    onClaim={handleClaim}
                    onComplete={handleComplete}
                    onStatus={setStatusTicket}
                    onEdit={(ticket) => setEditId(ticket.id)}
                    onDelete={handleDelete}
                    onCommented={invalidateAll}
                    acting={acting}
                />
            </div>

            <CreateTicketModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                queues={queues}
                serviceTypes={serviceTypes}
                onCreated={async (data) => {
                    await invalidateAll();
                    if (data?.ticket?.id) setSelectedId(data.ticket.id);
                }}
            />
            {statusTicket ? (
                <TicketStatusModal
                    ticket={statusTicket}
                    onClose={() => setStatusTicket(null)}
                    onSaved={invalidateAll}
                />
            ) : null}
            {editId ? (
                <EditTicketModal
                    ticketId={editId}
                    serviceTypes={serviceTypes}
                    onClose={() => setEditId(null)}
                    onSaved={invalidateAll}
                />
            ) : null}
        </div>
    );
}
