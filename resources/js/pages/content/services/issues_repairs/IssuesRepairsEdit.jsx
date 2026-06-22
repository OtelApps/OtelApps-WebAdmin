import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { IssuesRepairsCatalogTab } from './IssuesRepairsCatalogTab';
import { inputClass } from '../../../../components/ui/FormField';
import { WeeklyHoursPicker } from '../../../../components/ui/WeeklyHoursPicker';
import { useServiceEdit } from '../../../../hooks/useServiceEdit';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'hours', label: 'Rozpis' },
    { id: 'catalog', label: 'Katalog' },
];

export function IssuesRepairsEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();

    const {
        loading,
        error,
        saveStatus,
        data: maintenance,
        openingHours,
        categories,
        imageKeys,
        iconLibraries,
        updateField,
        updateHoursRow,
        saveMainData,
        saveHours,
        saveCatalog,
        setCategories,
    } = useServiceEdit({
        endpoint: '/api/hotel-maintenance',
        slug,
        dataKey: 'maintenance',
    });



    const saveInformation = () => {
        if (!maintenance) return;
        saveMainData({
            title: maintenance.title,
            description: maintenance.description,
            description_extra: maintenance.description_extra,
            schedule_summary: maintenance.schedule_summary,
            header_image_key: maintenance.header_image_key,
            is_active: maintenance.is_active,
        });
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
        <ModuleEditLayout
            title={maintenance.title}
            subtitle={maintenance.slug}
            backLabel="Údržba & opravy"
            backTo="/module/services/issues_repairs"
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
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'hours' && (
                        <SectionCard title="Otevírací doba" description="Nastavte otevírací dobu pro jednotlivé dny. Lze zvolit konkrétní hodiny, nonstop provoz (24/7), nebo zavřeno." className="max-w-3xl">
                            <WeeklyHoursPicker
                                days={openingHours}
                                onChange={updateHoursRow}
                            />
                        </SectionCard>
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
                </>
            )}
        </ModuleEditLayout>
    );
}
