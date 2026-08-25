import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { WellnessServicesTab } from './WellnessServicesTab';
import { WeeklyHoursPicker } from '../../../../components/ui/WeeklyHoursPicker';
import { parseTextHours, formatTextHours } from '../../../../utils/hoursParser';

const BASE_TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'hours', label: 'Otevírací doba' },
];

export function WellnessFacilityEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [facility, setFacility] = useState(null);
    const [openingHours, setOpeningHours] = useState([]);
    const [services, setServices] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);
    const [detailScreens, setDetailScreens] = useState([]);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/wellness/facilities/${slug}`)
            .then((res) => {
                setFacility(res.data.facility);
                setOpeningHours(parseTextHours(res.data.opening_hours ?? []));
                setServices(res.data.services ?? []);
                setImageKeys(res.data.image_keys ?? []);
                setDetailScreens(res.data.detail_screens ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Oblast se nepodařila načíst.');
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

    const saveFacility = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/wellness/facilities/${slug}`, payload);
            setFacility(data.facility);
            if (payload.opening_hours) setOpeningHours(parseTextHours(payload.opening_hours));
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildFacilityPayload = (f) => ({
        title: f.title,
        list_label: f.list_label,
        schedule_summary: f.schedule_summary,
        description_long: f.description_long,
        image_key: f.image_key,
        detail_screen: f.detail_screen,
        sort_order: f.sort_order,
        is_active: f.is_active,
    });

    const updateField = (field, value) => {
        setFacility((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!facility) return;
        saveFacility(buildFacilityPayload(facility));
    };

    const updateHoursRow = (dayIndex, field, value) => {
        setOpeningHours((prev) =>
            prev.map((row, index) => (index === dayIndex ? { ...row, [field]: value } : row))
        );
    };

    const saveHours = () => saveFacility({ opening_hours: formatTextHours(openingHours) });

    const saveServices = async (servicesPayload) => {
        const payload = servicesPayload ?? services;
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/wellness/facilities/${slug}/services`, {
                services: payload,
            });
            setServices(data.services ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const showServicesTab =
        facility?.detail_screen === 'ThaiMassageDetail' ||
        facility?.has_services ||
        services.length > 0;

    const tabs = showServicesTab
        ? [...BASE_TABS, { id: 'services', label: 'Ceník služeb' }]
        : BASE_TABS;

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !facility) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Oblast nenalezena.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/facilities/wellness_spa')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na seznam
                </button>
            </div>
        );
    }

    const inputClass =
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

    return (
        <ModuleEditLayout
            title={facility.title}
            subtitle={`${facility.detail_screen} · ${facility.slug}`}
            backTo="/module/facilities/wellness_spa"
            backLabel="Wellness & SPA"
            saveStatus={saveStatus}
            tabs={tabs}
            onSave={(activeTab) => {
                if (activeTab === 'information') saveInformation();
                if (activeTab === 'hours') saveHours();
                if (activeTab === 'services') saveServices();
            }}
        >
            {(activeTab) => (
                <>
                    {activeTab === 'information' && (
                        <div className="space-y-4">
                            <SectionCard>
                                <Field label="Název">
                                    <input
                                        className={inputClass}
                                        value={facility.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                    />
                                </Field>
                                <Field label="Slug">
                                    <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={facility.slug} readOnly />
                                </Field>
                                <Field label="Popis (detail v aplikaci)">
                                    <textarea
                                        className={inputClass}
                                        rows={6}
                                        value={facility.description_long || ''}
                                        onChange={(e) => updateField('description_long', e.target.value)}
                                    />
                                </Field>
                                <Field label="Shrnutí otevírací doby (v seznamu)">
                                    <input
                                        className={inputClass}
                                        value={facility.schedule_summary || ''}
                                        onChange={(e) => updateField('schedule_summary', e.target.value)}
                                        placeholder="např. Od 10:00 - Do 20:00"
                                    />
                                </Field>
                                <Field label="Štítek v seznamu">
                                    <input
                                        className={inputClass}
                                        value={facility.list_label || ''}
                                        onChange={(e) => updateField('list_label', e.target.value)}
                                    />
                                </Field>
                                <Field label="Obrazovka detailu v aplikaci">
                                    <select
                                        className={inputClass}
                                        value={facility.detail_screen}
                                        onChange={(e) => updateField('detail_screen', e.target.value)}
                                    >
                                        {detailScreens.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Klíč obrázku">
                                    <select
                                        className={inputClass}
                                        value={facility.image_key || ''}
                                        onChange={(e) => updateField('image_key', e.target.value || null)}
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
                                        value={facility.sort_order}
                                        onChange={(e) => updateField('sort_order', parseInt(e.target.value, 10) || 0)}
                                    />
                                </Field>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={facility.is_active}
                                            onChange={(e) => updateField('is_active', e.target.checked)}
                                            className="rounded text-orange-500"
                                        />
                                        Aktivní (zobrazit v aplikaci)
                                    </label>
                                </SectionCard>
                            </div>
                    )}

                    {activeTab === 'hours' && (
                        <SectionCard title="Otevírací doba" description="Tabulka wellness_facility_hours" className="max-w-3xl">
                            <WeeklyHoursPicker days={openingHours} onChange={updateHoursRow} />
                        </SectionCard>
                    )}

                    {activeTab === 'services' && showServicesTab && (
                        <WellnessServicesTab
                            services={services}
                            setServices={setServices}
                            onSave={saveServices}
                            saveStatus={saveStatus}
                        />
                    )}
                </>
            )}
        </ModuleEditLayout>
    );
}
