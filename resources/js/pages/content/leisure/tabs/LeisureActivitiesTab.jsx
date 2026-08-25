import React, { useState } from 'react';
import { ActivityEditModal } from './ActivityEditModal';

export function LeisureActivitiesTab() {
    const [activities, setActivities] = useState([
        { id: 1, name: 'Aerobics' },
        { id: 2, name: 'Aquafitness' },
        { id: 3, name: 'Scuba diving' },
        { id: 4, name: 'Beach volley' },
        { id: 5, name: 'Zumba' },
        { id: 6, name: 'Table tennis Lesson' },
        { id: 7, name: 'Yoga' }
    ]);

    const [editingActivity, setEditingActivity] = useState(null);

    const handleNameChange = (id, newName) => {
        setActivities(activities.map(act => 
            act.id === id ? { ...act, name: newName } : act
        ));
    };

    return (
        <div className="space-y-4">
            {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                    
                    {/* Left side: Flag + Input */}
                    <div className="flex-1">
                        <div className="flex">
                            <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                {/* Ikona vlajky */}
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={activity.name}
                                onChange={(e) => handleNameChange(activity.id, e.target.value)}
                                className="flex-1 min-w-0 block w-full px-4 py-2 text-gray-700 rounded-none rounded-r-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500 font-medium"
                            />
                        </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex items-center gap-3 ml-4">
                        <button 
                            onClick={() => setEditingActivity(activity)}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Edit"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

                </div>
            ))}

            {/* Modal Rendering */}
            {editingActivity && (
                <ActivityEditModal 
                    activity={editingActivity}
                    onClose={() => setEditingActivity(null)}
                />
            )}
        </div>
    );
}
