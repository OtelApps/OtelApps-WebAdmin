import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { WeeklyHoursPicker } from '../../../../components/ui/WeeklyHoursPicker';
import { RoomServiceCatalogTab } from './RoomServiceCatalogTab';

const TABS = [
    { id: 'information', label: 'Information' },
    { id: 'catalogs', label: 'Katalog' },
    { id: 'hours', label: 'Hours & booking system' },
];

export function RoomServiceEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
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
        <ModuleEditLayout
            title={menu.title}
            backTo="/module/services/room_service"
            backLabel="Back"
            saveStatus={saveStatus}
            tabs={TABS}
            onSave={(activeTab) => {
                if (activeTab === 'information') saveInformation();
                if (activeTab === 'hours') saveHours();
                if (activeTab === 'catalogs') saveCatalog();
            }}
        >
            {(activeTab) => (
                <>
                    {activeTab === 'information' && (
                        <div className="space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Informace</h2>
                            
                            <div className="space-y-4 border-b border-gray-100 pb-6 mb-6">
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

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Karta v seznamu služeb</h3>
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
                                </div>
                        </div>
                    )}

                    {activeTab === 'hours' && (
                        <SectionCard title="Set opening hours" description="Rozpis po dnech — hotel_room_service_hours" className="max-w-3xl">
                            <WeeklyHoursPicker days={openingHours} onChange={updateHoursRow} />
                        </SectionCard>
                    )}

                    {activeTab === 'catalogs' && (
                        <RoomServiceCatalogTab
                            categories={categories}
                            setCategories={setCategories}
                            onSave={saveCatalog}
                            saveStatus={saveStatus}
                        />
                    )}
                </>
            )}
        </ModuleEditLayout>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
