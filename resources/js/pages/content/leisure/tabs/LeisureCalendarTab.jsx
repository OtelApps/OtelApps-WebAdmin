import React, { useState } from 'react';
import { CalendarActivityAddModal } from './CalendarActivityAddModal';

export function LeisureCalendarTab() {
    const [addingActivityDate, setAddingActivityDate] = useState(null);

    const days = [
        { name: 'MONDAY', date: '27' },
        { name: 'TUESDAY', date: '28' },
        { name: 'WEDNESDAY', date: '29' },
        { name: 'THURSDAY', date: '30', isToday: true },
        { name: 'FRIDAY', date: '31' },
        { name: 'SATURDAY', date: '1' },
        { name: 'SUNDAY', date: '2' },
    ];

    const events = {
        '30': [
            { name: 'Yoga', time: '8:00 - 9:00' },
            { name: 'Pilates', time: '9:00-10:00' },
            { name: 'Table tennis Lesson', time: '11:00-12:00' },
            { name: 'Zumba', time: '12:30-13:30' },
            { name: 'Bingo', time: '13:30-14:30' },
        ],
        '31': [
            { name: 'Yoga', time: '8:00 - 9:00' },
            { name: 'Pilates', time: '9:00-10:00' },
            { name: 'Zumba', time: '12:30-13:30' },
            { name: 'Bingo', time: '13:30-14:30' },
            { name: 'Darts', time: '15:40-16:50' },
        ],
        '1': [
            { name: 'Yoga', time: '8:00 - 9:00' },
            { name: 'Pilates', time: '9:00-10:00' },
            { name: 'Table tennis Lesson', time: '11:00-12:00' },
            { name: 'Darts', time: '15:40-16:50' },
            { name: 'Football', time: '17:00-18:00' },
        ],
        '2': [
            { name: 'Yoga', time: '8:00 - 9:00' },
            { name: 'Pilates', time: '9:00-10:00' },
            { name: 'Zumba', time: '12:30-13:30' },
            { name: 'Bingo', time: '13:30-14:30' },
            { name: 'Darts', time: '15:40-16:50' },
        ]
    };

    return (
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200 gap-4">
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-white hover:bg-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="px-4 py-1.5 bg-gray-300 text-gray-600 font-medium rounded-md text-sm">
                        May 27 - June 2, 2024
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-white hover:bg-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="text-xl text-gray-800 ml-4 font-normal">
                    May 27 - June 2, 2024
                </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
                {days.map((day, idx) => (
                    <div 
                        key={idx} 
                        className={`flex flex-col items-center py-4 border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${day.isToday ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : ''}`}
                        onDoubleClick={() => setAddingActivityDate(day.date)}
                        title="Double click to add activity"
                    >
                        <span className="text-xs font-bold text-gray-800 mb-2">{day.name}</span>
                        <span className="text-2xl font-bold text-gray-900">{day.date}</span>
                    </div>
                ))}
            </div>

            {/* Events Grid Body */}
            <div className="grid grid-cols-7 min-h-[600px] bg-gray-50/30">
                {days.map((day, idx) => (
                    <div 
                        key={idx} 
                        className={`border-r border-gray-200 last:border-r-0 p-2 space-y-2 ${day.isToday ? 'bg-indigo-50/30' : ''}`}
                    >
                        {(events[day.date] || []).map((event, eventIdx) => (
                            <div key={eventIdx} className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
                                <div className="font-semibold text-sm text-gray-800 group-hover:text-indigo-700 transition-colors">{event.name}</div>
                                <div className="text-xs text-gray-500 text-right mt-3 font-medium">{event.time}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Modals */}
            {addingActivityDate && (
                <CalendarActivityAddModal 
                    selectedDate={addingActivityDate}
                    onClose={() => setAddingActivityDate(null)}
                />
            )}
        </div>
    );
}
