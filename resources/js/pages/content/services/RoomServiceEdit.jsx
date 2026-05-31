import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FormSaveBar } from '../../../components/FormSaveBar';
import { RoomServiceCatalogTab } from './RoomServiceCatalogTab';

const TABS = [
    { id: 'information', label: 'Information' },
    { id: 'catalogs', label: 'Katalog' },
    { id: 'hours', label: 'Hours & booking system' },
];

const TAB_IDS = TABS.map((t) => t.id);

function tabFromHash(hash) {
    const id = hash.replace(/^#/, '');
    return TAB_IDS.includes(id) ? id : 'information';
}

export function RoomServiceEdit() {
    const { id: slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => tabFromHash(location.hash));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [menu, setMenu] = useState(null);
    const [openingHours, setOpeningHours] = useState([]);
    const [categories, setCategories] = useState([]);
    const [listImageKeys, setListImageKeys] = useState([]);
    const [headerImageKeys, setHeaderImageKeys] = useState([]);
    const [navigationScreens, setNavigationScreens] = useState([]);
    const [confirmScreens, setConfirmScreens] = useState([]);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/hotel-room-service/menus/${slug}`)
            .then((res) => {
                setMenu(res.data.menu);
                setOpeningHours(res.data.opening_hours ?? []);
                setCategories(res.data.categories ?? []);
                setListImageKeys(res.data.list_image_keys ?? []);
                setHeaderImageKeys(res.data.header_image_keys ?? []);
                setNavigationScreens(res.data.navigation_screens ?? []);
                setConfirmScreens(res.data.confirm_screens ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Menu se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setActiveTab(tabFromHash(location.hash));
    }, [location.hash]);

    const selectTab = (tabId) => {
        setActiveTab(tabId);
        navigate(
            { pathname: `/module/services/room_service/${slug}/edit`, hash: tabId },
            { replace: true }
        );
    };

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') setTimeout(() => setSaveStatus(null), 2000);
        if (status === 'error') setTimeout(() => setSaveStatus(null), 4000);
    };

    const saveMenu = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-room-service/menus/${slug}`, payload);
            setMenu(data.menu);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildMenuPayload = (m) => ({
        title: m.title,
        list_label: m.list_label,
        list_schedule_summary: m.list_schedule_summary,
        list_image_key: m.list_image_key,
        navigation_screen: m.navigation_screen,
        confirm_screen: m.confirm_screen,
        description: m.description,
        schedule_summary: m.schedule_summary,
        header_image_key: m.header_image_key,
        juice_modal_title: m.juice_modal_title,
        sort_order: m.sort_order,
        is_active: m.is_active,
    });

    const updateField = (field, value) => {
        setMenu((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!menu) return;
        saveMenu(buildMenuPayload(menu));
    };

    const updateHoursRow = (dayOrder, value) => {
        setOpeningHours((prev) =>
            prev.map((row) => (row.day_order === dayOrder ? { ...row, hours_text: value } : row))
        );
    };

    const saveHours = async () => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-room-service/menus/${slug}/hours`, {
                opening_hours: openingHours,
            });
            setOpeningHours(data.opening_hours ?? openingHours);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const saveCatalog = async (categoriesPayload) => {
        const payload = categoriesPayload ?? categories;
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-room-service/menus/${slug}/catalog`, {
                categories: payload,
            });
            setCategories(data.categories ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center bg-gray-50">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !menu) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <p className="text-red-600 mb-4">{error || 'Menu nenalezeno.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/services/room_service')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na pokojovou službu
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/module/services/room_service')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">{menu.title}</h1>
                        {saveStatus && (
                            <span
                                className={`text-sm font-medium ${
                                    saveStatus === 'saved'
                                        ? 'text-green-600'
                                        : saveStatus === 'error'
                                          ? 'text-red-600'
                                          : 'text-blue-600'
                                }`}
                            >
                                {saveStatus === 'saving' && 'Saving…'}
                                {saveStatus === 'saved' && 'Saved'}
                                {saveStatus === 'error' && 'Error saving'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="border-b border-gray-200">
                    <div className="flex gap-8 overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => selectTab(tab.id)}
                                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'information' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Information</h2>
                            <p className="text-sm text-gray-600">
                                Základní údaje menu — tabulka{' '}
                                <code className="text-xs">hotel_room_service_menus</code>
                            </p>
                            <Field label="Název menu">
                                <input
                                    className={inputClass}
                                    value={menu.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                />
                            </Field>
                            <Field label="Slug">
                                <input
                                    className={`${inputClass} bg-gray-50`}
                                    value={menu.slug}
                                    readOnly
                                />
                            </Field>
                            <Field label="Popis (detail obrazovka)">
                                <textarea
                                    className={inputClass}
                                    rows={4}
                                    value={menu.description || ''}
                                    onChange={(e) => updateField('description', e.target.value)}
                                />
                            </Field>
                            <Field label="Shrnutí rozpisu (detail)">
                                <input
                                    className={inputClass}
                                    value={menu.schedule_summary || ''}
                                    onChange={(e) => updateField('schedule_summary', e.target.value || null)}
                                    placeholder="07:00 - 10:30"
                                />
                            </Field>
                            <Field label="Klíč hlavičkového obrázku">
                                <select
                                    className={inputClass}
                                    value={menu.header_image_key || ''}
                                    onChange={(e) =>
                                        updateField('header_image_key', e.target.value || null)
                                    }
                                >
                                    <option value="">— žádný —</option>
                                    {headerImageKeys.map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Titulek modalu džusů">
                                <input
                                    className={inputClass}
                                    value={menu.juice_modal_title || ''}
                                    onChange={(e) =>
                                        updateField('juice_modal_title', e.target.value || null)
                                    }
                                    placeholder="Džusy (300ml)"
                                />
                            </Field>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Karta v seznamu služeb</h2>
                            <Field label="Popisek karty">
                                <input
                                    className={inputClass}
                                    value={menu.list_label || ''}
                                    onChange={(e) => updateField('list_label', e.target.value)}
                                />
                            </Field>
                            <Field label="Rozpis na kartě">
                                <input
                                    className={inputClass}
                                    value={menu.list_schedule_summary || ''}
                                    onChange={(e) =>
                                        updateField('list_schedule_summary', e.target.value || null)
                                    }
                                    placeholder="Od 7:00 - Do 10:30"
                                />
                            </Field>
                            <Field label="Obrázek karty (klíč)">
                                <select
                                    className={inputClass}
                                    value={menu.list_image_key || ''}
                                    onChange={(e) =>
                                        updateField('list_image_key', e.target.value || null)
                                    }
                                >
                                    <option value="">— žádný —</option>
                                    {listImageKeys.map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Obrazovka v aplikaci">
                                <select
                                    className={inputClass}
                                    value={menu.navigation_screen}
                                    onChange={(e) => updateField('navigation_screen', e.target.value)}
                                >
                                    {navigationScreens.map((screen) => (
                                        <option key={screen} value={screen}>
                                            {screen}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Potvrzovací obrazovka">
                                <select
                                    className={inputClass}
                                    value={menu.confirm_screen}
                                    onChange={(e) => updateField('confirm_screen', e.target.value)}
                                >
                                    {confirmScreens.map((screen) => (
                                        <option key={screen} value={screen}>
                                            {screen}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Pořadí">
                                <input
                                    type="number"
                                    min={0}
                                    className={inputClass}
                                    value={menu.sort_order}
                                    onChange={(e) =>
                                        updateField('sort_order', parseInt(e.target.value, 10) || 0)
                                    }
                                />
                            </Field>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={menu.is_active}
                                    onChange={(e) => updateField('is_active', e.target.checked)}
                                    className="rounded text-orange-500"
                                />
                                Aktivní (zobrazit v aplikaci)
                            </label>
                            <FormSaveBar onSave={saveInformation} saveStatus={saveStatus} label="Uložit informace" />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'hours' && (
                <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Set opening hours</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Rozpis po dnech — <code className="text-xs">hotel_room_service_hours</code>
                    </p>
                    <div className="space-y-3">
                        {openingHours.map((row) => (
                            <div key={row.day_order} className="flex items-center gap-4">
                                <span className="w-24 text-sm text-gray-700">{row.day_name}</span>
                                <input
                                    className={`${inputClass} flex-1`}
                                    value={row.hours_text}
                                    onChange={(e) => updateHoursRow(row.day_order, e.target.value)}
                                    placeholder="07:00 - 10:30"
                                />
                            </div>
                        ))}
                    </div>
                    <FormSaveBar onSave={saveHours} saveStatus={saveStatus} label="Uložit otevírací dobu" />
                </div>
            )}

            {activeTab === 'catalogs' && (
                <RoomServiceCatalogTab
                    categories={categories}
                    setCategories={setCategories}
                    onSave={saveCatalog}
                    saveStatus={saveStatus}
                />
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
