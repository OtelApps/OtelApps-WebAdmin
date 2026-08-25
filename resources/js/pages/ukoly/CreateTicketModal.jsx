import React, { useEffect, useMemo, useState } from 'react';
import http from '../../lib/http';
import { shareTicketToWhatsApp } from '../../lib/whatsappShare';

const FALLBACK_TYPES = [
    { module_key: 'room_service', label: 'Pokojová služba', queue_key: 'room_delivery', queue_label: 'Donáška do pokoje' },
    { module_key: 'amenities', label: 'Doplňky', queue_key: 'room_delivery', queue_label: 'Donáška do pokoje' },
    { module_key: 'laundry', label: 'Úklid', queue_key: 'housekeeping', queue_label: 'Úklid' },
    { module_key: 'issues_repairs', label: 'Údržba', queue_key: 'maintenance', queue_label: 'Údržba' },
];

function emptyForm(defaultModule, initialValues = {}) {
    return {
        room_number: initialValues.room_number ?? '',
        request_text: initialValues.request_text ?? '',
        service_module: initialValues.service_module ?? defaultModule,
        priority: initialValues.priority ?? 2,
        due_at: initialValues.due_at ?? '',
        guest_display_name: initialValues.guest_display_name ?? '',
    };
}

export function CreateTicketModal({
    open,
    onClose,
    onCreated,
    queues = [],
    serviceTypes = [],
    initialValues = null,
    lockRoom = false,
    lockGuest = false,
}) {
    const types = serviceTypes.length ? serviceTypes : FALLBACK_TYPES;
    const defaultModule = types.find((t) => t.module_key === 'room_service')?.module_key || types[0]?.module_key || 'room_service';

    const [form, setForm] = useState(() => emptyForm(defaultModule, initialValues || {}));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState(null);

    const selectedType = useMemo(
        () => types.find((t) => t.module_key === form.service_module) || types[0],
        [types, form.service_module],
    );
    const derivedQueue =
        queues.find((q) => q.key === selectedType?.queue_key) ||
        (selectedType
            ? { key: selectedType.queue_key, label: selectedType.queue_label || selectedType.queue_key }
            : null);

    useEffect(() => {
        if (!open) {
            setCreated(null);
            setError('');
            return;
        }
        setForm(emptyForm(defaultModule, initialValues || {}));
        setCreated(null);
        setError('');
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open / room+guest defaults
    }, [open, defaultModule, initialValues?.room_number, initialValues?.guest_display_name]);

    if (!open) return null;

    const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const resetForm = () => setForm(emptyForm(defaultModule, initialValues || {}));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                due_at: form.due_at || null,
                guest_display_name: form.guest_display_name || 'Host',
            };
            const { data } = await http.post('/api/tickets', payload);
            onCreated?.(data);
            setCreated(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Vytvoření úkolu selhalo.');
        } finally {
            setSaving(false);
        }
    };

    const handleDismiss = () => {
        setCreated(null);
        setError('');
        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {created ? 'Úkol vytvořen' : 'Nový úkol'}
                    </h2>
                    <button type="button" onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {created ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            {created.ticket?.room_number
                                ? `Pokoj ${created.ticket.room_number}`
                                : 'Úkol'}
                            {created.ticket?.request_text ? ` — ${created.ticket.request_text}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                            Sdílej ho do hotelové WhatsApp skupiny, kterou už používáte.
                        </p>
                        <button
                            type="button"
                            onClick={() => shareTicketToWhatsApp(created.ticket, created.room)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            <span className="material-symbols-outlined text-[20px]">chat</span>
                            Sdílet na WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Hotovo
                        </button>
                    </div>
                ) : (
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Pokoj</label>
                            <input
                                required
                                readOnly={lockRoom}
                                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${lockRoom ? 'bg-gray-50 text-gray-700' : ''}`}
                                value={form.room_number}
                                onChange={(e) => update('room_number', e.target.value)}
                                placeholder="214"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Priorita</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                value={form.priority}
                                onChange={(e) => update('priority', Number(e.target.value))}
                            >
                                <option value={0}>Nízká</option>
                                <option value={1}>Střední</option>
                                <option value={2}>Vysoká</option>
                                <option value={3}>Kritická</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Typ služby</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={form.service_module}
                            onChange={(e) => update('service_module', e.target.value)}
                        >
                            {types.map((t) => (
                                <option key={t.module_key} value={t.module_key}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        {derivedQueue ? (
                            <p className="mt-1.5 text-xs text-gray-500">
                                Fronta se přiřadí automaticky:{' '}
                                <span className="font-medium text-gray-700">{derivedQueue.label}</span>
                            </p>
                        ) : null}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Popis</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={form.request_text}
                            onChange={(e) => update('request_text', e.target.value)}
                            placeholder="Snídaně a cappuccino na pokoj."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Host (volitelné)</label>
                            <input
                                readOnly={lockGuest}
                                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${lockGuest ? 'bg-gray-50 text-gray-700' : ''}`}
                                value={form.guest_display_name}
                                onChange={(e) => update('guest_display_name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Termín (volitelné)</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                value={form.due_at}
                                onChange={(e) => update('due_at', e.target.value)}
                            />
                        </div>
                    </div>
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {saving ? 'Vytvářím…' : 'Vytvořit úkol'}
                    </button>
                </form>
                )}
            </div>
        </div>
    );
}
