import React, { useState } from 'react';
import { LeisureInformationTab } from './tabs/LeisureInformationTab';
import { LeisureActivitiesTab } from './tabs/LeisureActivitiesTab';
import { LeisureCalendarTab } from './tabs/LeisureCalendarTab';

export function Leisure() {
    const [activeTab, setActiveTab] = useState('information');
    
    // Mock data based on the provided screenshot
    const [formData, setFormData] = useState({
        name: 'Activities for Everyone',
        images: [
            { id: 1, url: '/images/beach.jpg' }, // Mock image
            { id: 2, url: null }
        ],
        tags: ''
    });

    const updateData = (newData) => {
        setFormData(newData);
    };

    const tabs = [
        { id: 'information', label: 'Information' },
        { id: 'activities_list', label: 'Activities list' },
        { id: 'calendar', label: 'Calendar' }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{formData.name}</h1>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            HELP
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
            <div>
                {activeTab === 'information' && (
                    <LeisureInformationTab
                        formData={formData}
                        updateData={updateData}
                    />
                )}
                {activeTab === 'activities_list' && (
                    <LeisureActivitiesTab />
                )}
                {activeTab === 'calendar' && (
                    <LeisureCalendarTab />
                )}
            </div>
        </div>
    );
}
