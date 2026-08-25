import React, { useEffect, useState } from 'react';
import http from '../../../lib/http';
import { GuestLocaleFlag } from '../../concierge/GuestLocaleFlag';
import { CHANNEL_ICONS, formatDate, formatDateTime, GUEST_SEGMENTS, SEGMENT_BADGE } from '../crmHubConfig';
import { CrmIcon } from '../CrmShell';

export function GuestDetailModal({ guestKey, onClose, onSaved }) {
    const [guest, setGuest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        segment: 'standard',
        notes: '',
        tags: '',
        email: '',
        phone: '',
        marketing_consent: false,
        loyalty_points: 0,
        stay_count: 0,
        assigned_staff_name: '',
        company_name: '',
        nationality: '',
        check_in_at: '',
        check_out_at: '',
    });

    useEffect(() => {
        setLoading(true);
        http.get(`/api/crm/guests/${encodeURIComponent(guestKey)}`)
            .then((res) => {
                const g = res.data.guest;
                setGuest(g);
                setForm({
                    segment: g.segment ?? 'standard',
                    notes: g.notes ?? '',
                    tags: (g.tags ?? []).join(', '),
                    email: g.email ?? '',
                    phone: g.phone ?? '',
                    marketing_consent: g.marketing_consent ?? false,
                    loyalty_points: g.loyalty_points ?? 0,
                    stay_count: g.stay_count ?? 0,
                    assigned_staff_name: g.assigned_staff_name ?? '',
                    company_name: g.company_name ?? '',
                    nationality: g.nationality ?? '',
                    check_in_at: g.check_in_at ? g.check_in_at.slice(0, 10) : '',
                    check_out_at: g.check_out_at ? g.check_out_at.slice(0, 10) : '',
                });
            })
            .finally(() => setLoading(false));
    }, [guestKey]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await http.put(`/api/crm/guests/${encodeURIComponent(guestKey)}`, {
                segment: form.segment,
                notes: form.notes,
                email: form.email || null,
                phone: form.phone || null,
                marketing_consent: form.marketing_consent,
                loyalty_points: Number(form.loyalty_points) || 0,
                stay_count: Number(form.stay_count) || 0,
                assigned_staff_name: form.assigned_staff_name || null,
                company_name: form.company_name || null,
                nationality: form.nationality || null,
                check_in_at: form.check_in_at || null,
                check_out_at: form.check_out_at || null,
                tags: form.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                display_name: guest?.name,
                room_number: guest?.room !== '—' ? guest?.room : null,
                guest_external_id: guest?.guest_external_id,
                locale: guest?.locale,
            });
            onSaved?.();
        } catch (err) {
            window.alert(err.response?.data?.message || 'Uložení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    const timeline = guest?.timeline ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Zavřít" />
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    {loading ? (
                        <p className="text-sm text-gray-500">Načítání…</p>
                    ) : guest ? (
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <GuestLocaleFlag locale={guest.locale} size="lg" />
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{guest.name}</h2>
                                    {guest.in_house && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                                            Ubytovaný
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    Pokoj {guest.room} · skóre {guest.activity_score}
                                    {guest.loyalty_points > 0 ? ` · ${guest.loyalty_points} bodů` : ''}
                                </p>
                                {(guest.check_in_at || guest.check_out_at) && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Pobyt: {formatDate(guest.check_in_at)} – {formatDate(guest.check_out_at)}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEGMENT_BADGE[guest.segment] ?? SEGMENT_BADGE.standard}`}
                            >
                                {guest.segment_label}
                            </span>
                        </div>
                    ) : null}
                </div>

                {!loading && guest && (
                    <form onSubmit={handleSave} className="space-y-5 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Segment</label>
                                <select
                                    value={form.segment}
                                    onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                >
                                    {GUEST_SEGMENTS.filter((s) => s.key !== 'all').map((s) => (
                                        <option key={s.key} value={s.key}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Přiřazeno</label>
                                <input
                                    value={form.assigned_staff_name}
                                    onChange={(e) => setForm((f) => ({ ...f, assigned_staff_name: e.target.value }))}
                                    placeholder="Recepce, Concierge…"
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Check-in</label>
                                <input
                                    type="date"
                                    value={form.check_in_at}
                                    onChange={(e) => setForm((f) => ({ ...f, check_in_at: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Check-out</label>
                                <input
                                    type="date"
                                    value={form.check_out_at}
                                    onChange={(e) => setForm((f) => ({ ...f, check_out_at: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">E-mail</label>
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Telefon</label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Věrnostní body</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.loyalty_points}
                                    onChange={(e) => setForm((f) => ({ ...f, loyalty_points: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Počet pobytů</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.stay_count}
                                    onChange={(e) => setForm((f) => ({ ...f, stay_count: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Národnost</label>
                                <input
                                    value={form.nationality}
                                    onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Firma (corporate)</label>
                            <input
                                value={form.company_name}
                                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={form.marketing_consent}
                                onChange={(e) => setForm((f) => ({ ...f, marketing_consent: e.target.checked }))}
                                className="rounded border-gray-300 text-orange-500"
                            />
                            Souhlas s marketingem (GDPR)
                            {guest.marketing_consent_at && (
                                <span className="text-xs text-gray-400">
                                    od {formatDate(guest.marketing_consent_at)}
                                </span>
                            )}
                        </label>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Tagy (čárkou)</label>
                            <input
                                value={form.tags}
                                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                                placeholder="spa, restaurant, sport"
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Poznámky recepce</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={3}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        {timeline.length > 0 && (
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase text-gray-500">Timeline hosta</p>
                                <ul className="space-y-2">
                                    {timeline.slice(0, 8).map((ev, i) => (
                                        <li
                                            key={`${ev.at}-${i}`}
                                            className="flex gap-3 rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-900/50"
                                        >
                                            <CrmIcon
                                                name={CHANNEL_ICONS[ev.type] ?? 'forum'}
                                                className="shrink-0 text-base text-orange-500"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{ev.title}</p>
                                                {ev.body && <p className="text-gray-500">{ev.body}</p>}
                                                <p className="text-gray-400">{formatDateTime(ev.at)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(guest.recent_requests ?? []).length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Poslední požadavky</p>
                                <ul className="space-y-2">
                                    {guest.recent_requests.map((r) => (
                                        <li
                                            key={r.id}
                                            className="rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-900/50"
                                        >
                                            <span className="font-medium">{r.service_label}</span>
                                            <span className="text-gray-400"> · {r.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Zavřít
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                            >
                                {saving ? 'Ukládání…' : 'Uložit profil'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
