import React from 'react';

export function BookingSystemSelector({ value, onChange, externalUrl, onExternalUrlChange }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking System</h2>
            
            <div
                onClick={() => onChange('hours_only')}
                className={`bg-white rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all ${
                    value === 'hours_only'
                        ? 'border-orange-500'
                        : 'border-transparent hover:border-gray-200'
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                value === 'hours_only'
                                    ? 'border-orange-500 bg-orange-500'
                                    : 'border-gray-300'
                            }`}
                        >
                            {value === 'hours_only' && (
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
                onClick={() => onChange('on_demand')}
                className={`bg-white rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all ${
                    value === 'on_demand'
                        ? 'border-orange-500'
                        : 'border-transparent hover:border-gray-200'
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                value === 'on_demand'
                                    ? 'border-orange-500 bg-orange-500'
                                    : 'border-gray-300'
                            }`}
                        >
                            {value === 'on_demand' && (
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
                onClick={() => onChange('external')}
                className={`bg-white rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all ${
                    value === 'external'
                        ? 'border-orange-500'
                        : 'border-transparent hover:border-gray-200'
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                value === 'external'
                                    ? 'border-orange-500 bg-orange-500'
                                    : 'border-gray-300'
                            }`}
                        >
                            {value === 'external' && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">External booking system</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Guests can book through a third-party booking system via a URL.
                        </p>
                        {value === 'external' && (
                            <input
                                type="url"
                                value={externalUrl || ''}
                                onChange={(e) => onExternalUrlChange && onExternalUrlChange(e.target.value)}
                                placeholder="Add third-party booking system URL"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
