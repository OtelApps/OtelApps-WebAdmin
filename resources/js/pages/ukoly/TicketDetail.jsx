import React, { useEffect, useState } from 'react';
import { shareTicketToWhatsApp } from '../../lib/whatsappShare';
import http from '../../lib/http';
import { GuestDetailModal } from '../crm/guests/GuestDetailModal';
import { PRIORITY_STYLES, formatTicketTime, eventLabel } from './ticketLabels';
import { StatusCell } from './ticketStatus';

const AVAIL = {
    available: { label: 'Dostupná', className: 'text-emerald-600' },
    busy: { label: 'Zaneprázdněná', className: 'text-amber-600' },
    offline: { label: 'Offline', className: 'text-gray-400' },
};

export function TicketDetail({
    detail,
    loading,
    onClaim,
    onComplete,
    onStatus,
    onEdit,
    onDelete,
    onCommented,
    acting,
}) {
    const [note, setNote] = useState('');
    const [comment, setComment] = useState('');
    const [commentSaving, setCommentSaving] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [guestKey, setGuestKey] = useState(null);

    useEffect(() => {
        setNote('');
        setComment('');
        setCommentError('');
        setGuestKey(null);
    }, [detail?.ticket?.id]);

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
    const canEdit = Boolean(permissions.edit);
    const canComment = Boolean(permissions.comment ?? permissions.edit);
    const displayGuestName = room?.guest_name || ticket.guest_display_name;
    const crmGuestKey = room?.guest_key || null;

    const submitComment = async (e) => {
        e.preventDefault();
        const body = comment.trim();
        if (!body || !ticket?.id) return;
        setCommentSaving(true);
        setCommentError('');
        try {
            await http.patch(`/api/tickets/${ticket.id}`, { comment: body });
            setComment('');
            await onCommented?.();
        } catch (err) {
            setCommentError(
                err.response?.data?.message
                || err.response?.data?.errors?.ticket?.[0]
                || 'Komentář se nepodařilo uložit.',
            );
        } finally {
            setCommentSaving(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">{ticket.title}</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {ticket.service_label || 'Úkol'}
                            {ticket.queue_label ? ` · ${ticket.queue_label}` : ''}
                            {ticket.guest_display_name ? ` · ${ticket.guest_display_name}` : ''}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => shareTicketToWhatsApp(ticket, room)}
                            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-emerald-600 hover:bg-emerald-50"
                            title="Sdílet na WhatsApp"
                        >
                            <span className="material-symbols-outlined text-[22px]">chat</span>
                            <span className="hidden text-xs font-semibold sm:inline">WhatsApp</span>
                        </button>
                        {canEdit ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onEdit(ticket)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50"
                                    title="Upravit"
                                >
                                    <span className="material-symbols-outlined text-[22px]">edit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(ticket)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                                    title="Smazat"
                                >
                                    <span className="material-symbols-outlined text-[22px]">cancel</span>
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
                <div className="mt-3">
                    <StatusCell
                        status={ticket.status}
                        note={ticket.status_guest_note}
                        onClick={canEdit ? () => onStatus(ticket) : undefined}
                    />
                </div>
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

                {canComment ? (
                    <section className="mb-5">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Komentář
                        </h3>
                        <form onSubmit={submitComment} className="space-y-2">
                            <textarea
                                rows={2}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Poznámka pro tým…"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            {commentError ? <p className="text-sm text-red-600">{commentError}</p> : null}
                            <button
                                type="submit"
                                disabled={commentSaving || !comment.trim()}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                {commentSaving ? 'Ukládám…' : 'Přidat komentář'}
                            </button>
                        </form>
                    </section>
                ) : null}

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
                        {displayGuestName ? (
                            crmGuestKey ? (
                                <button
                                    type="button"
                                    onClick={() => setGuestKey(crmGuestKey)}
                                    className="mt-1 text-left text-sm font-medium text-orange-600 hover:underline"
                                >
                                    Host: {displayGuestName}
                                </button>
                            ) : (
                                <p className="mt-1 text-sm text-gray-600">Host: {displayGuestName}</p>
                            )
                        ) : null}
                        {room.guest_phone ? (
                            <p className="text-xs text-gray-500">{room.guest_phone}</p>
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
                {!canClaim && !canComplete && ticket.status !== 'solved' && ticket.assigned_user_id && !canEdit ? (
                    <p className="text-center text-sm text-gray-500">
                        Úkol je přiřazen jinému uživateli — stav mění jen on.
                    </p>
                ) : null}
            </div>

            {guestKey ? (
                <GuestDetailModal guestKey={guestKey} onClose={() => setGuestKey(null)} />
            ) : null}
        </div>
    );
}
