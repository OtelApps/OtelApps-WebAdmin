import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { WeeklyHoursPicker } from '../../../../components/ui/WeeklyHoursPicker';
import { AdditionalInfoModal } from '../../../../components/ui/AdditionalInfoModal';
import { AddCatalogModal } from '../../../../components/ui/AddCatalogModal';
import { useServiceEdit } from '../../../../hooks/useServiceEdit';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'catalogs', label: 'Katalogy' },
    { id: 'hours', label: 'Otevírací doba' },
    { id: 'upsell', label: 'Upsell' },
];

export function VenueEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const {
        loading,
        error,
        saveStatus,
        data: venue,
        openingHours,
        imageKeys,
        updateField: updateVenueField,
        updateHoursRow,
        saveMainData,
        saveHours,
    } = useServiceEdit({ endpoint: '/api/venues', slug, dataKey: 'venue' });

    const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
    const [isAddCatalogModalOpen, setIsAddCatalogModalOpen] = useState(false);

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

    const saveInformation = () => {
        if (!venue) return;
        saveMainData(buildVenuePayload(venue));
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

    const inputClass =
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

    return (
        <>
        <ModuleEditLayout
            title={venue.title}
            subtitle={`${venue.venue_type === 'bar' ? 'Bar' : 'Restaurace'} · ${venue.slug}`}
            backTo="/module/facilities/restaurants_bars"
            backLabel="Restaurants & Bars"
            saveStatus={saveStatus}
            tabs={TABS}
            onSave={(activeTab) => (activeTab === 'hours' ? saveHours() : saveInformation())}
        >
            {(activeTab) => (
                <>
                    {activeTab === 'information' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    <SectionCard 
                                        title="Information" 
                                        description="Add the basic information about the service. You can include the translation into other languages by clicking on the flag icon next to each text box."
                                    >
                                        <Field label="Name">
                                            <input
                                                className={inputClass}
                                                value={venue.title}
                                                onChange={(e) => updateVenueField('title', e.target.value)}
                                            />
                                        </Field>
                                        <Field label="Slug (URL)">
                                            <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={venue.slug} readOnly />
                                        </Field>
                                        <Field label="Subtitle">
                                            <input
                                                className={inputClass}
                                                value={venue.list_label || ''}
                                                onChange={(e) => updateVenueField('list_label', e.target.value)}
                                                placeholder="Where flavor reigns supreme"
                                            />
                                        </Field>
                                        <Field label="Description">
                                            <textarea
                                                className={inputClass}
                                                rows={4}
                                                value={venue.description || ''}
                                                onChange={(e) => updateVenueField('description', e.target.value)}
                                            />
                                        </Field>

                                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={venue.is_active}
                                                onChange={(e) => updateVenueField('is_active', e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                            />
                                            Active (show in app)
                                        </label>
                                    </SectionCard>
                                </div>

                                <div className="space-y-4">
                                    <SectionCard title="Images">
                                        <div className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400 mb-6">
                                            <p>Maximum file size: 1 MB</p>
                                            <p>Recommended dimensions: 800 × 420 pixels</p>
                                            <p>Format: landscape</p>
                                            <p>The first image will be the cover image</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {venue.image_key ? (
                                                <div className="aspect-[16/10] w-full bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 group">
                                                    <img 
                                                        src="https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                                        alt={venue.image_key} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateVenueField('image_key', null)}
                                                        className="absolute top-3 right-3 p-1.5 bg-white/95 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                        title="Odstranit obrázek"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : null}
                                            <button
                                                type="button"
                                                className="group relative aspect-[16/10] w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:hover:bg-orange-900/20 dark:hover:border-orange-500/50"
                                            >
                                                <svg className="w-8 h-8 opacity-70 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </SectionCard>
                                </div>
                            </div>

                            <SectionCard 
                                title="Additional Info" 
                                description="Include additional information about the service such as contact details, directions to get there, or specific rules. This information will be visible to guests at the bottom of the screen, after the product catalog"
                                action={
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAdditionalInfoOpen(true)}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-semibold flex items-center gap-2 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        ADD ADDITIONAL INFO
                                    </button>
                                }
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-2 relative">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Title and description block */}
                                        <div className="group relative">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    Title and description
                                                </h3>
                                            </div>
                                            
                                            <div className="flex gap-4 items-start relative">
                                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                        <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                        </div>
                                                        <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-none focus:ring-0 font-semibold placeholder-gray-400" placeholder="Title" defaultValue="Mood Food" />
                                                    </div>
                                                    <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                        <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                        </div>
                                                        <input type="text" className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border-none focus:ring-0 placeholder-gray-400" placeholder="Description" defaultValue="Visit our Hotel restaurant" />
                                                    </div>
                                                </div>

                                                <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-gray-400 cursor-move hover:text-gray-600 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 flex items-center justify-between pl-[96px]">
                                                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                                    <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-4 h-4 bg-white dark:bg-gray-900" />
                                                    Link to service
                                                </label>
                                                <button type="button" className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Email */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</h3>
                                            </div>
                                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                </div>
                                                <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-none focus:ring-0 placeholder-gray-400" placeholder="spa@resort.com" defaultValue="spa@resort.com" />
                                            </div>
                                        </div>

                                        {/* Phone number */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone number</h3>
                                            </div>
                                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                </div>
                                                <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-none focus:ring-0 placeholder-gray-400" placeholder="00 34 659658585" defaultValue="00 34 659658585" />
                                            </div>
                                        </div>

                                        {/* Website */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-gray-500 font-bold leading-none">@</span>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Website</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                    </div>
                                                    <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-none focus:ring-0 font-medium placeholder-gray-400" defaultValue="Website" />
                                                </div>
                                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                        <span className="text-sm font-bold leading-none">@</span>
                                                    </div>
                                                    <input type="text" className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border-none focus:ring-0 placeholder-gray-400" defaultValue="https://www.stay-app.com" />
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-4 h-4 bg-white dark:bg-gray-900" />
                                                    Open URL in browser
                                                </label>
                                            </div>
                                        </div>

                                        {/* Dress code */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dress code</h3>
                                            </div>
                                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                </div>
                                                <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-none focus:ring-0 placeholder-gray-400" defaultValue="Please wear sandals/flip-flops and come in a swimsuit." />
                                            </div>
                                        </div>

                                        {/* URL list */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-gray-500 font-bold leading-none">@</span>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">URL list</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                    </div>
                                                    <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-none focus:ring-0 font-medium placeholder-gray-400" defaultValue="Website" />
                                                </div>
                                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 h-full">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                    </div>
                                                    <input type="text" className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border-none focus:ring-0 placeholder-gray-400" defaultValue="https://www.stay-app.com" />
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-4 h-4 bg-white dark:bg-gray-900" />
                                                    Open URL in browser
                                                </label>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button type="button" className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'catalogs' && (
                        <SectionCard 
                            title="Product catalog"
                            description="In this section, you can add the list of products available in this service or facility. You can choose between 3 catalog types: PDF, linked, or manual. You can create several catalogs if you need to."
                        >
                            <div className="pt-2">
                                {/* Catalog Tabs & Add Button */}
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            Menu
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            Wine
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setIsAddCatalogModalOpen(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        ADD CATALOG
                                    </button>
                                </div>

                                {/* Current Catalog Settings */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Select an icon and enter a name for your catalog</h3>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors tracking-wide">ENABLED</span>
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <button type="button" className="w-11 h-11 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors mt-0.5">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </button>
                                        <div className="flex-1 max-w-[280px]">
                                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                                <div className="bg-white dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                </div>
                                                <input type="text" className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 placeholder-gray-400 font-medium" defaultValue="Menu" />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Maximum 24 characters</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Tabs (Products) */}
                                <div className="border-b border-gray-200 dark:border-gray-700 mb-8 mt-2">
                                    <div className="flex gap-6">
                                        <button className="pb-2 text-sm font-bold text-orange-500 border-b-[3px] border-orange-500 px-1">Products</button>
                                    </div>
                                </div>

                                {/* Currencies */}
                                <div className="mb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[17px] font-bold text-gray-700 dark:text-white">Currencies</h3>
                                        <button type="button" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                            ADD CURRENCY
                                        </button>
                                    </div>
                                    <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex flex-wrap gap-2 min-h-[46px]">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-bold text-gray-500 dark:text-gray-300">
                                            EURO
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Add products to the catalog */}
                                <div>
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="pr-12">
                                            <h3 className="text-[17px] font-bold text-gray-700 dark:text-white mb-2">Add products to the catalog</h3>
                                            <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                                                To add products, you first need to add a category to the catalog. Click on ADD CATEGORY, type a name, and click on the arrow next to it. You will then be able to start adding products.
                                            </p>
                                        </div>
                                        <button type="button" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0 mt-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                            ADD CATEGORY
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <CatalogCategoryBlock title="Main courses" initialExpanded={true} />
                                        <CatalogCategoryBlock title="Drinks" initialExpanded={false} />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {activeTab === 'hours' && (
                        <SectionCard 
                            title="Otevírací doba" 
                            description="Rozpis po dnech — venue_opening_hours"
                            action={
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <span className="text-[14px] font-medium text-gray-500">Temporarily closed</span>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                                    </div>
                                </label>
                            }
                        >
                            <WeeklyHoursPicker days={openingHours} onChange={updateHoursRow} />
                        </SectionCard>
                    )}

                    {activeTab === 'upsell' && (
                        <SectionCard title="Upsell">
                            <p className="text-gray-500">Zde bude správa upsellu...</p>
                        </SectionCard>
                    )}
                </>
            )}
        </ModuleEditLayout>
        <AdditionalInfoModal 
            open={isAdditionalInfoOpen} 
            onClose={() => setIsAdditionalInfoOpen(false)} 
        />
        <AddCatalogModal 
            isOpen={isAddCatalogModalOpen} 
            onClose={() => setIsAddCatalogModalOpen(false)} 
        />
        </>
    );
}

function CatalogCategoryBlock({ title, initialExpanded }) {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    return (
        <div className={`border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm overflow-hidden ${!isExpanded ? 'hover:border-gray-300 transition-colors' : ''}`}>
            {/* Header */}
            <div 
                className={`flex items-center justify-between p-3.5 cursor-pointer group ${isExpanded ? 'border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 pl-1">
                    <div className={`text-gray-400 ${!isExpanded ? 'group-hover:text-gray-600' : ''}`}>
                        {isExpanded ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        )}
                    </div>
                    <h4 className={`text-[15px] font-bold ${isExpanded ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-200'}`}>{title}</h4>
                </div>
                <button type="button" onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors mr-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-5 space-y-8">
                    {/* Top Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button type="button" className="w-11 h-11 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </button>
                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900 w-64">
                                <div className="bg-white dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                </div>
                                <input type="text" className="w-full px-3 py-2 text-[14px] text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 font-medium" defaultValue={title} />
                            </div>
                        </div>
                        <button type="button" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            ADD PRODUCT CATEGORY
                        </button>
                    </div>

                    {/* Product Category: STARTERS */}
                    <div>
                        <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-800 mb-4">
                            <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 border-b-0 rounded-t-lg bg-white dark:bg-gray-900 text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider relative top-[1px]">
                                STARTERS
                            </div>
                            <div className="flex items-center gap-3 pb-2">
                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                                <button type="button" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider ml-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    ADD PRODUCT
                                </button>
                            </div>
                        </div>
                        
                        {/* Headers */}
                        <div className="grid grid-cols-[1fr_120px_260px] gap-4 px-1 mb-2 text-[12px] font-bold text-gray-700 dark:text-gray-300">
                            <div>Product Name</div>
                            <div>Price</div>
                            <div></div>
                        </div>

                        {/* Products List */}
                        <div className="space-y-3">
                            {/* Product 1 */}
                            <div className="grid grid-cols-[1fr_120px_260px] gap-4 items-center">
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    </div>
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="Truffle Omelette" />
                                </div>
                                
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="19" />
                                    <div className="px-2 py-2.5 text-[11px] font-medium text-gray-400 border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                                        € (EUR)
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-500">Enabled</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-400">Featured</span>
                                    </label>
                                    <button type="button" className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Product 2 */}
                            <div className="grid grid-cols-[1fr_120px_260px] gap-4 items-center">
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    </div>
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="Jamón Ibérico 5 Jotas" />
                                </div>
                                
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="25" />
                                    <div className="px-2 py-2.5 text-[11px] font-medium text-gray-400 border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                                        € (EUR)
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-500">Enabled</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-800 dark:text-white">Featured</span>
                                    </label>
                                    <button type="button" className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Product 3 */}
                            <div className="grid grid-cols-[1fr_120px_260px] gap-4 items-center">
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    </div>
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="Cheeseboard" />
                                </div>
                                
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="24" />
                                    <div className="px-2 py-2.5 text-[11px] font-medium text-gray-400 border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                                        € (EUR)
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-500">Enabled</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-400">Featured</span>
                                    </label>
                                    <button type="button" className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pagination / Per page */}
                        <div className="flex justify-end mt-3">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                10/page
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Product Category: MAIN COURSES */}
                    <div>
                        <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-800 mb-4">
                            <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 border-b-0 rounded-t-lg bg-white dark:bg-gray-900 text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider relative top-[1px]">
                                MAIN COURSES
                            </div>
                            <div className="flex items-center gap-3 pb-2">
                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                                <button type="button" className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider ml-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    ADD PRODUCT
                                </button>
                            </div>
                        </div>
                        
                        {/* Headers */}
                        <div className="grid grid-cols-[1fr_120px_260px] gap-4 px-1 mb-2 text-[12px] font-bold text-gray-700 dark:text-gray-300">
                            <div>Product Name</div>
                            <div>Price</div>
                            <div></div>
                        </div>

                        {/* Products List (Copy of Starters) */}
                        <div className="space-y-3">
                            {/* Product 1 */}
                            <div className="grid grid-cols-[1fr_120px_260px] gap-4 items-center">
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    </div>
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="Truffle Omelette" />
                                </div>
                                
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="19" />
                                    <div className="px-2 py-2.5 text-[11px] font-medium text-gray-400 border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                                        € (EUR)
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-500">Enabled</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-400">Featured</span>
                                    </label>
                                    <button type="button" className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Product 2 */}
                            <div className="grid grid-cols-[1fr_120px_260px] gap-4 items-center">
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    </div>
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="Jamón Ibérico 5 Jotas" />
                                </div>
                                
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="25" />
                                    <div className="px-2 py-2.5 text-[11px] font-medium text-gray-400 border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                                        € (EUR)
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-500">Enabled</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-800 dark:text-white">Featured</span>
                                    </label>
                                    <button type="button" className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Product 3 */}
                            <div className="grid grid-cols-[1fr_120px_260px] gap-4 items-center">
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    </div>
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="Cheeseboard" />
                                </div>
                                
                                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-shadow bg-white dark:bg-gray-900">
                                    <input type="text" className="w-full px-3 py-2 text-[13px] text-gray-700 dark:text-white bg-transparent border-none focus:ring-0" defaultValue="24" />
                                    <div className="px-2 py-2.5 text-[11px] font-medium text-gray-400 border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                                        € (EUR)
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-500">Enabled</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-400"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-400">Featured</span>
                                    </label>
                                    <button type="button" className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pagination / Per page */}
                        <div className="flex justify-end mt-3">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                10/page
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

