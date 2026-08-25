import React from 'react';

export function WeeklyHoursPicker({ days, onChange }) {
    return (
        <div className="space-y-4">
            {days.map((day, index) => (
                <div key={day.day || index} className="flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={day.enabled !== false}
                        onChange={(e) => onChange(index, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="w-20 text-sm text-gray-700">{day.day}</span>
                    <input
                        type="time"
                        value={day.startTime || ''}
                        onChange={(e) => onChange(index, 'startTime', e.target.value)}
                        disabled={day.enabled === false || day.open24h || day.closed}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="time"
                        value={day.endTime || ''}
                        onChange={(e) => onChange(index, 'endTime', e.target.value)}
                        disabled={day.enabled === false || day.open24h || day.closed}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-4 ml-auto">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`day-${index}`}
                                checked={day.open24h === true}
                                onChange={() => {
                                    onChange(index, 'open24h', true);
                                    onChange(index, 'closed', false);
                                    onChange(index, 'startTime', '');
                                    onChange(index, 'endTime', '');
                                }}
                                disabled={day.enabled === false}
                                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">Open 24h</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`day-${index}`}
                                checked={day.closed === true}
                                onChange={() => {
                                    onChange(index, 'closed', true);
                                    onChange(index, 'open24h', false);
                                    onChange(index, 'startTime', '');
                                    onChange(index, 'endTime', '');
                                }}
                                disabled={day.enabled === false}
                                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">Closed</span>
                        </label>
                    </div>
                </div>
            ))}
        </div>
    );
}
