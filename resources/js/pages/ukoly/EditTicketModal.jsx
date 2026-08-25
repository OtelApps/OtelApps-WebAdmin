import React, { useEffect, useState } from 'react';
import http from '../../lib/http';
import { STATUS_ORDER, STATUS_CELL } from './ticketStatus';
import { PRIORITY_STYLES } from './ticketLabels';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500';

export function EditTicketModal({ ticketId, serviceTypes = [], onClose, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        http
            .get(`/api/tickets/${ticketId}`)
            .then((res) => {
                const t = res.data.ticket;
                setForm({
                    request_text: t.request_text ?? '',
                    guest_display_name: t.guest_display_name ?? '',
                    room_number: t.room_number ?? '',
                    guest_phone: t.guest_phone ?? '',
                    status: t.status ?? 'new',
                    status_guest_note: t.status_guest_note ?? '',
                    staff_note: t.staff_note ?? '',
                    assigned_staff_name: t.assigned_user_name ?? '',
                    priority: t.priority ?? 1,
                    service_module: t.service_module ?? '',
                    request_number: t.request_number ?? '',
                });
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Úkol se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [ticketId]);

    const update = (field, value) => {
        setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        setError(null);
        try {
            await http.put(`/api/tickets/${ticketId}`, {
                request_text: form.request_text,
                guest_display_name: form.guest_display_name,
                room_number: form.room_number,
                guest_phone: form.guest_phone || null,
                status: form.status,
                status_guest_note: form.status_guest_note || null,
                staff_note: form.staff_note || null,
                assigned_staff_name: form.assigned_staff_name || null,
                priority: Number(form.priority) || 0,
                service_module: form.service_module || undefined,
            });
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Uložení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl" role="dialog" aria-modal="true">
                <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        Upravit úkol
                        {form?.request_number ? (
                            <span className="ml-2 text-sm font-normal text-gray-500">{form.request_number}</span>
                        ) : null}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {loading ? (
                    <p className="p-6 text-gray-500">Načítání…</p>
                ) : form ? (
                    <form onSubmit={handleSave} className="space-y-4 p-6">
                        {serviceTypes.length > 0 ? (
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Služba</span>
                                <select
                                    className={`${inputClass} mt-1`}
                                    value={form.service_module}
                                    onChange={(e) => update('service_module', e.target.value)}
                                >
                                    {serviceTypes.map((t) => (
                                        <option key={t.module_key} value={t.module_key}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Požadavek</span>
                            <textarea
                                className={`${inputClass} mt-1`}
                                rows={3}
                                value={form.request_text}
                                onChange={(e) => update('request_text', e.target.value)}
                                required
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Host</span>
                                <input
                                    className={`${inputClass} mt-1`}
                                    value={form.guest_display_name}
                                    onChange={(e) => update('guest_display_name', e.target.value)}
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Pokoj</span>
                                <input
                                    className={`${inputClass} mt-1`}
                                    value={form.room_number}
                                    onChange={(e) => update('room_number', e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Status</span>
                            <select
                                className={`${inputClass} mt-1`}
                                value={form.status}
                                onChange={(e) => update('status', e.target.value)}
                            >
                                {STATUS_ORDER.map((key) => (
                                    <option key={key} value={key}>
                                        {STATUS_CELL[key].label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Priorita</span>
                            <select
                                className={`${inputClass} mt-1`}
                                value={form.priority}
                                onChange={(e) => update('priority', Number(e.target.value))}
                            >
                                {Object.entries(PRIORITY_STYLES).map(([value, meta]) => (
                                    <option key={value} value={value}>
                                        {meta.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Poznámka hosta</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.status_guest_note}
                                onChange={(e) => update('status_guest_note', e.target.value)}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Poznámka personálu</span>
                            <textarea
                                className={`${inputClass} mt-1`}
                                rows={2}
                                value={form.staff_note}
                                onChange={(e) => update('staff_note', e.target.value)}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Přiřazeno</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.assigned_staff_name}
                                onChange={(e) => update('assigned_staff_name', e.target.value)}
                            />
                        </label>
                        {error ? <p className="text-sm text-red-600">{error}</p> : null}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                            >
                                Zrušit
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {saving ? 'Ukládám…' : 'Uložit'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="p-6 text-red-600">{error || 'Chyba'}</p>
                )}
            </div>
        </div>
    );
}
