import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { LaundryCatalogTab } from './LaundryCatalogTab';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'hours', label: 'Rozpis' },
    { id: 'catalog', label: 'Katalog' },
];

export function LaundryEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [housekeeping, setHousekeeping] = useState(null);
    const [openingHours, setOpeningHours] = useState([]);
    const [categories, setCategories] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/hotel-housekeeping/${slug}`)
            .then((res) => {
                setHousekeeping(res.data.housekeeping);
                setOpeningHours(res.data.opening_hours ?? []);
                setCategories(res.data.categories ?? []);
                setImageKeys(res.data.image_keys ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Službu se nepodařilo načíst.');
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

    const saveHousekeeping = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-housekeeping/${slug}`, payload);
            setHousekeeping(data.housekeeping);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildHousekeepingPayload = (h) => ({
        title: h.title,
        description: h.description,
        schedule_summary: h.schedule_summary,
        header_image_key: h.header_image_key,
        is_active: h.is_active,
    });

    const updateField = (field, value) => {
        setHousekeeping((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!housekeeping) return;
        saveHousekeeping(buildHousekeepingPayload(housekeeping));
    };

    const updateHoursRow = (dayOrder, value) => {
        setOpeningHours((prev) =>
            prev.map((row) => (row.day_order === dayOrder ? { ...row, hours_text: value } : row))
        );
    };

    const saveHours = async () => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-housekeeping/${slug}/hours`, {
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
            const { data } = await axios.put(`/api/hotel-housekeeping/${slug}/catalog`, {
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

    if (error || !housekeeping) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Služba nenalezena.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/services/laundry')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na úklid pokoje
                </button>
            </div>
        );
    }

    const inputClass =
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

    return (
        <ModuleEditLayout
            title={housekeeping.title}
            subtitle={housekeeping.slug}
            backTo="/module/services/laundry"
            backLabel="Úklid pokoje"
            saveStatus={saveStatus}
            tabs={TABS}
            onSave={(activeTab) => {
                if (activeTab === 'information') saveInformation();
                if (activeTab === 'hours') saveHours();
                if (activeTab === 'catalog') saveCatalog();
            }}
        >
            {(activeTab) => (
                <>
                    {activeTab === 'information' && (
                        <div className="space-y-4">
                            <SectionCard>
                                <Field label="Název služby">
                                    <input
                                        className={inputClass}
                                        value={housekeeping.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                    />
                                </Field>
                                <Field label="Slug">
                                    <input
                                        className={`${inputClass} bg-gray-50 dark:bg-gray-900`}
                                        value={housekeeping.slug}
                                        readOnly
                                    />
                                </Field>
                                <Field label="Popis">
                                    <textarea
                                        className={inputClass}
                                        rows={5}
                                        value={housekeeping.description || ''}
                                        onChange={(e) => updateField('description', e.target.value)}
                                    />
                                </Field>
                                <Field label="Shrnutí rozpisu">
                                    <input
                                        className={inputClass}
                                        value={housekeeping.schedule_summary || ''}
                                        onChange={(e) => updateField('schedule_summary', e.target.value || null)}
                                        placeholder="06:00 - 20:00"
                                    />
                                </Field>
                                <Field label="Klíč hlavičkového obrázku">
                                    <select
                                        className={inputClass}
                                        value={housekeeping.header_image_key || ''}
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
                                            checked={housekeeping.is_active}
                                            onChange={(e) => updateField('is_active', e.target.checked)}
                                            className="rounded text-orange-500"
                                        />
                                        Aktivní (zobrazit v aplikaci)
                                    </label>
                                </SectionCard>
                            </div>
                    )}

                    {activeTab === 'hours' && (
                        <SectionCard title="Otevírací doba" description="Nastavte otevírací dobu pro jednotlivé dny. Lze zvolit konkrétní hodiny, nonstop provoz (24/7), nebo zavřeno." className="max-w-3xl">
                            <p className="text-sm text-gray-500 mb-4">
                                Otevírací doba — tabulka <code className="text-xs">hotel_housekeeping_hours</code>
                            </p>
                            {openingHours.map((row) => (
                                <div key={row.day_order} className="grid grid-cols-3 gap-3 items-center mb-3">
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
                        </SectionCard>
                    )}

                    {activeTab === 'catalog' && (
                        <LaundryCatalogTab
                            categories={categories}
                            setCategories={setCategories}
                            onSave={saveCatalog}
                            saveStatus={saveStatus}
                            imageKeys={imageKeys}
                        />
                    )}
                </>
            )}
        </ModuleEditLayout>
    );
}
