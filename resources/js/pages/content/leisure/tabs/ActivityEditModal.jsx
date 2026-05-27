import React, { useState } from 'react';

export function ActivityEditModal({ activity, onClose }) {
    const [formData, setFormData] = useState({
        name: activity.name || '',
        description: 'Yoga is a group of physical, mental, and spiritual practices or disciplines which originated in ancient India. Yoga is one of the six orthodox schools of Hindu philosophical traditions.There is a broad variety of yoga schools, practices, and goals in Hinduism, Buddhism,',
        reminderMinutes: 15,
        tags: 'activity, yoga',
        locationType: 'facility',
        facilityId: 'Other facilities / Ente...'
    });

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleReminderChange = (delta) => {
        setFormData(prev => ({
            ...prev,
            reminderMinutes: Math.max(0, prev.reminderMinutes + delta)
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            {/* Modal Container */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
                
                {/* Header */}
                <div className="bg-[#1e1b38] px-6 py-4 flex items-center justify-between text-white flex-shrink-0 relative rounded-t-lg">
                    <div className="flex-1"></div>
                    <h2 className="text-sm font-bold tracking-widest text-center flex-1">EDIT ACTIVITY</h2>
                    <div className="flex-1 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6 pt-4 flex-shrink-0">
                    <div className="flex gap-2">
                        <button className="px-6 py-3 text-sm font-medium text-indigo-700 bg-white border border-gray-200 border-b-white -mb-px rounded-t-lg relative z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                            Information
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="flex-1 block w-full px-4 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows="5"
                                    className="block w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500 text-gray-600 text-sm leading-relaxed"
                                />
                            </div>

                            {/* Set Reminder */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Set Reminder for Guests</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white w-32">
                                        <button 
                                            type="button"
                                            onClick={() => handleReminderChange(-1)}
                                            className="px-3 py-2 text-gray-500 hover:bg-gray-50 border-r border-gray-300 flex-1 text-center font-bold"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="text"
                                            value={formData.reminderMinutes}
                                            readOnly
                                            className="w-12 text-center border-none p-0 focus:ring-0 text-gray-700 font-medium"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => handleReminderChange(1)}
                                            className="px-3 py-2 text-gray-500 hover:bg-gray-50 border-l border-gray-300 flex-1 text-center font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="text-sm text-gray-500">minutes before the activity starts</span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tags</label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Select keywords that can be associated with the provided service. They will be useful to optimize search results and activate automated bot responses.
                                </p>
                                <div className="min-h-[42px] border border-gray-300 rounded-md p-2 flex flex-wrap gap-2 items-center bg-white">
                                    {/* Mock Tags */}
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-600">
                                        activity
                                        <button className="text-gray-400 hover:text-gray-600">×</button>
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-600">
                                        yoga
                                        <button className="text-gray-400 hover:text-gray-600">×</button>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Images */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Images</label>
                                <div className="flex gap-4">
                                    {/* Mock Uploaded Image */}
                                    <div className="relative w-40 h-28 bg-gray-100 rounded-lg overflow-hidden group border border-gray-200">
                                        <img
                                            src="/images/beach.jpg"
                                            alt="Activity"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                    
                                    {/* Placeholder */}
                                    <div className="w-40 h-28 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:border-gray-300 transition-colors">
                                        <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Location</label>
                                
                                <div className="flex items-center gap-6 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="locationType" 
                                            checked={formData.locationType === 'none'}
                                            onChange={() => handleInputChange('locationType', 'none')}
                                            className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500" 
                                        />
                                        <span className="text-sm font-medium text-gray-600">None</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="locationType" 
                                            checked={formData.locationType === 'map'}
                                            onChange={() => handleInputChange('locationType', 'map')}
                                            className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500" 
                                        />
                                        <span className="text-sm font-medium text-gray-600">Map point</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="locationType" 
                                            checked={formData.locationType === 'facility'}
                                            onChange={() => handleInputChange('locationType', 'facility')}
                                            className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500" 
                                        />
                                        <span className="text-sm font-medium text-gray-900">Choose existing facility</span>
                                    </label>
                                </div>

                                <div>
                                    <div className="relative">
                                        <select 
                                            value={formData.facilityId}
                                            onChange={(e) => handleInputChange('facilityId', e.target.value)}
                                            className="block w-64 px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-700 appearance-none pr-10"
                                        >
                                            <option value="Other facilities / Ente...">Other facilities / Ente...</option>
                                            <option value="facility1">Restaurant Venue</option>
                                            <option value="facility2">Wellness Center</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-auto left-[14rem] flex items-center px-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
