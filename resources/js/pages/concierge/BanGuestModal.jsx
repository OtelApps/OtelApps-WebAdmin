import React, { useState } from 'react';
import http from '../../lib/http';

export const BAN_DURATIONS = [
    { key: '30m', label: '30 minut' },
    { key: '1h', label: '1 hodina' },
    { key: '8h', label: '8 hodin' },
    { key: 'until_checkout', label: 'Do konce pobytu' },
];

export function BanGuestModal({ conversationId, guestName, onClose, onBanned }) {
    const [durationKey, setDurationKey] = useState('30m');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        if (!reason.trim() || reason.trim().length < 3) {
            setError('Důvod je povinný (alespoň 3 znaky).');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const { data } = await http.post(`/api/concierge/conversations/${conversationId}/ban`, {
                duration_key: durationKey,
                reason: reason.trim(),
            });
            onBanned?.(data?.conversation);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Ban se nepodařilo uložit.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Zavřít" />
            <form
                onSubmit={submit}
                className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Zabanovat hosta</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {guestName ? `${guestName} uvidí důvod na obrazovce chatu.` : 'Host uvidí důvod na obrazovce chatu.'}
                </p>

                <p className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Délka</p>
                <div className="flex flex-wrap gap-1.5">
                    {BAN_DURATIONS.map((d) => (
                        <button
                            key={d.key}
                            type="button"
                            onClick={() => setDurationKey(d.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                durationKey === d.key
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Důvod (povinný)
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    required
                    minLength={3}
                    placeholder="Proč host nesmí používat chat…"
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />

                {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={busy || reason.trim().length < 3}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {busy ? 'Ukládám…' : 'Zabanovat'}
                    </button>
                </div>
            </form>
        </div>
    );
}
