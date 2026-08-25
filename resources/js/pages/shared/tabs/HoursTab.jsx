import React from 'react';
import { WeeklyHoursPicker } from '../../../components/ui/WeeklyHoursPicker';
import { BookingSystemSelector } from '../../../components/ui/BookingSystemSelector';

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
                    <WeeklyHoursPicker
                        days={formData.hours.days}
                        onChange={handleDayChange}
                    />
                </div>

                <div className="space-y-4">
                    <BookingSystemSelector
                        value={formData.hours.bookingSystem}
                        onChange={handleBookingSystemChange}
                        externalUrl={formData.hours.externalBookingUrl}
                        onExternalUrlChange={handleExternalBookingUrlChange}
                    />
                </div>
            </div>
        </div>
    );
}
