import React, { useState } from 'react';
import { PRIORITY_STYLES, formatTicketTime, eventLabel } from './ticketLabels';

const AVAIL = {
    available: { label: 'Dostupná', className: 'text-emerald-600' },
    busy: { label: 'Zaneprázdněná', className: 'text-amber-600' },
    offline: { label: 'Offline', className: 'text-gray-400' },
};

export function TicketDetail({ detail, loading, onClaim, onComplete, acting }) {
    const [note, setNote] = useState('');

    if (loading && !detail) {
        return (
            <div className="flex h-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400">
                Načítám detail…
            </div>
        );
    }

    if (!detail?.ticket) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 text-center">
                <span className="material-symbols-outlined mb-2 text-4xl text-gray-300">task_alt</span>
                <p className="text-sm font-medium text-gray-600">Vyberte úkol ze seznamu</p>
                <p className="mt-1 text-xs text-gray-400">Detail, timeline a akce se zobrazí zde</p>
            </div>
        );
    }

    const { ticket, events = [], room, permissions = {} } = detail;
    const priority = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES[1];
    const canClaim =
        permissions.claim &&
        ['new', 'pending'].includes(ticket.status) &&
        !ticket.assigned_user_id;
    const canComplete =
        permissions.complete &&
        ticket.status === 'in_progress';

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">{ticket.title}</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                    {ticket.service_label || ticket.queue_key} · {ticket.guest_display_name}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-gray-100 px-5 py-3 text-center">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Priorita</p>
                    <p className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${priority.className.includes('orange') ? 'text-orange-600' : 'text-gray-800'}`}>
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                        {priority.label}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Termín</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                        {formatTicketTime(ticket.due_at || ticket.created_at)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Vytvořeno</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                        {formatTicketTime(ticket.created_at)}
                        {ticket.created_by_label ? (
                            <span className="block text-xs font-normal text-gray-500">{ticket.created_by_label}</span>
                        ) : null}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
                <section className="mb-5">
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Popis požadavku
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-800">{ticket.request_text}</p>
                </section>

                <section className="mb-5">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Přiřazeno
                    </h3>
                    {ticket.assignee ? (
                        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                                {ticket.assignee.initials || '—'}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{ticket.assignee.name}</p>
                                <p className="text-xs text-gray-500">
                                    {ticket.assignee.job_title || ticket.assignee.user_type || 'Personál'}
                                    {ticket.assignee.availability_status ? (
                                        <span className={`ml-2 font-medium ${AVAIL[ticket.assignee.availability_status]?.className || ''}`}>
                                            · {AVAIL[ticket.assignee.availability_status]?.label}
                                        </span>
                                    ) : null}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Zatím nepřiřazeno — čeká na převzetí</p>
                    )}
                </section>

                <section className="mb-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Časová osa
                    </h3>
                    <ol className="space-y-3 border-l-2 border-orange-200 pl-4">
                        {events.length === 0 ? (
                            <li className="text-sm text-gray-400">Zatím žádné události</li>
                        ) : (
                            events.map((ev) => (
                                <li key={ev.id} className="relative">
                                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
                                    <p className="text-sm font-medium text-gray-800">
                                        {ev.body || eventLabel(ev.event_type)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatTicketTime(ev.created_at)}
                                        {ev.actor_label ? ` · ${ev.actor_label}` : ''}
                                    </p>
                                </li>
                            ))
                        )}
                        {ticket.status !== 'solved' ? (
                            <li className="relative text-sm text-gray-400">
                                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-300" />
                                Zatím neukončeno
                            </li>
                        ) : null}
                    </ol>
                </section>

                {room ? (
                    <section className="rounded-lg border border-gray-200 bg-slate-50 p-3">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Informace o pokoji
                        </h3>
                        <p className="text-sm font-semibold text-gray-900">
                            Pokoj {room.room_number}
                            {room.floor != null ? ` · ${room.floor}. patro` : ''}
                            {room.room_type ? ` · ${room.room_type}` : ''}
                        </p>
                        {room.guest_name ? (
                            <p className="mt-1 text-sm text-gray-600">Host: {room.guest_name}</p>
                        ) : null}
                        {room.stay_range ? (
                            <p className="text-xs text-gray-500">Pobyt: {room.stay_range}</p>
                        ) : null}
                    </section>
                ) : null}
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
                {canComplete ? (
                    <div className="mb-3">
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Volitelná poznámka k dokončení…"
                            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            disabled={acting}
                            onClick={() => onComplete(note)}
                            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            Dokončit úkol
                        </button>
                    </div>
                ) : null}
                {canClaim ? (
                    <button
                        type="button"
                        disabled={acting}
                        onClick={onClaim}
                        className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        Převzít úkol
                    </button>
                ) : null}
                {!canClaim && !canComplete && ticket.status === 'solved' ? (
                    <p className="text-center text-sm text-emerald-600">Úkol je hotový</p>
                ) : null}
            </div>
        </div>
    );
}
