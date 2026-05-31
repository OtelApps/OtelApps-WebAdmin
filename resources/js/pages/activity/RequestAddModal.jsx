import React, { useState } from 'react';
import axios from 'axios';

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500';

export function RequestAddModal({ serviceTypes, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        service_module: serviceTypes[0]?.module_key ?? 'amenities',
        request_text: '',
        guest_name: '',
        guest_room: '',
        status: 'new',
    });

    const update = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { data } = await axios.post('/api/activity/requests', {
                service_module: form.service_module,
                request_text: form.request_text,
                guest_display_name: form.guest_name,
                room_number: form.guest_room,
                status: form.status,
                created_via: 'web_admin',
            });
            onSaved(data.request);
            onClose();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors).flat().join(' ')
                    : null) ||
                'Vytvoření se nezdařilo.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">New request</h2>
                    <button type="button" onClick={onClose} className="text-gray-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Service</span>
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
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 text-sm bg-orange-500 text-white rounded-lg font-semibold disabled:opacity-60"
                        >
                            {saving ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
