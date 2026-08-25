import React, { useState } from 'react';

export function CalendarActivityAddModal({ onClose, selectedDate }) {
    const [selectedActivity, setSelectedActivity] = useState(null);

    const activities = [
        'Aerobics', 'Aquafitness', 'Scuba diving', 'Beach volley',
        'Zumba', 'Table tennis Lesson', 'Yoga', 'Pilates',
        'Bachata', 'Latin dancing', 'Bingo', 'Chess',
        'Board games', 'Darts', 'Walking & Biking tours',
        'Football', 'Kayaking,Paddle Board Equipment'
    ];

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            {/* Modal Container */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
                
                {/* Header */}
                <div className="bg-[#1e1b38] px-6 py-4 flex items-center justify-between text-white flex-shrink-0 relative rounded-t-lg">
                    <div className="flex-1"></div>
                    <h2 className="text-sm font-bold tracking-widest text-center flex-1">ADD ACTIVITY</h2>
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

                {/* Content Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Activity List */}
                    <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col overflow-hidden bg-gray-50/30">
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {/* Rendering activities in a sort of flex-wrap layout based on the image */}
                            <div className="flex flex-wrap gap-x-6 gap-y-4">
                                {activities.map((activity, idx) => (
                                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="selectedActivity"
                                            checked={selectedActivity === activity}
                                            onChange={() => setSelectedActivity(activity)}
                                            className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{activity}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Settings */}
                    <div className="w-2/3 p-8 overflow-y-auto flex flex-col">
                        <div className="flex-1 space-y-8">
                            <h3 className="text-lg font-bold text-gray-800">Choose an activity from the list</h3>

                            {/* Scheduled time */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Scheduled time</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        defaultValue="10:00"
                                        className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <span className="text-gray-400 font-medium">/</span>
                                    <input 
                                        type="text" 
                                        defaultValue="11:00"
                                        className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date range */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date range</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input 
                                            type="text" 
                                            defaultValue={selectedDate ? `2024-05-${selectedDate}` : "2024-05-27"}
                                            className="w-40 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <span className="text-gray-400 font-medium">/</span>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input 
                                            type="text" 
                                            defaultValue="2024-06-03"
                                            className="w-40 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Days of the week */}
                            <div>
                                <div className="flex items-center gap-6 mb-4">
                                    <label className="block text-sm font-bold text-gray-700">Days of the week</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500" />
                                        <span className="text-sm font-medium text-gray-600">Week Days</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500" />
                                        <span className="text-sm font-medium text-gray-600">All week</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {daysOfWeek.map((day, idx) => (
                                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                defaultChecked={day === 'Monday'}
                                                className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500" 
                                            />
                                            <span className="text-sm font-medium text-gray-600">{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                            <button 
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button className="px-6 py-2 bg-[#8c62d8] rounded-full text-sm font-medium text-white hover:bg-[#7b53c4] transition-colors shadow-sm">
                                SAVE
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
