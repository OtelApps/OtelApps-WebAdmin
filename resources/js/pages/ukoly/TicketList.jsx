import React, { useState } from 'react';
import { PRIORITY_STYLES, SECTION_META, formatTicketTime } from './ticketLabels';

function TicketRow({ ticket, selected, onSelect }) {
    const priority = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES[1];
    const time =
        ticket.section === 'done'
            ? formatTicketTime(ticket.completed_at || ticket.created_at)
            : formatTicketTime(ticket.due_at || ticket.created_at);

    return (
        <button
            type="button"
            onClick={() => onSelect(ticket.id)}
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 ${
                selected ? 'bg-orange-50' : 'hover:bg-gray-50'
            }`}
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <span className="material-symbols-outlined text-[20px]">meeting_room</span>
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">
                    {ticket.room_number}
                    <span className="ml-2 font-normal text-gray-600">{ticket.request_text}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    <span>{time}</span>
                    {ticket.assigned_user_name ? (
                        <>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span className="truncate">{ticket.assigned_user_name}</span>
                        </>
                    ) : null}
                </span>
            </span>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${priority.className}`}>
                {priority.label}
            </span>
        </button>
    );
}

function Section({ sectionKey, tickets, open, onToggle, selectedId, onSelect }) {
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
                            />
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
}

export function TicketList({ tickets, selectedId, onSelect }) {
    const [openSections, setOpenSections] = useState({
        new: true,
        in_progress: true,
        done: true,
    });

    const grouped = {
        new: tickets.filter((t) => t.section === 'new'),
        in_progress: tickets.filter((t) => t.section === 'in_progress'),
        done: tickets.filter((t) => t.section === 'done'),
    };

    const toggle = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-y-auto">
                {['new', 'in_progress', 'done'].map((key) => (
                    <Section
                        key={key}
                        sectionKey={key}
                        tickets={grouped[key]}
                        open={openSections[key]}
                        onToggle={toggle}
                        selectedId={selectedId}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}
