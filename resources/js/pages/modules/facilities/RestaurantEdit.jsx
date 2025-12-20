import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function RestaurantEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('information');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
    const saveTimeoutRef = useRef(null);

    // Mock data - v budoucnu se načte z API podle ID
    const [formData, setFormData] = useState({
        name: 'Hotel restaurant',
        subtitle: 'Where flavor reigns supreme',
        description: 'Fusion of wines and cheeses carefully selected by our chef. The best in town. Enter a new way to enjoy a delicious cuisine with us, with quality and handmade facilities and services with the best ingredientes.',
        images: [
            { id: 1, url: '/images/restaurant-1.jpg' },
            { id: 2, url: null }
        ],
        additionalInfo: [
            {
                id: 1,
                icon: 'fork-knife',
                title: 'A unique restaurant',
                description: 'A space where you can enjoy the bes',
                linkToService: false
            },
            {
                id: 2,
                icon: 'crab',
                title: 'Tradition and creativity',
                description: 'Fresh products collected on the day',
                linkToService: false
            }
        ],
        dressCode: 'No sandals allowed',
        catalogs: {
            enabled: true,
            catalogs: [
                { id: 1, name: 'Menu X', icon: 'menu' },
                { id: 2, name: 'Wine X', icon: 'wine' }
            ],
            newCatalogName: 'Menu',
            currencies: [
                { id: 1, name: 'EURO' }
            ],
            categories: [
                { id: 1, name: 'Main courses', expanded: false },
                { id: 2, name: 'Drinks', expanded: false }
            ]
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
            bookingSystem: 'hours_only', // 'hours_only', 'on_demand', 'external'
            externalBookingUrl: ''
        },
        upsell: {
            activated: true,
            backgroundImage: null,
            name: 'Buy one dessert, get one free!',
            subtitle: 'Valid only for today',
            description: 'Double the sweetness: Enjoy 2 desserts for the price of 1! Pick any treat from our complete menu.'
        }
    });

    // Autosave function with debounce
    const saveData = async (data) => {
        setSaving(true);
        setSaveStatus('saving');
        
        try {
            // Vytvoř FormData pro odeslání
            const formDataToSend = new FormData();
            formDataToSend.append('data', JSON.stringify(data));
            
            await axios.post(`/api/restaurants/${id}/save`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
            console.error('Error saving data:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        const newData = {
            ...formData,
            [field]: value
        };
        
        setFormData(newData);
        
        // Debounce autosave
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            saveData(newData);
        }, 1000); // Uloží se 1 sekundu po poslední změně
    };

    const handleAdditionalInfoChange = (id, field, value) => {
        const newData = {
            ...formData,
            additionalInfo: formData.additionalInfo.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        };
        
        setFormData(newData);
        
        // Debounce autosave
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            saveData(newData);
        }, 1000);
    };

    const addAdditionalInfo = () => {
        const newId = Math.max(...formData.additionalInfo.map(i => i.id), 0) + 1;
        const newData = {
            ...formData,
            additionalInfo: [
                ...formData.additionalInfo,
                {
                    id: newId,
                    icon: 'fork-knife',
                    title: '',
                    description: '',
                    linkToService: false
                }
            ]
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const removeAdditionalInfo = (id) => {
        const newData = {
            ...formData,
            additionalInfo: formData.additionalInfo.filter(item => item.id !== id)
        };
        
        setFormData(newData);
        saveData(newData);
    };

    // Handle image upload
    const handleImageUpload = async (imageId, file) => {
        if (!file) return;
        
        // Validate file size (1 MB)
        if (file.size > 1024 * 1024) {
            alert('File size must be less than 1 MB');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        setSaving(true);
        setSaveStatus('saving');
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('image', file);
            formDataToSend.append('image_id', imageId);
            
            const response = await axios.post(`/api/restaurants/${id}/upload-image`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            // Update image URL in formData
            const newData = {
                ...formData,
                images: formData.images.map(img =>
                    img.id === imageId ? { ...img, url: response.data.url } : img
                )
            };
            
            setFormData(newData);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
            console.error('Error uploading image:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleImageClick = (imageId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(imageId, file);
            }
        };
        input.click();
    };

    const handleImageDelete = (imageId) => {
        const newData = {
            ...formData,
            images: formData.images.map(img =>
                img.id === imageId ? { ...img, url: null } : img
            )
        };
        
        setFormData(newData);
        saveData(newData);
    };

    // Catalog handlers
    const handleCatalogNameChange = (value) => {
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                newCatalogName: value
            }
        };
        setFormData(newData);
    };

    const addCatalog = () => {
        if (!formData.catalogs.newCatalogName.trim()) return;
        
        const newId = Math.max(...formData.catalogs.catalogs.map(c => c.id), 0) + 1;
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                catalogs: [
                    ...formData.catalogs.catalogs,
                    { id: newId, name: formData.catalogs.newCatalogName, icon: 'menu' }
                ],
                newCatalogName: ''
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const removeCatalog = (catalogId) => {
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                catalogs: formData.catalogs.catalogs.filter(c => c.id !== catalogId)
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const toggleCatalogEnabled = () => {
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                enabled: !formData.catalogs.enabled
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const addCurrency = () => {
        const newId = Math.max(...formData.catalogs.currencies.map(c => c.id), 0) + 1;
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                currencies: [
                    ...formData.catalogs.currencies,
                    { id: newId, name: 'EUR' }
                ]
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const removeCurrency = (currencyId) => {
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                currencies: formData.catalogs.currencies.filter(c => c.id !== currencyId)
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const addCategory = () => {
        const newId = Math.max(...formData.catalogs.categories.map(c => c.id), 0) + 1;
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                categories: [
                    ...formData.catalogs.categories,
                    { id: newId, name: 'New Category', expanded: false }
                ]
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const removeCategory = (categoryId) => {
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                categories: formData.catalogs.categories.filter(c => c.id !== categoryId)
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const toggleCategoryExpanded = (categoryId) => {
        const newData = {
            ...formData,
            catalogs: {
                ...formData.catalogs,
                categories: formData.catalogs.categories.map(c =>
                    c.id === categoryId ? { ...c, expanded: !c.expanded } : c
                )
            }
        };
        
        setFormData(newData);
    };

    // Hours & booking handlers
    const toggleTemporarilyClosed = () => {
        const newData = {
            ...formData,
            hours: {
                ...formData.hours,
                temporarilyClosed: !formData.hours.temporarilyClosed
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const handleDayChange = (dayIndex, field, value) => {
        const newData = {
            ...formData,
            hours: {
                ...formData.hours,
                days: formData.hours.days.map((day, index) =>
                    index === dayIndex ? { ...day, [field]: value } : day
                )
            }
        };
        
        setFormData(newData);
        
        // Debounce autosave
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            saveData(newData);
        }, 1000);
    };

    const handleBookingSystemChange = (system) => {
        const newData = {
            ...formData,
            hours: {
                ...formData.hours,
                bookingSystem: system
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const handleExternalBookingUrlChange = (url) => {
        const newData = {
            ...formData,
            hours: {
                ...formData.hours,
                externalBookingUrl: url
            }
        };
        
        setFormData(newData);
        
        // Debounce autosave
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            saveData(newData);
        }, 1000);
    };

    // Upsell handlers
    const toggleUpsellActivated = () => {
        const newData = {
            ...formData,
            upsell: {
                ...formData.upsell,
                activated: !formData.upsell.activated
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    const handleUpsellChange = (field, value) => {
        const newData = {
            ...formData,
            upsell: {
                ...formData.upsell,
                [field]: value
            }
        };
        
        setFormData(newData);
        
        // Debounce autosave
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            saveData(newData);
        }, 1000);
    };

    const handleUpsellBackgroundUpload = async (file) => {
        if (!file) return;
        
        // Validate file size (1 MB)
        if (file.size > 1024 * 1024) {
            alert('File size must be less than 1 MB');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        setSaving(true);
        setSaveStatus('saving');
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('image', file);
            formDataToSend.append('type', 'upsell_background');
            
            const response = await axios.post(`/api/restaurants/${id}/upload-image`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            const newData = {
                ...formData,
                upsell: {
                    ...formData.upsell,
                    backgroundImage: response.data.url
                }
            };
            
            setFormData(newData);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
            saveData(newData);
        } catch (error) {
            console.error('Error uploading upsell background:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleUpsellBackgroundClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                handleUpsellBackgroundUpload(file);
            }
        };
        input.click();
    };

    const handleUpsellBackgroundDelete = () => {
        const newData = {
            ...formData,
            upsell: {
                ...formData.upsell,
                backgroundImage: null
            }
        };
        
        setFormData(newData);
        saveData(newData);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const tabs = [
        { id: 'information', label: 'Information' },
        { id: 'catalogs', label: 'Catalogs' },
        { id: 'hours', label: 'Hours & booking system' },
        { id: 'upsell', label: 'Upsell' }
    ];

    const getIconSvg = (iconName) => {
        switch (iconName) {
            case 'fork-knife':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                    </svg>
                );
            case 'crab':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.42.17L8.41 3 7 4.41l1.63 1.63C7.88 6.55 7.26 7.22 6.81 8H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h4.18c.16.65.46 1.24.88 1.74L6 19.41 7.41 21l2.17-2.17c.46.11.93.17 1.42.17s.96-.06 1.42-.17L14.59 21 16 19.41l-2.06-2.07c.42-.5.72-1.09.88-1.74H20c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2zM4 13v-3h2.12c.08.32.2.63.35.92L4 13zm16 0h-2.47l-2.47-2.08c.15-.29.27-.6.35-.92H20v3z"/>
                    </svg>
                );
            default:
                return null;
        }
    };

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

                {/* Tabs */}
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

            {/* Tab Content */}
            {activeTab === 'information' && (
                <div className="space-y-8">
                    {/* Information and Images Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Information Section */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Information</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Add the basic information about the service. You can include the translation into other languages by clicking on the flag icon next to each text box.
                            </p>

                            {/* Name Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <div className="relative">
                                    <button className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Subtitle Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subtitle
                                </label>
                                <div className="relative">
                                    <button className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        value={formData.subtitle}
                                        onChange={(e) => handleInputChange('subtitle', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Description Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <div className="relative">
                                    <button className="absolute left-3 top-3">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                        </svg>
                                    </button>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows="5"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                <p>Maximum file size: 1 MB</p>
                                <p>Recommended dimensions: 800 × 420 pixels</p>
                                <p>Format: landscape</p>
                                <p>The first image will be the cover image</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {formData.images.map((image, index) => (
                                    <div key={image.id} className="relative">
                                        {image.url ? (
                                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                                                <img
                                                    src={image.url}
                                                    alt={`Image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleImageDelete(image.id)}
                                                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleImageClick(image.id)}
                                                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="text-white text-sm font-medium">Change image</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => handleImageClick(image.id)}
                                                className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
                                            >
                                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm text-gray-500">Upload image</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Additional Info Section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Additional Info</h2>
                                <p className="text-sm text-gray-600">
                                    Include additional information about the service such as contact details, directions to get there, or specific rules. This information will be visible to guests at the bottom of the screen, after the product catalog.
                                </p>
                            </div>
                            <button
                                onClick={addAdditionalInfo}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
                            >
                                + ADD ADDITIONAL INFO
                            </button>
                        </div>

                        {/* Title and description items */}
                        <div className="space-y-4 mb-6">
                            {formData.additionalInfo.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="flex-shrink-0 mt-1 text-gray-600">
                                        {getIconSvg(item.icon)}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleAdditionalInfoChange(item.id, 'title', e.target.value)}
                                                placeholder="Title"
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleAdditionalInfoChange(item.id, 'description', e.target.value)}
                                                placeholder="Description"
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={item.linkToService}
                                                onChange={(e) => handleAdditionalInfoChange(item.id, 'linkToService', e.target.checked)}
                                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700">Link to service</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => removeAdditionalInfo(item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dress code */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dress code</h3>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={formData.dressCode}
                                    onChange={(e) => handleInputChange('dressCode', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Catalogs Tab */}
            {activeTab === 'catalogs' && (
                <div className="space-y-8">
                    {/* Product catalog section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product catalog</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            In this section, you can add the list of products available in this service or facility. You can choose between 3 catalog types: PDF, linked, or manual. You can create several catalogs if you need to.
                        </p>

                        {/* Existing catalogs */}
                        {formData.catalogs.catalogs.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.catalogs.catalogs.map((catalog) => (
                                    <div
                                        key={catalog.id}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                                    >
                                        <span>{catalog.name}</span>
                                        <button
                                            onClick={() => removeCatalog(catalog.id)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add catalog input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select an icon and enter a name for your catalog
                            </label>
                            <div className="relative">
                                <button className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button className="absolute left-12 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={formData.catalogs.newCatalogName}
                                    onChange={(e) => handleCatalogNameChange(e.target.value)}
                                    maxLength={24}
                                    className="w-full pl-20 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Menu"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Maximum 24 characters</p>
                        </div>

                        {/* Add catalog button and toggle */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={addCatalog}
                                disabled={!formData.catalogs.newCatalogName.trim()}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + ADD CATALOG
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">ENABLED</span>
                                <button
                                    onClick={toggleCatalogEnabled}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.catalogs.enabled ? 'bg-orange-500' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            formData.catalogs.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products separator */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-50 px-4 text-sm text-gray-700">Products</span>
                        </div>
                    </div>

                    {/* Currencies section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Currencies</h2>
                            <button
                                onClick={addCurrency}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                            >
                                + ADD CURRENCY
                            </button>
                        </div>

                        {/* Existing currencies */}
                        {formData.catalogs.currencies.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.catalogs.currencies.map((currency) => (
                                    <div
                                        key={currency.id}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                                    >
                                        <span>{currency.name}</span>
                                        <button
                                            onClick={() => removeCurrency(currency.id)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add products to catalog section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Add products to the catalog</h2>
                                <p className="text-sm text-gray-600">
                                    To add products, you first need to add a category to the catalog. Click on ADD CATEGORY, type a name, and click on the arrow next to it. You will then be able to start adding products.
                                </p>
                            </div>
                            <button
                                onClick={addCategory}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
                            >
                                + ADD CATEGORY
                            </button>
                        </div>

                        {/* Categories list */}
                        <div className="space-y-2">
                            {formData.catalogs.categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                >
                                    <button
                                        onClick={() => toggleCategoryExpanded(category.id)}
                                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                                    >
                                        <svg
                                            className={`w-5 h-5 transition-transform ${category.expanded ? 'rotate-90' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="font-medium">+ {category.name}</span>
                                    </button>
                                    <button
                                        onClick={() => removeCategory(category.id)}
                                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Hours & booking system Tab */}
            {activeTab === 'hours' && (
                <div className="space-y-8">
                    {/* Temporarily closed toggle */}
                    <div className="flex justify-end">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Temporarily closed</span>
                            <button
                                onClick={toggleTemporarilyClosed}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.hours.temporarilyClosed ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        formData.hours.temporarilyClosed ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Set opening hours section */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Set opening hours</h2>
                            
                            <div className="space-y-4">
                                {formData.hours.days.map((day, index) => (
                                    <div key={day.day} className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={day.enabled}
                                            onChange={(e) => handleDayChange(index, 'enabled', e.target.checked)}
                                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="w-20 text-sm text-gray-700">{day.day}</span>
                                        <input
                                            type="time"
                                            value={day.startTime}
                                            onChange={(e) => handleDayChange(index, 'startTime', e.target.value)}
                                            disabled={!day.enabled || day.open24h || day.closed}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input
                                            type="time"
                                            value={day.endTime}
                                            onChange={(e) => handleDayChange(index, 'endTime', e.target.value)}
                                            disabled={!day.enabled || day.open24h || day.closed}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                        <div className="flex items-center gap-4 ml-auto">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`day-${index}`}
                                                    checked={day.open24h}
                                                    onChange={() => {
                                                        handleDayChange(index, 'open24h', true);
                                                        handleDayChange(index, 'closed', false);
                                                    }}
                                                    disabled={!day.enabled}
                                                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 disabled:cursor-not-allowed"
                                                />
                                                <span className="text-sm text-gray-700">Open 24h</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`day-${index}`}
                                                    checked={day.closed}
                                                    onChange={() => {
                                                        handleDayChange(index, 'closed', true);
                                                        handleDayChange(index, 'open24h', false);
                                                    }}
                                                    disabled={!day.enabled}
                                                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 disabled:cursor-not-allowed"
                                                />
                                                <span className="text-sm text-gray-700">Closed</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking system options */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking System</h2>
                            
                            {/* Show opening hours only */}
                            <div
                                onClick={() => handleBookingSystemChange('hours_only')}
                                className={`bg-white rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all ${
                                    formData.hours.bookingSystem === 'hours_only'
                                        ? 'border-orange-500'
                                        : 'border-transparent hover:border-gray-200'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                formData.hours.bookingSystem === 'hours_only'
                                                    ? 'border-orange-500 bg-orange-500'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            {formData.hours.bookingSystem === 'hours_only' && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">Show opening hours only</h3>
                                        <p className="text-sm text-gray-600">
                                            No bookings are allowed. Guests only see the service opening hours.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* On-demand booking system */}
                            <div
                                onClick={() => handleBookingSystemChange('on_demand')}
                                className={`bg-white rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all ${
                                    formData.hours.bookingSystem === 'on_demand'
                                        ? 'border-orange-500'
                                        : 'border-transparent hover:border-gray-200'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                formData.hours.bookingSystem === 'on_demand'
                                                    ? 'border-orange-500 bg-orange-500'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            {formData.hours.bookingSystem === 'on_demand' && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">On-demand booking system</h3>
                                        <p className="text-sm text-gray-600">
                                            Booking requests have to be confirmed or rejected by the staff.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* External booking system */}
                            <div
                                onClick={() => handleBookingSystemChange('external')}
                                className={`bg-white rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all ${
                                    formData.hours.bookingSystem === 'external'
                                        ? 'border-orange-500'
                                        : 'border-transparent hover:border-gray-200'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                formData.hours.bookingSystem === 'external'
                                                    ? 'border-orange-500 bg-orange-500'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            {formData.hours.bookingSystem === 'external' && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">External booking system</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Guests can book through a third-party booking system via a URL.
                                        </p>
                                        {formData.hours.bookingSystem === 'external' && (
                                            <input
                                                type="url"
                                                value={formData.hours.externalBookingUrl}
                                                onChange={(e) => handleExternalBookingUrlChange(e.target.value)}
                                                placeholder="Add third-party booking system URL"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upsell Tab */}
            {activeTab === 'upsell' && (
                <div className="space-y-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        {/* Header with title, description and toggle */}
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upsell</h2>
                                <p className="text-sm text-gray-600">
                                    This feature shows a pop-up on the service screen to promote offers or any other content you want to highlight.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 ml-6">
                                <span className="text-sm text-gray-700">Activated</span>
                                <button
                                    onClick={toggleUpsellActivated}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.upsell.activated ? 'bg-orange-500' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            formData.upsell.activated ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Background upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Background
                            </label>
                            {formData.upsell.backgroundImage ? (
                                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden group">
                                    <img
                                        src={formData.upsell.backgroundImage}
                                        alt="Upsell background"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <button
                                        onClick={handleUpsellBackgroundDelete}
                                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleUpsellBackgroundClick}
                                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="text-white text-sm font-medium">Change image</span>
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={handleUpsellBackgroundClick}
                                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
                                >
                                    <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Name field */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                            </label>
                            <div className="relative">
                                <button className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={formData.upsell.name}
                                    onChange={(e) => handleUpsellChange('name', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                        </div>

                        {/* Subtitle field */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subtitle
                            </label>
                            <div className="relative">
                                <button className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={formData.upsell.subtitle}
                                    onChange={(e) => handleUpsellChange('subtitle', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                        </div>

                        {/* Description field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <div className="relative">
                                <button className="absolute left-3 top-3">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.5 2C10.24 2 8.5 3.74 8.5 6c0 1.57.77 2.96 1.95 3.84L12.5 12l2.05-2.16C15.73 9.96 16.5 8.57 16.5 6c0-2.26-1.74-4-4-4zm0 1.5c1.38 0 2.5 1.12 2.5 2.5S13.88 8.5 12.5 8.5 10 7.38 10 6s1.12-2.5 2.5-2.5zM3 13.5C3 9.36 6.36 6 10.5 6h4c4.14 0 7.5 3.36 7.5 7.5v6c0 .83-.67 1.5-1.5 1.5h-19c-.83 0-1.5-.67-1.5-1.5v-6z"/>
                                    </svg>
                                </button>
                                <textarea
                                    value={formData.upsell.description}
                                    onChange={(e) => handleUpsellChange('description', e.target.value)}
                                    rows="4"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other tabs - placeholder */}
            {activeTab !== 'information' && activeTab !== 'catalogs' && activeTab !== 'hours' && activeTab !== 'upsell' && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <p className="text-gray-600">Content for {tabs.find(t => t.id === activeTab)?.label} tab will be implemented here.</p>
                </div>
            )}
        </div>
    );
}

