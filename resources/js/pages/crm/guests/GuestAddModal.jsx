import React, { useState } from 'react';
import http from '../../../lib/http';
import { GUEST_LOCALES } from '../../concierge/conciergeLocales';
import { GUEST_SEGMENTS } from '../crmHubConfig';
import { CrmIcon } from '../CrmShell';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';

const SEGMENT_OPTIONS = GUEST_SEGMENTS.filter((s) => s.key !== 'all');

export function GuestAddModal({ onClose, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        display_name: '',
        room_number: '',
        email: '',
        phone: '',
        locale: 'cs',
        segment: 'standard',
        check_in_at: '',
        check_out_at: '',
        notes: '',
        assigned_staff_name: '',
        company_name: '',
        nationality: '',
    });

    const update = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { data } = await http.post('/api/crm/guests', {
                display_name: form.display_name.trim(),
                room_number: form.room_number.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                locale: form.locale,
                segment: form.segment,
                check_in_at: form.check_in_at || null,
                check_out_at: form.check_out_at || null,
                notes: form.notes.trim() || null,
                assigned_staff_name: form.assigned_staff_name.trim() || null,
                company_name: form.company_name.trim() || null,
                nationality: form.nationality.trim() || null,
            });
            onSaved?.(data.guest);
            onClose();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors).flat().join(' ')
                    : null) ||
                'Vytvoření hosta se nezdařilo.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Zavřít" />
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Přidat hosta</h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            Host bez mobilní aplikace — profil se uloží do CRM
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <CrmIcon name="close" className="text-xl" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="col-span-2 block sm:col-span-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jméno *</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.display_name}
                                onChange={(e) => update('display_name', e.target.value)}
                                required
                                autoFocus
                            />
                        </label>
                        <label className="col-span-2 block sm:col-span-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pokoj *</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.room_number}
                                onChange={(e) => update('room_number', e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Check-in</span>
                            <input
                                type="date"
                                className={`${inputClass} mt-1`}
                                value={form.check_in_at}
                                onChange={(e) => update('check_in_at', e.target.value)}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Check-out</span>
                            <input
                                type="date"
                                className={`${inputClass} mt-1`}
                                value={form.check_out_at}
                                onChange={(e) => update('check_out_at', e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</span>
                            <input
                                type="email"
                                className={`${inputClass} mt-1`}
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.phone}
                                onChange={(e) => update('phone', e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jazyk</span>
                            <select
                                className={`${inputClass} mt-1`}
                                value={form.locale}
                                onChange={(e) => update('locale', e.target.value)}
                            >
                                {GUEST_LOCALES.map((l) => (
                                    <option key={l.code} value={l.code}>
                                        {l.flag} {l.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Segment</span>
                            <select
                                className={`${inputClass} mt-1`}
                                value={form.segment}
                                onChange={(e) => update('segment', e.target.value)}
                            >
                                {SEGMENT_OPTIONS.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Přiřazeno</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.assigned_staff_name}
                                onChange={(e) => update('assigned_staff_name', e.target.value)}
                                placeholder="Recepce"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Národnost</span>
                            <input
                                className={`${inputClass} mt-1`}
                                value={form.nationality}
                                onChange={(e) => update('nationality', e.target.value)}
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Firma</span>
                        <input
                            className={`${inputClass} mt-1`}
                            value={form.company_name}
                            onChange={(e) => update('company_name', e.target.value)}
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Poznámky</span>
                        <textarea
                            className={`${inputClass} mt-1`}
                            rows={3}
                            value={form.notes}
                            onChange={(e) => update('notes', e.target.value)}
                        />
                    </label>

                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {saving ? 'Ukládám…' : 'Vytvořit hosta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
