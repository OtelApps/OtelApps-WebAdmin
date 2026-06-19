import React, { useEffect, useState } from 'react';
import http from '../../../lib/http';

const SEGMENTS = [
    { key: 'all', label: 'Všichni hosté' },
    { key: 'standard', label: 'Standard' },
    { key: 'vip', label: 'VIP' },
    { key: 'corporate', label: 'Corporate' },
    { key: 'returning', label: 'Vracející se' },
];

const STATUSES = [
    { key: 'draft', label: 'Koncept' },
    { key: 'scheduled', label: 'Naplánováno' },
    { key: 'active', label: 'Aktivní' },
    { key: 'ended', label: 'Ukončeno' },
];

const emptyForm = {
    title: '',
    subtitle: '',
    body: '',
    cta_label: '',
    cta_url: '',
    segment: 'all',
    status: 'draft',
    starts_at: '',
    ends_at: '',
};

export function PromotionModal({ item, onClose, onSaved }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                title: item.title ?? '',
                subtitle: item.subtitle ?? '',
                body: item.body ?? '',
                cta_label: item.cta_label ?? '',
                cta_url: item.cta_url ?? '',
                segment: item.segment ?? 'all',
                status: item.status ?? 'draft',
                starts_at: item.starts_at ? item.starts_at.slice(0, 16) : '',
                ends_at: item.ends_at ? item.ends_at.slice(0, 16) : '',
            });
        } else {
            setForm(emptyForm);
        }
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        const payload = {
            ...form,
            starts_at: form.starts_at || null,
            ends_at: form.ends_at || null,
            channels: ['mobile_app', 'web_app'],
        };
        try {
            if (item?.id) {
                await http.put(`/api/crm/promotions/${item.id}`, payload);
            } else {
                await http.post('/api/crm/promotions', payload);
            }
            onSaved?.();
        } catch (err) {
            window.alert(err.response?.data?.message || 'Uložení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Zavřít" />
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {item ? 'Upravit promo akci' : 'Nová promo akce'}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Nadpis *</label>
                        <input
                            required
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Podnadpis</label>
                        <input
                            value={form.subtitle}
                            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Text nabídky</label>
                        <textarea
                            value={form.body}
                            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Segment</label>
                            <select
                                value={form.segment}
                                onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {SEGMENTS.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Stav</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {STATUSES.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Od</label>
                            <input
                                type="datetime-local"
                                value={form.starts_at}
                                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Do</label>
                            <input
                                type="datetime-local"
                                value={form.ends_at}
                                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">CTA tlačítko</label>
                            <input
                                value={form.cta_label}
                                onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                                placeholder="Rezervovat"
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">CTA URL</label>
                            <input
                                value={form.cta_url}
                                onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                            {saving ? 'Ukládání…' : 'Uložit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
