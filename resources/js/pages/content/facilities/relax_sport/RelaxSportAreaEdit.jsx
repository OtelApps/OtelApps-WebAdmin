import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export function RelaxSportAreaEdit() {
    const { area: areaSlug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [area, setArea] = useState(null);
    const [homeImageKeys, setHomeImageKeys] = useState([]);
    const [listScreens, setListScreens] = useState([]);
    const saveTimeoutRef = useRef(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/relax-sport')
            .then((res) => {
                const found = (res.data.areas ?? []).find((a) => a.slug === areaSlug);
                if (!found) {
                    setError('Oblast nenalezena.');
                    return;
                }
                setArea(found);
                setHomeImageKeys(res.data.home_image_keys ?? []);
                setListScreens(res.data.list_screens ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Nepodařilo se načíst oblast.');
            })
            .finally(() => setLoading(false));
    }, [areaSlug]);

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

    const saveArea = async (nextArea) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.get('/api/relax-sport');
            const allAreas = data.areas ?? [];
            const payload = allAreas.map((a) =>
                a.slug === areaSlug
                    ? {
                          slug: nextArea.slug,
                          home_title: nextArea.home_title,
                          home_image_key: nextArea.home_image_key,
                          list_screen: nextArea.list_screen,
                          list_title: nextArea.list_title,
                          is_enabled: nextArea.is_enabled,
                          sort_order: nextArea.sort_order,
                      }
                    : {
                          slug: a.slug,
                          home_title: a.home_title,
                          home_image_key: a.home_image_key,
                          list_screen: a.list_screen,
                          list_title: a.list_title,
                          is_enabled: a.is_enabled,
                          sort_order: a.sort_order,
                      }
            );
            const { data: saved } = await axios.put('/api/relax-sport/areas', { areas: payload });
            const updated = (saved.areas ?? []).find((a) => a.slug === areaSlug);
            setArea(updated ?? nextArea);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const updateField = (field, value) => {
        const next = { ...area, [field]: value };
        setArea(next);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => saveArea(next), 800);
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !area) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Oblast nenalezena.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/facilities/relax_sport')}
                    className="text-orange-500 hover:underline"
                >
                    ← Relax & Sport
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/module/facilities/relax_sport')}
                        className="text-sm text-gray-500 hover:text-orange-500 mb-2"
                    >
                        ← Relax & Sport
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Nastavení dlaždice — {area.list_title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{area.slug}</p>
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
                <p className="text-sm text-gray-500">
                    Domovská obrazovka aplikace — <code className="text-xs">hotel_relax_sport_areas</code>
                </p>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={area.is_enabled}
                        onChange={(e) => updateField('is_enabled', e.target.checked)}
                        className="rounded text-orange-500"
                    />
                    Zobrazit v aplikaci (aktivní)
                </label>
                <Field label="Titulek dlaždice na domovské obrazovce">
                    <input
                        className={inputClass}
                        value={area.home_title}
                        onChange={(e) => updateField('home_title', e.target.value)}
                    />
                </Field>
                <Field label="Titulek seznamu v adminu / aplikaci">
                    <input
                        className={inputClass}
                        value={area.list_title}
                        onChange={(e) => updateField('list_title', e.target.value)}
                    />
                </Field>
                <Field label="Obrázek dlaždice">
                    <select
                        className={inputClass}
                        value={area.home_image_key || ''}
                        onChange={(e) => updateField('home_image_key', e.target.value || null)}
                    >
                        <option value="">— žádný —</option>
                        {homeImageKeys.map((key) => (
                            <option key={key} value={key}>
                                {key}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Obrazovka seznamu v aplikaci">
                    <select
                        className={inputClass}
                        value={area.list_screen}
                        onChange={(e) => updateField('list_screen', e.target.value)}
                    >
                        {listScreens.map((screen) => (
                            <option key={screen} value={screen}>
                                {screen}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500';
