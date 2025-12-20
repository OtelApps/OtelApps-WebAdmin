import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

export function Content() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/modules/check/content')
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to <span className="text-orange-500">Otel Apps Hotel</span>
            </h1>
            
            <div className="space-y-4 mb-8">
                <p className="text-gray-700 dark:text-gray-300">
                    The CMS is where you need to introduce all the contents about your hotel's facilities and services so guests can browse this information.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                    You will also be able to activate reservations for your services if you want to allow guests to book them through your app's products.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                    Here's a brief explanation of the information you should introduce in each section:
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Facilities</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Here is where you can introduce all the information about your hotel's restaurants, spa, sports facilities, shops, attractions, swimming pools and a map where each of the hotel's POIs can be located.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Services</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        This section includes all contents related to Issues, Housekeeping, Amenities, Room Service and Premium Services. Just like in facilities, you can also activate bookings if you want guests to be able to order these services.
                    </p>
                </div>
            </div>
        </div>
    );
}

