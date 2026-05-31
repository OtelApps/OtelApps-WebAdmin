import React, { useState } from 'react';
import axios from 'axios';
import { STATUS_CELL, STATUS_ORDER } from './activityStatus';

export function RequestStatusModal({ row, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [staffNote, setStaffNote] = useState(row.staff_note ?? '');

    const applyStatus = async (newStatus) => {
        if (newStatus === row.status) {
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
            await axios.put(`/api/activity/requests/${row.id}`, payload);
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                    <h2 id="status-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                        Změnit status
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium" style={{ color: '#4A90E2' }}>
                            {row.guest_name}
                        </span>
                        {' · '}
                        pokoj {row.guest_room}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{row.request}</p>
                    {row.request_number ? (
                        <p className="mt-1 text-xs text-gray-400">{row.request_number}</p>
                    ) : null}
                </div>

                <ul className="max-h-[min(50vh,360px)] overflow-y-auto py-2">
                    {STATUS_ORDER.map((key) => {
                        const c = STATUS_CELL[key];
                        const isCurrent = key === row.status;
                        return (
                            <li key={key}>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => applyStatus(key)}
                                    className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/60 ${
                                        isCurrent ? 'bg-orange-50/80 dark:bg-orange-950/20' : ''
                                    }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[24px] ${c.iconClass}`}
                                    >
                                        {c.icon}
                                    </span>
                                    <span className={`flex-1 text-sm font-medium ${c.textClass}`}>
                                        {c.label}
                                    </span>
                                    {isCurrent ? (
                                        <span className="text-xs font-medium text-orange-600">Aktuální</span>
                                    ) : saving ? null : (
                                        <span className="material-symbols-outlined text-lg text-gray-300">
                                            chevron_right
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                        Poznámka pro personál (volitelné)
                    </label>
                    <textarea
                        value={staffNote}
                        onChange={(e) => setStaffNote(e.target.value)}
                        rows={2}
                        disabled={saving}
                        placeholder="Uloží se při změně statusu…"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                    {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Zrušit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
