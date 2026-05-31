import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7];

export function WellnessProgramEdit() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [events, setEvents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [dayNames, setDayNames] = useState({});

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/wellness/program')
            .then((res) => {
                setEvents(res.data.events ?? []);
                setFacilities(res.data.facilities ?? []);
                setDayNames(res.data.day_names ?? {});
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Program se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const updateEvent = (index, patch) => {
        setEvents((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    };

    const addEvent = (dayOrder) => {
        setEvents((prev) => [
            ...prev,
            {
                id: null,
                day_order: dayOrder,
                start_time: '10:00',
                title: 'Nová akce',
                description: '',
                facility_slug: '',
                sort_order: prev.filter((e) => e.day_order === dayOrder).length,
                is_active: true,
            },
        ]);
    };

    const deleteEvent = (index) => {
        if (!window.confirm('Smazat tuto položku z programu?')) return;
        setEvents((prev) => prev.filter((_, i) => i !== index));
    };

    const save = async () => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put('/api/wellness/program', { events });
            setEvents(data.events ?? []);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání programu…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/facilities/relax_sport/wellness-spa')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/module/facilities/relax_sport/wellness-spa')}
                        className="text-sm text-gray-500 hover:text-orange-500 mb-2"
                    >
                        ← Wellness & SPA
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hotelový program</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Akce podle dne v aplikaci (WellnessScreen) — tabulka{' '}
                        <code className="text-xs">wellness_program_events</code>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus && (
                        <span
                            className={`text-sm font-medium ${
                                saveStatus === 'saved'
                                    ? 'text-green-600'
                                    : saveStatus === 'error'
                                      ? 'text-red-600'
                                      : 'text-gray-500'
                            }`}
                        >
                            {saveStatus === 'saving' && 'Ukládám…'}
                            {saveStatus === 'saved' && 'Uloženo'}
                            {saveStatus === 'error' && 'Chyba ukládání'}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={save}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                    >
                        Uložit program
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {DAY_ORDER.map((dayOrder) => {
                    const dayEvents = events
                        .map((e, index) => ({ ...e, _index: index }))
                        .filter((e) => e.day_order === dayOrder)
                        .sort((a, b) => a.start_time.localeCompare(b.start_time));

                    return (
                        <section
                            key={dayOrder}
                            className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    {dayNames[dayOrder] || `Den ${dayOrder}`}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => addEvent(dayOrder)}
                                    className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                                >
                                    + Akce
                                </button>
                            </div>
                            {dayEvents.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-gray-500">Žádné akce v tento den.</p>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {dayEvents.map((event) => (
                                        <li key={event.id || `ev-${event._index}`} className="p-4 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">Čas</label>
                                                    <input
                                                        type="time"
                                                        className={inputClass}
                                                        value={event.start_time}
                                                        onChange={(e) =>
                                                            updateEvent(event._index, {
                                                                start_time: e.target.value.slice(0, 5),
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="sm:col-span-4">
                                                    <label className="block text-xs text-gray-500 mb-1">Název</label>
                                                    <input
                                                        className={inputClass}
                                                        value={event.title}
                                                        onChange={(e) =>
                                                            updateEvent(event._index, { title: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="sm:col-span-4">
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        Oblast (volitelné)
                                                    </label>
                                                    <select
                                                        className={inputClass}
                                                        value={event.facility_slug || ''}
                                                        onChange={(e) =>
                                                            updateEvent(event._index, {
                                                                facility_slug: e.target.value || null,
                                                            })
                                                        }
                                                    >
                                                        <option value="">— bez vazby —</option>
                                                        {facilities.map((f) => (
                                                            <option key={f.slug} value={f.slug}>
                                                                {f.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2 flex items-end justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteEvent(event._index)}
                                                        className="text-sm text-red-600 dark:text-red-400 hover:underline pb-2"
                                                    >
                                                        Smazat
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Popis</label>
                                                <input
                                                    className={inputClass}
                                                    value={event.description || ''}
                                                    onChange={(e) =>
                                                        updateEvent(event._index, {
                                                            description: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={event.is_active}
                                                    onChange={(e) =>
                                                        updateEvent(event._index, {
                                                            is_active: e.target.checked,
                                                        })
                                                    }
                                                    className="rounded text-orange-500"
                                                />
                                                Aktivní
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500';
