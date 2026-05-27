import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { InformationTab } from './tabs/InformationTab';
import { CatalogTab } from './tabs/CatalogTab';
import { HoursTab } from './tabs/HoursTab';
import { UpsellTab } from './tabs/UpsellTab';

const emptyFormData = {
    name: '',
    subtitle: '',
    description: '',
    images: [
        { id: 1, url: null },
        { id: 2, url: null }
    ],
    additionalInfo: [],
    dressCode: '',
    catalogs: {
        enabled: true,
        catalogs: [],
        newCatalogName: '',
        currencies: [{ id: 1, name: 'EURO' }],
        categories: []
    },
    hours: {
        temporarilyClosed: false,
        days: [
            { day: 'Monday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false },
            { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false },
            { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false },
            { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false },
            { day: 'Friday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false },
            { day: 'Saturday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false },
            { day: 'Sunday', enabled: true, startTime: '09:00', endTime: '18:00', open24h: false, closed: false }
        ],
        bookingSystem: 'hours_only',
        externalBookingUrl: ''
    },
    upsell: {
        activated: false,
        backgroundImage: null,
        name: '',
        subtitle: '',
        description: ''
    }
};

export function CardEdit() {
    const { type, module, id } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('information');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const saveTimeoutRef = useRef(null);

    const [formData, setFormData] = useState(emptyFormData);

    // Pravidlo: Které moduly budou mít Katalog?
    const modulesWithCatalog = ['restaurants_bars', 'room_service', 'wellness_spa'];
    const showCatalog = type === 'services' || modulesWithCatalog.includes(module);

    const tabs = [
        { id: 'information', label: 'Information' },
        ...(showCatalog ? [{ id: 'catalogs', label: 'Katalog' }] : []),
        { id: 'hours', label: 'Hours & booking system' },
        { id: 'upsell', label: 'Upsell' }
    ];

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        const loadData = async () => {
            try {
                let endpoint = null;
                if (module === 'restaurants_bars') endpoint = `/api/venues/${id}`;
                else if (module === 'wellness_spa') endpoint = `/api/wellness/facilities/${id}`;

                if (endpoint) {
                    const res = await axios.get(endpoint);
                    const dbData = module === 'restaurants_bars' ? res.data.venue : res.data.facility;
                    
                    if (isMounted) {
                        setFormData({
                            ...emptyFormData,
                            name: dbData.title || '',
                            description: dbData.description || dbData.description_long || '',
                            subtitle: dbData.venue_type || dbData.schedule_summary || '',
                        });
                    }
                } else {
                    // Modul bez databáze - použijeme prázdnou šablonu
                    if (isMounted) {
                        setFormData(emptyFormData);
                    }
                }
            } catch (err) {
                console.error('Chyba při načítání:', err);
                if (isMounted) setError('Nepodařilo se načíst data karty.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [id, module]);

    const saveData = async (data) => {
        setSaving(true);
        setSaveStatus('saving');
        
        try {
            let endpoint = null;
            if (module === 'restaurants_bars') endpoint = `/api/venues/${id}`;
            else if (module === 'wellness_spa') endpoint = `/api/wellness/facilities/${id}`;

            if (endpoint) {
                // Přemapování z CardEdit UI struktury zpět do DB struktury
                const dbPayload = {
                    title: data.name,
                    description: data.description,
                    // venue_type nebo schedule_summary podle modulu
                    ...(module === 'restaurants_bars' ? { venue_type: data.subtitle } : { description_long: data.description, schedule_summary: data.subtitle })
                };
                
                await axios.put(endpoint, dbPayload);
            } else {
                // Simulace uložení pro moduly bez DB
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error('Error saving data:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const updateData = (newData) => {
        setFormData(newData);
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveData(newData);
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">{formData.name}</h1>
                        {saveStatus && (
                            <div className={`flex items-center gap-2 text-sm ${
                                saveStatus === 'saving' ? 'text-blue-600' :
                                saveStatus === 'saved' ? 'text-green-600' :
                                'text-red-600'
                            }`}>
                                {saveStatus === 'saving' && (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Saving...</span>
                                    </>
                                )}
                                {saveStatus === 'saved' && (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Saved</span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Error saving</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            HELP
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-1 font-medium text-sm transition-colors ${
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

            {/* Content Switcher */}
            <div className="mt-6">
                {activeTab === 'information' && (
                    <InformationTab
                        formData={formData}
                        updateData={updateData}
                        setSaving={setSaving}
                        setSaveStatus={setSaveStatus}
                    />
                )}
                
                {activeTab === 'catalogs' && showCatalog && (
                    <CatalogTab
                        formData={formData}
                        updateData={updateData}
                    />
                )}
                
                {activeTab === 'hours' && (
                    <HoursTab
                        formData={formData}
                        updateData={updateData}
                    />
                )}
                
                {activeTab === 'upsell' && (
                    <UpsellTab
                        formData={formData}
                        updateData={updateData}
                        setSaving={setSaving}
                        setSaveStatus={setSaveStatus}
                    />
                )}
            </div>
        </div>
    );
}
