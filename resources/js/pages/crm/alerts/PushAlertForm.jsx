import React, { useEffect, useMemo, useState } from 'react';
import http from '../../../lib/http';
import { CrmIcon } from '../CrmShell';
import { ALERT_SEVERITY } from '../crmHubConfig';
import { PUSH_TEMPLATES, buildCrmPushPreview } from './pushPreview';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';

function PushPhonePreview({ preview, severity }) {
    const accent =
        severity === 'critical'
            ? 'from-rose-500 to-red-600'
            : severity === 'warning'
              ? 'from-amber-400 to-orange-500'
              : 'from-orange-400 to-amber-500';

    return (
        <div className="mx-auto w-full max-w-[260px]">
            <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-200 p-3 shadow-xl dark:border-gray-600 dark:from-gray-800 dark:to-gray-900">
                <div className="mb-3 flex justify-center">
                    <div className="h-1.5 w-16 rounded-full bg-gray-400/70" />
                </div>
                <div className="space-y-2 px-1 pb-2">
                    <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                        Náhled push
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:bg-gray-900/85">
                        <div className={`h-1 bg-gradient-to-r ${accent}`} />
                        <div className="flex gap-3 p-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xs font-bold text-white shadow-md`}
                            >
                                OA
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                                        {preview.title}
                                    </p>
                                    <span className="shrink-0 text-[10px] text-gray-400">nyní</span>
                                </div>
                                <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {preview.subtitle}
                                </p>
                                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                                    {preview.body}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AudienceOptionCard({ option, selected, onSelect }) {
    const disabled = option.device_count === 0 && option.type !== 'guest';

    return (
        <button
            type="button"
            onClick={() => !disabled && onSelect(option)}
            disabled={disabled}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                selected
                    ? 'border-orange-500 bg-orange-50 shadow-sm dark:border-orange-400 dark:bg-orange-900/20'
                    : 'border-gray-200 bg-white hover:border-orange-200 dark:border-gray-600 dark:bg-gray-900'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            <div className="flex items-start gap-2.5">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        selected
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                >
                    <CrmIcon name={option.icon} className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
                        <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                option.device_count > 0
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {option.device_count} zař.
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {option.description}
                    </p>
                </div>
            </div>
        </button>
    );
}

export function PushAlertForm({ onSaved, onCancel, compact = false }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [severity, setSeverity] = useState('info');
    const [audienceOptions, setAudienceOptions] = useState([]);
    const [selectedAudience, setSelectedAudience] = useState(null);
    const [guestKey, setGuestKey] = useState('');
    const [guests, setGuests] = useState([]);
    const [guestAudienceStats, setGuestAudienceStats] = useState({ device_count: 0, guest_count: 0 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const preview = useMemo(
        () => buildCrmPushPreview({ title, body, severity }),
        [title, body, severity]
    );

    const cohortOptions = audienceOptions.filter((option) => option.type === 'cohort');
    const segmentOptions = audienceOptions.filter((option) => option.type === 'segment');
    const allOption = audienceOptions.find((option) => option.type === 'all');

    const activeStats = useMemo(() => {
        if (selectedAudience?.type === 'guest') {
            return guestAudienceStats;
        }

        return {
            device_count: selectedAudience?.device_count ?? 0,
            guest_count: selectedAudience?.guest_count ?? 0,
        };
    }, [selectedAudience, guestAudienceStats]);

    useEffect(() => {
        Promise.all([http.get('/api/crm/push/audience-options'), http.get('/api/crm/guests')])
            .then(([optionsRes, guestsRes]) => {
                const options = optionsRes.data.options ?? [];
                setAudienceOptions(options);
                setGuests(guestsRes.data.guests ?? []);

                const defaultOption =
                    options.find((option) => option.type === 'all' && option.device_count > 0) ??
                    options.find((option) => option.device_count > 0) ??
                    options[0] ??
                    null;
                setSelectedAudience(defaultOption);
            })
            .catch(() => {
                setAudienceOptions([]);
                setGuests([]);
            });
    }, []);

    useEffect(() => {
        if (selectedAudience?.type !== 'guest' || !guestKey) {
            setGuestAudienceStats({ device_count: 0, guest_count: 0 });
            return;
        }

        http.get('/api/crm/push/audience', {
            params: { audience: 'guest', guest_key: guestKey },
        })
            .then((res) => setGuestAudienceStats(res.data))
            .catch(() => setGuestAudienceStats({ device_count: 0, guest_count: 0 }));
    }, [selectedAudience, guestKey]);

    const applyTemplate = (template) => {
        setTitle(template.title);
        setBody(template.body);
        setSeverity(template.severity);
        setError(null);
        setSuccess(null);
    };

    const reset = () => {
        setTitle('');
        setBody('');
        setSeverity('info');
        setGuestKey('');
        setGuestAudienceStats({ device_count: 0, guest_count: 0 });
        setError(null);
        setSuccess(null);
    };

    const buildPayload = () => {
        const payload = {
            title: title.trim(),
            body: body.trim() || null,
            severity,
            audience: selectedAudience?.type ?? 'all',
        };

        if (selectedAudience?.type === 'cohort') {
            payload.cohort = selectedAudience.key;
        }
        if (selectedAudience?.type === 'segment') {
            payload.segment = selectedAudience.key;
        }
        if (selectedAudience?.type === 'guest') {
            payload.audience = 'guest';
            payload.guest_key = guestKey;
        }

        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Vyplňte prosím nadpis alertu.');
            return;
        }
        if (!selectedAudience) {
            setError('Vyberte cílovou skupinu hostů.');
            return;
        }
        if (selectedAudience.type === 'guest' && !guestKey) {
            setError('Vyberte konkrétního hosta.');
            return;
        }
        if (activeStats.device_count === 0) {
            setError(
                'Ve vybrané skupině není žádné zařízení s push tokenem. Host se musí přihlásit v mobilní app a povolit notifikace.'
            );
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await http.post('/api/crm/push', buildPayload());
            setSuccess(res.data.message || 'Push byla úspěšně odeslána.');
            reset();
            onSaved?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Odeslání push notifikace se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className={compact ? 'grid gap-4 lg:grid-cols-[1fr_220px]' : 'grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'}>
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nadpis alertu"
                            maxLength={160}
                            className={`${inputClass} sm:col-span-2`}
                        />
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Popis (volitelné)"
                            rows={2}
                            maxLength={2000}
                            className={`${inputClass} min-h-[72px] resize-y sm:col-span-2`}
                        />
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            className={inputClass}
                        >
                            {Object.entries(ALERT_SEVERITY).map(([key, meta]) => (
                                <option key={key} value={key}>
                                    {meta.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Rychlé šablony
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PUSH_TEMPLATES.map((template) => (
                                <button
                                    key={template.key}
                                    type="button"
                                    onClick={() => applyTemplate(template)}
                                    className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 transition hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-100"
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Komu poslat
                        </label>

                        {allOption && (
                            <div className="mb-3">
                                <AudienceOptionCard
                                    option={allOption}
                                    selected={selectedAudience?.key === allOption.key}
                                    onSelect={setSelectedAudience}
                                />
                            </div>
                        )}

                        {cohortOptions.length > 0 && (
                            <div className="mb-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Chování hostů
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {cohortOptions.map((option) => (
                                        <AudienceOptionCard
                                            key={option.key}
                                            option={option}
                                            selected={selectedAudience?.key === option.key}
                                            onSelect={setSelectedAudience}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {segmentOptions.length > 0 && (
                            <div className="mb-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    CRM segmenty
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {segmentOptions.map((option) => (
                                        <AudienceOptionCard
                                            key={option.key}
                                            option={option}
                                            selected={selectedAudience?.key === option.key}
                                            onSelect={setSelectedAudience}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Konkrétní host
                            </p>
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedAudience({
                                        type: 'guest',
                                        key: 'guest',
                                        label: 'Jeden host',
                                        description: 'Push jen vybranému hostovi.',
                                        icon: 'person',
                                        device_count: guestKey ? 1 : 0,
                                        guest_count: guestKey ? 1 : 0,
                                    })
                                }
                                className={`mb-2 w-full rounded-xl border px-3 py-2 text-left text-sm ${
                                    selectedAudience?.type === 'guest'
                                        ? 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-900/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                Vybrat jednoho hosta
                            </button>
                            {selectedAudience?.type === 'guest' && (
                                <select
                                    className={inputClass}
                                    value={guestKey}
                                    onChange={(e) => setGuestKey(e.target.value)}
                                >
                                    <option value="">Vyberte hosta…</option>
                                    {guests.map((guest) => (
                                        <option key={guest.key} value={guest.key}>
                                            {guest.name}
                                            {guest.room ? ` · pokoj ${guest.room}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 text-sm text-orange-950 dark:from-orange-900/20 dark:to-amber-900/10 dark:text-orange-100">
                        Dosah: <strong>{activeStats.device_count}</strong> zařízení ·{' '}
                        <strong>{activeStats.guest_count}</strong> hostů v cílové skupině
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                            {success}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-start">
                    <PushPhonePreview preview={preview} severity={severity} />
                    <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
                        Počet u každé kategorie ukazuje reálný dosah push notifikace.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Zrušit
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving || activeStats.device_count === 0}
                    className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                    {saving ? 'Odesílám…' : `Vytvořit a odeslat (${activeStats.device_count})`}
                </button>
            </div>
        </form>
    );
}
