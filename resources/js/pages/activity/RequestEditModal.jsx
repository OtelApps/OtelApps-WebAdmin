import React, { useEffect, useState } from 'react';
import axios from 'axios';

const STATUSES = [
    { value: 'new', label: 'New' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'solved', label: 'Solved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
];

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500';

export function RequestEditModal({ requestId, serviceTypes, onClose, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/activity/requests/${requestId}`)
            .then((res) => {
                const r = res.data.request;
                setForm({
                    request_text: r.request ?? '',
                    guest_name: r.guest_name ?? '',
                    guest_room: r.guest_room ?? '',
                    guest_phone: r.guest_phone ?? '',
                    status: r.status ?? 'new',
                    status_guest_note: r.status_note ?? '',
                    staff_note: r.staff_note ?? '',
                    assigned_staff_name: r.assigned_staff_name ?? '',
                    priority: r.priority ?? 0,
                    service_module: r.service_module ?? '',
                    request_number: r.request_number ?? '',
                });
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Požadavek se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [requestId]);

    const update = (field, value) => {
        setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        setError(null);
        try {
            const { data } = await axios.put(`/api/activity/requests/${requestId}`, {
                request_text: form.request_text,
                guest_display_name: form.guest_name,
                room_number: form.guest_room,
                guest_phone: form.guest_phone || null,
                status: form.status,
                status_guest_note: form.status_guest_note || null,
                staff_note: form.staff_note || null,
                assigned_staff_name: form.assigned_staff_name || null,
                priority: Number(form.priority) || 0,
                service_module: form.service_module,
            });
            onSaved(data.request);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Uložení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
            >
                <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Edit request
                        {form?.request_number ? (
                            <span className="ml-2 text-sm font-normal text-gray-500">{form.request_number}</span>
                        ) : null}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {loading ? (
                    <p className="p-6 text-gray-500">Načítání…</p>
                ) : form ? (
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Service</span>
                            <select
                                className={`${inputClass} mt-1`}
                                value={form.service_module}
                                onChange={(e) => {
                                    const key = e.target.value;
                                    const t = serviceTypes.find((x) => x.module_key === key);
                                    update('service_module', key);
                                }}
                            >
                                {serviceTypes.map((t) => (
                                    <option key={t.module_key} value={t.module_key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Request</span>
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
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Guest</span>
                                <input
                                    className={`${inputClass} mt-1`}
                                    value={form.guest_name}
                                    onChange={(e) => update('guest_name', e.target.value)}
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Room</span>
                                <input
                                    className={`${inputClass} mt-1`}
                                    value={form.guest_room}
                                    onChange={(e) => update('guest_room', e.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                            <select
                                className={`${inputClass} mt-1`}
                                value={form.status}
                                onChange={(e) => update('status', e.target.value)}
                            >
                                {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Guest note</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.status_guest_note}
                                onChange={(e) => update('status_guest_note', e.target.value)}
                                placeholder="Message from guest"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff note</span>
                            <textarea
                                className={`${inputClass} mt-1`}
                                rows={2}
                                value={form.staff_note}
                                onChange={(e) => update('staff_note', e.target.value)}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned to</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.assigned_staff_name}
                                onChange={(e) => update('assigned_staff_name', e.target.value)}
                            />
                        </label>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60 font-semibold"
                            >
                                {saving ? 'Saving…' : 'Save'}
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
