import React, { useEffect, useState } from 'react';
import http from '../../lib/http';
import { GuestLocaleFlag } from './GuestLocaleFlag';

const SEGMENTS = [
    { key: 'standard', label: 'Standard' },
    { key: 'vip', label: 'VIP' },
    { key: 'loyalty', label: 'Loyalty' },
    { key: 'corporate', label: 'Corporate' },
    { key: 'complaint_risk', label: 'Riziko stížnosti' },
];

function formatMoney(amount, currency = 'CZK') {
    const n = Number(amount) || 0;
    return `${n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} ${currency}`;
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
}

/**
 * Operátorský modal: karta hosta + rychlé akce (pokoj, checkout, poplatky).
 */
export function GuestOpsModal({ conversationId, onClose, onUpdated }) {
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('overview');

    const [roomNumber, setRoomNumber] = useState('');
    const [roomFee, setRoomFee] = useState('');
    const [extendDays, setExtendDays] = useState(1);
    const [extendFee, setExtendFee] = useState('');
    const [chargeLabel, setChargeLabel] = useState('');
    const [chargeAmount, setChargeAmount] = useState('');
    const [note, setNote] = useState('');

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get(`/api/concierge/conversations/${conversationId}/guest-card`);
            setCard(data);
            setRoomNumber(data?.guest?.room && data.guest.room !== '—' ? data.guest.room : '');
        } catch (err) {
            setError(err.response?.data?.message || 'Kartu hosta se nepodařilo načíst.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [conversationId]);

    const runAction = async (payload) => {
        setBusy(true);
        setError(null);
        try {
            const { data } = await http.post(
                `/api/concierge/conversations/${conversationId}/guest-ops`,
                payload,
            );
            setCard(data);
            if (data?.guest?.room && data.guest.room !== '—') {
                setRoomNumber(data.guest.room);
            }
            onUpdated?.(data);
            return true;
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                Object.values(err.response?.data?.errors || {})
                    .flat()
                    .join(' ') ||
                'Akce se nezdařila.';
            setError(msg);
            return false;
        } finally {
            setBusy(false);
        }
    };

    const guest = card?.guest;
    const charges = card?.folio_charges ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Zavřít" />
            <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                    <div className="min-w-0">
                        {loading ? (
                            <p className="text-sm text-gray-500">Načítání…</p>
                        ) : guest ? (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <GuestLocaleFlag locale={guest.locale} size="lg" />
                                    <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                                        {guest.name}
                                    </h2>
                                    {guest.segment && guest.segment !== 'standard' ? (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                            {guest.segment}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {guest.room ? `Pokoj ${guest.room}` : 'Bez pokoje'}
                                    {guest.check_out_at ? ` · Checkout ${formatDate(guest.check_out_at)}` : ''}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-red-600">{error || 'Host nenalezen'}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <span className="material-symbols-outlined text-[22px]">close</span>
                    </button>
                </div>

                <div className="flex shrink-0 gap-1 border-b border-gray-200 px-3 pt-2 dark:border-gray-700">
                    {[
                        { id: 'overview', label: 'Přehled' },
                        { id: 'actions', label: 'Rychlé akce' },
                        { id: 'folio', label: 'Účet' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`rounded-t-lg px-3 py-2 text-xs font-semibold ${
                                tab === t.id
                                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {error ? (
                        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {error}
                        </p>
                    ) : null}

                    {loading ? (
                        <p className="text-sm text-gray-500">Načítání údajů…</p>
                    ) : tab === 'overview' && guest ? (
                        <div className="space-y-4 text-sm">
                            <dl className="grid grid-cols-2 gap-3">
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">E-mail</dt>
                                    <dd className="text-gray-900 dark:text-white">{guest.email || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Telefon</dt>
                                    <dd className="text-gray-900 dark:text-white">{guest.phone || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Check-in</dt>
                                    <dd className="text-gray-900 dark:text-white">{formatDate(guest.check_in_at)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Check-out</dt>
                                    <dd className="text-gray-900 dark:text-white">{formatDate(guest.check_out_at)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Pobyty</dt>
                                    <dd className="text-gray-900 dark:text-white">{guest.stay_count ?? 0}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Body</dt>
                                    <dd className="text-gray-900 dark:text-white">{guest.loyalty_points ?? 0}</dd>
                                </div>
                            </dl>

                            {guest.notes ? (
                                <div>
                                    <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">
                                        Poznámky
                                    </p>
                                    <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                                        {guest.notes}
                                    </pre>
                                </div>
                            ) : null}

                            {(guest.recent_requests ?? []).length > 0 ? (
                                <div>
                                    <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">
                                        Poslední požadavky
                                    </p>
                                    <ul className="space-y-1.5">
                                        {guest.recent_requests.slice(0, 5).map((r) => (
                                            <li
                                                key={r.id}
                                                className="rounded-lg border border-gray-100 px-3 py-2 text-xs dark:border-gray-700"
                                            >
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {r.service_label}
                                                </span>
                                                <span className="ml-2 text-gray-400">{r.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-600">
                                Poplatky z Concierge zatím evidujeme v CRM profilu (folio). Po napojení PMS
                                se budou propsat do hotelového účtu.
                            </div>
                        </div>
                    ) : null}

                    {tab === 'actions' && guest ? (
                        <div className="space-y-5">
                            <section className="rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                    <span className="material-symbols-outlined text-[18px] text-orange-500">
                                        meeting_room
                                    </span>
                                    Povýšit / změnit pokoj
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                        placeholder="Nový pokoj"
                                        className="w-28 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={roomFee}
                                        onChange={(e) => setRoomFee(e.target.value)}
                                        placeholder="Doplatek CZK"
                                        className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    />
                                    <button
                                        type="button"
                                        disabled={busy || !roomNumber.trim()}
                                        onClick={() =>
                                            runAction({
                                                action: 'change_room',
                                                room_number: roomNumber.trim(),
                                                amount: roomFee ? Number(roomFee) : 0,
                                            })
                                        }
                                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        Uložit pokoj
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                    <span className="material-symbols-outlined text-[18px] text-orange-500">
                                        event_available
                                    </span>
                                    Posunout checkout
                                </h3>
                                <p className="mb-2 text-[11px] text-gray-500">
                                    Aktuální: {formatDate(guest.check_out_at)} · částka se připíše na účet
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={extendDays}
                                        onChange={(e) => setExtendDays(Number(e.target.value))}
                                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    >
                                        {[1, 2, 3, 4, 5, 7].map((d) => (
                                            <option key={d} value={d}>
                                                +{d} {d === 1 ? 'den' : 'dny'}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={extendFee}
                                        onChange={(e) => setExtendFee(e.target.value)}
                                        placeholder="Částka CZK *"
                                        className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    />
                                    <button
                                        type="button"
                                        disabled={busy || !extendFee || Number(extendFee) <= 0}
                                        onClick={() =>
                                            runAction({
                                                action: 'extend_checkout',
                                                days: extendDays,
                                                amount: Number(extendFee),
                                            }).then((ok) => {
                                                if (ok) setExtendFee('');
                                            })
                                        }
                                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        Prodloužit
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                    <span className="material-symbols-outlined text-[18px] text-orange-500">
                                        payments
                                    </span>
                                    Připsat poplatek
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={chargeLabel}
                                        onChange={(e) => setChargeLabel(e.target.value)}
                                        placeholder="Popis (minibar, late checkout…)"
                                        className="min-w-[10rem] flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={chargeAmount}
                                        onChange={(e) => setChargeAmount(e.target.value)}
                                        placeholder="CZK"
                                        className="w-24 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    />
                                    <button
                                        type="button"
                                        disabled={
                                            busy || !chargeLabel.trim() || !chargeAmount || Number(chargeAmount) <= 0
                                        }
                                        onClick={() =>
                                            runAction({
                                                action: 'add_charge',
                                                label: chargeLabel.trim(),
                                                amount: Number(chargeAmount),
                                            }).then((ok) => {
                                                if (ok) {
                                                    setChargeLabel('');
                                                    setChargeAmount('');
                                                }
                                            })
                                        }
                                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        Připsat
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                    <span className="material-symbols-outlined text-[18px] text-orange-500">
                                        workspace_premium
                                    </span>
                                    Segment hosta
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {SEGMENTS.map((s) => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            disabled={busy || guest.segment === s.key}
                                            onClick={() => runAction({ action: 'set_segment', segment: s.key })}
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                guest.segment === s.key
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                                            } disabled:opacity-60`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                    <span className="material-symbols-outlined text-[18px] text-orange-500">
                                        sticky_note_2
                                    </span>
                                    Poznámka do CRM
                                </h3>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    placeholder="Krátká poznámka z chatu…"
                                    className="mb-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
                                />
                                <button
                                    type="button"
                                    disabled={busy || !note.trim()}
                                    onClick={() =>
                                        runAction({ action: 'add_note', note: note.trim() }).then((ok) => {
                                            if (ok) setNote('');
                                        })
                                    }
                                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    Uložit poznámku
                                </button>
                            </section>
                        </div>
                    ) : null}

                    {tab === 'folio' ? (
                        <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Poplatky z Concierge
                                </h3>
                                <p className="text-sm font-bold text-orange-600">
                                    {formatMoney(card?.folio_total, card?.folio_currency)}
                                </p>
                            </div>
                            {charges.length === 0 ? (
                                <p className="text-xs text-gray-500">Zatím žádné poplatky.</p>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {charges.map((c) => (
                                        <li key={c.id} className="flex items-start justify-between gap-3 py-2.5">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {c.label}
                                                </p>
                                                <p className="text-[11px] text-gray-400">
                                                    {formatDate(c.created_at)}
                                                    {c.note ? ` · ${c.note}` : ''}
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {formatMoney(c.amount, c.currency)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
