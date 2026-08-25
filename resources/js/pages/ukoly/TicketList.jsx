import React, { useState } from 'react';
import { PRIORITY_STYLES, SECTION_META, formatTicketTime } from './ticketLabels';
import { StatusCell } from './ticketStatus';

function TicketRow({ ticket, selected, onSelect, onStatus, onEdit, onDelete, canEdit }) {
    const priority = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES[1];
    const time =
        ticket.section === 'done'
            ? formatTicketTime(ticket.completed_at || ticket.created_at)
            : formatTicketTime(ticket.due_at || ticket.created_at);

    return (
        <div
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 ${
                selected ? 'bg-orange-50' : 'hover:bg-gray-50'
            }`}
        >
            <button
                type="button"
                onClick={() => onSelect(ticket.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <span className="material-symbols-outlined text-[20px]">
                        {ticket.service_icon || 'meeting_room'}
                    </span>
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                        {ticket.room_number}
                        <span className="ml-2 font-normal text-gray-600">{ticket.request_text}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <span>{time}</span>
                        {ticket.service_label || ticket.queue_label ? (
                            <>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="truncate">{ticket.service_label || ticket.queue_label}</span>
                            </>
                        ) : null}
                        {ticket.assigned_user_name ? (
                            <>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="truncate">{ticket.assigned_user_name}</span>
                            </>
                        ) : null}
                    </span>
                </span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
                <StatusCell
                    status={ticket.status}
                    note={ticket.status_guest_note}
                    onClick={canEdit ? () => onStatus(ticket) : undefined}
                />
                <span className={`hidden rounded-md px-2 py-0.5 text-[11px] font-semibold sm:inline ${priority.className}`}>
                    {priority.label}
                </span>
                {canEdit ? (
                    <>
                        <button
                            type="button"
                            onClick={() => onEdit(ticket)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50"
                            aria-label="Upravit"
                            title="Upravit"
                        >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(ticket)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                            aria-label="Smazat"
                            title="Smazat"
                        >
                            <span className="material-symbols-outlined text-[20px]">cancel</span>
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function Section({ sectionKey, tickets, open, onToggle, selectedId, onSelect, onStatus, onEdit, onDelete, canEdit }) {
    const meta = SECTION_META[sectionKey];
    return (
        <div className="border-b border-gray-200 last:border-0">
            <button
                type="button"
                onClick={() => onToggle(sectionKey)}
                className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5 text-left"
            >
                <span className="text-sm font-semibold text-gray-800">
                    {meta.label}{' '}
                    <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 shadow-sm">
                        {tickets.length}
                    </span>
                </span>
                <span className="material-symbols-outlined text-[20px] text-gray-400">
                    {open ? 'expand_less' : 'expand_more'}
                </span>
            </button>
            {open ? (
                <div>
                    {tickets.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-400">Žádné úkoly</p>
                    ) : (
                        tickets.map((t) => (
                            <TicketRow
                                key={t.id}
                                ticket={t}
                                selected={selectedId === t.id}
                                onSelect={onSelect}
                                onStatus={onStatus}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                canEdit={canEdit}
                            />
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

export function TicketList({ tickets, selectedId, onSelect, onStatus, onEdit, onDelete, canEdit }) {
    const [openSections, setOpenSections] = useState({
        new: true,
        in_progress: true,
        done: false,
        other: false,
    });

    const grouped = {
        new: tickets.filter((t) => t.section === 'new'),
        in_progress: tickets.filter((t) => t.section === 'in_progress'),
        done: tickets.filter((t) => t.section === 'done'),
        other: tickets.filter((t) => t.section === 'other'),
    };

    const toggle = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
    const keys = grouped.other.length > 0
        ? ['new', 'in_progress', 'done', 'other']
        : ['new', 'in_progress', 'done'];

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-y-auto">
                {keys.map((key) => (
                    <Section
                        key={key}
                        sectionKey={key}
                        tickets={grouped[key]}
                        open={openSections[key]}
                        onToggle={toggle}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onStatus={onStatus}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        canEdit={canEdit}
                    />
                ))}
            </div>
        </div>
    );
}
