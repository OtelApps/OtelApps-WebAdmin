import React, { useState } from 'react';
import http from '../../lib/http';
import { STATUS_CELL, STATUS_ORDER } from './ticketStatus';

export function TicketStatusModal({ ticket, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [staffNote, setStaffNote] = useState(ticket.staff_note ?? '');

    const applyStatus = async (newStatus) => {
        if (newStatus === ticket.status) {
            onClose();
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = { status: newStatus };
            if (staffNote.trim()) {
                payload.staff_note = staffNote.trim();
            }
            await http.put(`/api/tickets/${ticket.id}`, payload);
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Změna statusu se nezdařila.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-gray-100 px-5 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Změnit status</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium text-blue-600">{ticket.guest_display_name || 'Host'}</span>
                        {' · '}
                        pokoj {ticket.room_number}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{ticket.request_text}</p>
                </div>

                <ul className="max-h-[min(50vh,360px)] overflow-y-auto py-2">
                    {STATUS_ORDER.map((key) => {
                        const c = STATUS_CELL[key];
                        const isCurrent = key === ticket.status;
                        return (
                            <li key={key}>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => applyStatus(key)}
                                    className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 disabled:opacity-50 ${
                                        isCurrent ? 'bg-orange-50/80' : ''
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-[24px] ${c.iconClass}`}>
                                        {c.icon}
                                    </span>
                                    <span className={`flex-1 text-sm font-medium ${c.textClass}`}>{c.label}</span>
                                    {isCurrent ? (
                                        <span className="text-xs font-medium text-orange-600">Aktuální</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-lg text-gray-300">
                                            chevron_right
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="border-t border-gray-100 px-5 py-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                        Poznámka pro personál (volitelné)
                    </label>
                    <textarea
                        value={staffNote}
                        onChange={(e) => setStaffNote(e.target.value)}
                        rows={2}
                        disabled={saving}
                        placeholder="Uloží se při změně statusu…"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    />
                    {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                        >
                            Zrušit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
