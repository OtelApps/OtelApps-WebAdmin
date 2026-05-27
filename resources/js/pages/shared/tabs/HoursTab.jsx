import React from 'react';

export function HoursTab({ formData, updateData }) {
    const toggleTemporarilyClosed = () => {
        updateData({
            ...formData,
            hours: {
                ...formData.hours,
                temporarilyClosed: !formData.hours.temporarilyClosed
            }
        });
    };

    const handleDayChange = (dayIndex, field, value) => {
        updateData({
            ...formData,
            hours: {
                ...formData.hours,
                days: formData.hours.days.map((day, index) =>
                    index === dayIndex ? { ...day, [field]: value } : day
                )
            }
        });
    };

    const handleBookingSystemChange = (system) => {
        updateData({
            ...formData,
            hours: {
                ...formData.hours,
                bookingSystem: system
            }
        });
    };

    const handleExternalBookingUrlChange = (url) => {
        updateData({
            ...formData,
            hours: {
                ...formData.hours,
                externalBookingUrl: url
            }
        });
    };

    return (
        <div className="space-y-8">
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

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking System</h2>
                    
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
    );
}
