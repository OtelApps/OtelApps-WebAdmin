import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AREA_META = {
    'wellness-spa': {
        description: 'Bazén, sauna, masáže a hotelový wellness program.',
        manageLabel: 'Spravovat obsah',
    },
    'gym-sport': {
        description: 'Posilovna, tenisové kurty a další sportovní aktivity.',
        manageLabel: 'Spravovat obsah',
    },
};

export function RelaxSport() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [relaxSport, setRelaxSport] = useState(null);
    const [areas, setAreas] = useState([]);
    const [layoutVariant, setLayoutVariant] = useState('hidden');
    const saveTimeoutRef = useRef(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/relax-sport')
            .then((res) => {
                setRelaxSport(res.data.relax_sport);
                setAreas(res.data.areas ?? []);
                setLayoutVariant(res.data.layout_variant ?? 'hidden');
            })
            .catch((err) => {
                setError(
                    err.response?.data?.message ||
                        'Nepodařilo se načíst Relax & Sport. Spusť migraci hotel_relax_sport v Supabase.'
                );
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') setTimeout(() => setSaveStatus(null), 2000);
        if (status === 'error') setTimeout(() => setSaveStatus(null), 4000);
    };

    const saveRelaxSport = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put('/api/relax-sport', payload);
            setRelaxSport(data.relax_sport);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const saveAreas = async (areasPayload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put('/api/relax-sport/areas', {
                areas: areasPayload,
            });
            setAreas(data.areas ?? []);
            setLayoutVariant(data.layout_variant ?? 'hidden');
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const updateInstanceField = (field, value) => {
        const next = { ...relaxSport, [field]: value };
        setRelaxSport(next);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(
            () => saveRelaxSport({ section_title: next.section_title, is_active: next.is_active }),
            800
        );
    };

    const toggleAreaEnabled = (index) => {
        const next = areas.map((a, i) =>
            i === index ? { ...a, is_enabled: !a.is_enabled } : a
        );
        setAreas(next);
        saveAreas(next);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[40vh]">
                <p className="text-gray-600 dark:text-gray-400">Načítání Relax & Sport…</p>
            </div>
        );
    }

    if (error || !relaxSport) {
        return (
            <div className="p-6 max-w-xl">
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
                    <p className="font-medium mb-2">Chyba načtení</p>
                    <p className="text-sm">{error}</p>
                    <button
                        type="button"
                        onClick={load}
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                    >
                        Zkusit znovu
                    </button>
                </div>
            </div>
        );
    }

    const layoutHint =
        layoutVariant === 'full'
            ? 'V aplikaci: jedna dlaždice přes celou šířku'
            : layoutVariant === 'half'
              ? 'V aplikaci: dvě dlaždice vedle sebe'
              : 'V aplikaci: sekce Relax & Sport se nezobrazí';

    return (
        <div className="p-6 max-w-6xl">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relax & Sport</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Vyberte oblast, kterou chcete upravit. Každou lze v aplikaci samostatně vypnout.
                    </p>
                </div>
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
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-8 flex flex-wrap items-end gap-4">
                <label className="flex-1 min-w-[200px] block">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nadpis sekce v aplikaci
                    </span>
                    <input
                        className={inputClass}
                        value={relaxSport.section_title}
                        onChange={(e) => updateInstanceField('section_title', e.target.value)}
                    />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 pb-2">
                    <input
                        type="checkbox"
                        checked={relaxSport.is_active}
                        onChange={(e) => updateInstanceField('is_active', e.target.checked)}
                        className="rounded text-orange-500"
                    />
                    Celá sekce aktivní
                </label>
                <p className="w-full text-sm text-orange-600 dark:text-orange-400 font-medium m-0">
                    {layoutHint}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {areas.map((area, index) => {
                    const meta = AREA_META[area.slug] ?? {};
                    const disabled = !area.is_enabled;

                    return (
                        <div
                            key={area.slug}
                            className={`rounded-xl border bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-opacity ${
                                disabled
                                    ? 'border-gray-200 dark:border-gray-700 opacity-75'
                                    : 'border-orange-200 dark:border-orange-800/50'
                            }`}
                        >
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {area.list_title}
                                    </h2>
                                    <label className="flex items-center gap-2 text-sm shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={area.is_enabled}
                                            onChange={() => toggleAreaEnabled(index)}
                                            className="rounded text-orange-500"
                                        />
                                        <span className="text-gray-600 dark:text-gray-400">Aktivní</span>
                                    </label>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {meta.description}
                                </p>
                                <p className="text-xs text-gray-400 mb-6">
                                    Dlaždice: {area.home_title}
                                    {area.home_image_key ? ` · ${area.home_image_key}` : ''}
                                </p>

                                <div className="mt-auto flex flex-col sm:flex-row gap-2">
                                    <Link
                                        to={`/module/facilities/relax_sport/${area.slug}`}
                                        className="flex-1 text-center px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        {meta.manageLabel || 'Spravovat obsah'} →
                                    </Link>
                                    <Link
                                        to={`/module/facilities/relax_sport/${area.slug}/settings/edit`}
                                        className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 text-center transition-colors"
                                    >
                                        Nastavení dlaždice
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500';
