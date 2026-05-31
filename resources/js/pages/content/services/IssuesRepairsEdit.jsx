import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FormSaveBar } from '../../../components/FormSaveBar';
import { IssuesRepairsCatalogTab } from './IssuesRepairsCatalogTab';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'hours', label: 'Rozpis' },
    { id: 'catalog', label: 'Katalog' },
];

const TAB_IDS = TABS.map((t) => t.id);

function tabFromHash(hash) {
    const id = hash.replace(/^#/, '');
    return TAB_IDS.includes(id) ? id : 'information';
}

export function IssuesRepairsEdit() {
    const { id: slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => tabFromHash(location.hash));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [maintenance, setMaintenance] = useState(null);
    const [openingHours, setOpeningHours] = useState([]);
    const [categories, setCategories] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);
    const [iconLibraries, setIconLibraries] = useState(['ionicons', 'material-community']);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/hotel-maintenance/${slug}`)
            .then((res) => {
                setMaintenance(res.data.maintenance);
                setOpeningHours(res.data.opening_hours ?? []);
                setCategories(res.data.categories ?? []);
                setImageKeys(res.data.image_keys ?? []);
                setIconLibraries(res.data.icon_libraries ?? ['ionicons', 'material-community']);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Službu se nepodařilo načíst.');
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
            { pathname: `/module/services/issues_repairs/${slug}/edit`, hash: tabId },
            { replace: true }
        );
    };

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') setTimeout(() => setSaveStatus(null), 2000);
        if (status === 'error') setTimeout(() => setSaveStatus(null), 4000);
    };

    const saveMaintenance = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-maintenance/${slug}`, payload);
            setMaintenance(data.maintenance);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildMaintenancePayload = (m) => ({
        title: m.title,
        description: m.description,
        description_extra: m.description_extra,
        schedule_summary: m.schedule_summary,
        header_image_key: m.header_image_key,
        is_active: m.is_active,
    });

    const updateField = (field, value) => {
        setMaintenance((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!maintenance) return;
        saveMaintenance(buildMaintenancePayload(maintenance));
    };

    const updateHoursRow = (dayOrder, value) => {
        setOpeningHours((prev) =>
            prev.map((row) => (row.day_order === dayOrder ? { ...row, hours_text: value } : row))
        );
    };

    const saveHours = async () => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-maintenance/${slug}/hours`, {
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
            const { data } = await axios.put(`/api/hotel-maintenance/${slug}/catalog`, {
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
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !maintenance) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Služba nenalezena.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/services/issues_repairs')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na údržbu a opravy
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/module/services/issues_repairs')}
                        className="text-sm text-gray-500 hover:text-orange-500 mb-2"
                    >
                        ← Údržba & opravy
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{maintenance.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">{maintenance.slug}</p>
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

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => selectTab(tab.id)}
                        className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
                    <Field label="Název služby">
                        <input
                            className={inputClass}
                            value={maintenance.title}
                            onChange={(e) => updateField('title', e.target.value)}
                        />
                    </Field>
                    <Field label="Slug">
                        <input
                            className={`${inputClass} bg-gray-50 dark:bg-gray-900`}
                            value={maintenance.slug}
                            readOnly
                        />
                    </Field>
                    <Field label="Hlavní popis">
                        <textarea
                            className={inputClass}
                            rows={4}
                            value={maintenance.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                        />
                    </Field>
                    <Field label="Doplňující text">
                        <textarea
                            className={inputClass}
                            rows={3}
                            value={maintenance.description_extra || ''}
                            onChange={(e) => updateField('description_extra', e.target.value || null)}
                        />
                    </Field>
                    <Field label="Shrnutí rozpisu">
                        <input
                            className={inputClass}
                            value={maintenance.schedule_summary || ''}
                            onChange={(e) => updateField('schedule_summary', e.target.value || null)}
                            placeholder="06:00 - 20:00"
                        />
                    </Field>
                    <Field label="Klíč hlavičkového obrázku">
                        <select
                            className={inputClass}
                            value={maintenance.header_image_key || ''}
                            onChange={(e) => updateField('header_image_key', e.target.value || null)}
                        >
                            <option value="">— žádný —</option>
                            {imageKeys.map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={maintenance.is_active}
                            onChange={(e) => updateField('is_active', e.target.checked)}
                            className="rounded text-orange-500"
                        />
                        Aktivní (zobrazit v aplikaci)
                    </label>
                    <FormSaveBar onSave={saveInformation} saveStatus={saveStatus} label="Uložit informace" />
                </div>
            )}

            {activeTab === 'hours' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-3">
                    <p className="text-sm text-gray-500 mb-4">
                        Otevírací doba — tabulka <code className="text-xs">hotel_maintenance_hours</code>
                    </p>
                    {openingHours.map((row) => (
                        <div key={row.day_order} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {row.day_name}
                            </span>
                            <input
                                className={`${inputClass} col-span-2`}
                                value={row.hours_text}
                                onChange={(e) => updateHoursRow(row.day_order, e.target.value)}
                                placeholder="06:00 - 20:00"
                            />
                        </div>
                    ))}
                    <FormSaveBar onSave={saveHours} saveStatus={saveStatus} label="Uložit rozpis" />
                </div>
            )}

            {activeTab === 'catalog' && (
                <IssuesRepairsCatalogTab
                    categories={categories}
                    setCategories={setCategories}
                    onSave={saveCatalog}
                    saveStatus={saveStatus}
                    iconLibraries={iconLibraries}
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
