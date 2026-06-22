import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { AmenitiesCatalogTab } from './AmenitiesCatalogTab';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { WeeklyHoursPicker } from '../../../../components/ui/WeeklyHoursPicker';
import { useServiceEdit } from '../../../../hooks/useServiceEdit';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'hours', label: 'Rozpis' },
    { id: 'catalog', label: 'Katalog' },
];

export function AmenitiesEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();

    const {
        loading,
        error,
        saveStatus,
        data: supplies,
        openingHours,
        categories,
        imageKeys,
        updateField,
        updateHoursRow,
        saveMainData,
        saveHours,
        saveCatalog,
        setCategories,
    } = useServiceEdit({
        endpoint: '/api/hotel-supplies',
        slug,
        dataKey: 'supplies',
    });

    // Tab management is now handled by ModuleEditLayout

    const saveInformation = () => {
        if (!supplies) return;
        saveMainData({
            title: supplies.title,
            description: supplies.description,
            schedule_summary: supplies.schedule_summary,
            header_image_key: supplies.header_image_key,
            max_quantity_per_item: supplies.max_quantity_per_item,
            is_active: supplies.is_active,
        });
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !supplies) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Služba nenalezena.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/services/amenities')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na doplňky
                </button>
            </div>
        );
    }

    const inputClass =
        'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white';

    return (
        <ModuleEditLayout
            title={supplies.title}
            backTo="/module/services/amenities"
            backLabel="Doplňky"
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
                                        value={supplies.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                    />
                                </Field>
                                <Field label="Slug">
                                    <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={supplies.slug} readOnly />
                                </Field>
                                <Field label="Popis">
                                    <textarea
                                        className={inputClass}
                                        rows={4}
                                        value={supplies.description || ''}
                                        onChange={(e) => updateField('description', e.target.value)}
                                    />
                                </Field>
                                <Field label="Shrnutí rozpisu (v seznamu služeb)">
                                    <input
                                        className={inputClass}
                                        value={supplies.schedule_summary || ''}
                                        onChange={(e) => updateField('schedule_summary', e.target.value || null)}
                                        placeholder="06:00 - 20:00"
                                    />
                                </Field>
                                <Field label="Klíč hlavičkového obrázku">
                                    <select
                                        className={inputClass}
                                        value={supplies.header_image_key || ''}
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
                                <Field label="Max. množství na položku (objednávka)">
                                    <input
                                        type="number"
                                        min={1}
                                        max={99}
                                        className={inputClass}
                                        value={supplies.max_quantity_per_item}
                                        onChange={(e) =>
                                            updateField('max_quantity_per_item', parseInt(e.target.value, 10) || 1)
                                        }
                                    />
                                </Field>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={supplies.is_active}
                                            onChange={(e) => updateField('is_active', e.target.checked)}
                                            className="rounded text-orange-500"
                                        />
                                        Aktivní (zobrazit v aplikaci)
                                    </label>
                                </SectionCard>
                            </div>
                    )}

                    {activeTab === 'hours' && (
                        <SectionCard title="Otevírací doba" description="Nastavte otevírací dobu pro jednotlivé dny. Lze zvolit konkrétní hodiny, nonstop provoz (24/7), nebo zavřeno.">
                            <WeeklyHoursPicker
                                days={openingHours}
                                onChange={updateHoursRow}
                            />
                        </SectionCard>
                    )}

                    {activeTab === 'catalog' && (
                        <AmenitiesCatalogTab
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
