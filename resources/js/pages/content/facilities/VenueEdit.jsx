import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FormSaveBar } from '../../../components/FormSaveBar';
import { VenueMenusTab } from './VenueMenusTab';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'hours', label: 'Otevírací doba' },
    { id: 'menus', label: 'Menu' },
];

export function VenueEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('information');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [venue, setVenue] = useState(null);
    const [openingHours, setOpeningHours] = useState([]);
    const [menus, setMenus] = useState([]);
    const [allergens, setAllergens] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/venues/${slug}`)
            .then((res) => {
                setVenue(res.data.venue);
                setOpeningHours(res.data.opening_hours ?? []);
                setMenus(res.data.menus ?? []);
                setAllergens(res.data.allergens ?? []);
                setImageKeys(res.data.image_keys ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Podnik se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') {
            setTimeout(() => setSaveStatus(null), 2000);
        }
        if (status === 'error') {
            setTimeout(() => setSaveStatus(null), 4000);
        }
    };

    const saveVenue = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/venues/${slug}`, payload);
            setVenue(data.venue);
            if (payload.opening_hours) {
                setOpeningHours(payload.opening_hours);
            }
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildVenuePayload = (v) => ({
        title: v.title,
        venue_type: v.venue_type,
        description: v.description,
        schedule_summary: v.schedule_summary,
        image_key: v.image_key,
        list_label: v.list_label,
        sort_order: v.sort_order,
        is_active: v.is_active,
    });

    const updateVenueField = (field, value) => {
        setVenue((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!venue) return;
        saveVenue(buildVenuePayload(venue));
    };

    const updateHoursRow = (dayOrder, field, value) => {
        setOpeningHours((prev) =>
            prev.map((row) => (row.day_order === dayOrder ? { ...row, [field]: value } : row))
        );
    };

    const saveHours = () => saveVenue({ opening_hours: openingHours });

    const saveMenus = async (menusPayload) => {
        const payload = menusPayload ?? menus;
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/venues/${slug}/menus`, { menus: payload });
            setMenus(data.menus ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !venue) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Podnik nenalezen.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/facilities/restaurants_bars')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na seznam
                </button>
            </div>
        );
    }

    return (
        <div className={`p-6 ${activeTab === 'menus' ? 'max-w-7xl' : 'max-w-5xl'}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/module/facilities/restaurants_bars')}
                        className="text-sm text-gray-500 hover:text-orange-500 mb-2"
                    >
                        ← Restaurants & Bars
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{venue.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {venue.venue_type === 'bar' ? 'Bar' : 'Restaurace'} · {venue.slug}
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

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === tab.id
                                ? 'border-orange-500 text-orange-500'
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'information' && (
                <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <Field label="Název">
                        <input
                            className={inputClass}
                            value={venue.title}
                            onChange={(e) => updateVenueField('title', e.target.value)}
                        />
                    </Field>
                    <Field label="Slug (URL)">
                        <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={venue.slug} readOnly />
                    </Field>
                    <Field label="Typ">
                        <select
                            className={inputClass}
                            value={venue.venue_type}
                            onChange={(e) => updateVenueField('venue_type', e.target.value)}
                        >
                            <option value="restaurant">Restaurace</option>
                            <option value="bar">Bar</option>
                        </select>
                    </Field>
                    <Field label="Popis">
                        <textarea
                            className={inputClass}
                            rows={4}
                            value={venue.description || ''}
                            onChange={(e) => updateVenueField('description', e.target.value)}
                        />
                    </Field>
                    <Field label="Shrnutí otevírací doby (v seznamu)">
                        <input
                            className={inputClass}
                            value={venue.schedule_summary || ''}
                            onChange={(e) => updateVenueField('schedule_summary', e.target.value)}
                            placeholder="např. 12:00 - 22:00"
                        />
                    </Field>
                    <Field label="Štítek v seznamu">
                        <input
                            className={inputClass}
                            value={venue.list_label || ''}
                            onChange={(e) => updateVenueField('list_label', e.target.value)}
                            placeholder="Restaurace / Bar"
                        />
                    </Field>
                    <Field label="Klíč obrázku (mobilní app)">
                        <select
                            className={inputClass}
                            value={venue.image_key || ''}
                            onChange={(e) => updateVenueField('image_key', e.target.value || null)}
                        >
                            <option value="">— žádný —</option>
                            {imageKeys.map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Pořadí">
                        <input
                            type="number"
                            className={inputClass}
                            value={venue.sort_order}
                            onChange={(e) => updateVenueField('sort_order', parseInt(e.target.value, 10) || 0)}
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={venue.is_active}
                            onChange={(e) => updateVenueField('is_active', e.target.checked)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        Aktivní (zobrazit v aplikaci)
                    </label>
                    <FormSaveBar onSave={saveInformation} saveStatus={saveStatus} label="Uložit informace" />
                </div>
            )}

            {activeTab === 'hours' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-3">
                    <p className="text-sm text-gray-500 mb-4">
                        Odpovídá tabulce <code className="text-xs">venue_opening_hours</code>
                    </p>
                    {openingHours.map((row) => (
                        <div key={row.day_order} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {row.day_name}
                            </span>
                            <input
                                className={inputClass}
                                value={row.hours_text}
                                onChange={(e) => updateHoursRow(row.day_order, 'hours_text', e.target.value)}
                                placeholder="12:00 - 22:00"
                            />
                        </div>
                    ))}
                    <FormSaveBar onSave={saveHours} saveStatus={saveStatus} label="Uložit otevírací dobu" />
                </div>
            )}

            {activeTab === 'menus' && (
                <VenueMenusTab
                    menus={menus}
                    setMenus={setMenus}
                    allergens={allergens}
                    onSave={saveMenus}
                    saveStatus={saveStatus}
                />
            )}
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
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
