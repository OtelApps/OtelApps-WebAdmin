import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';
import { RestaurantsBars } from './facilities/RestaurantsBars';
import { WellnessSpa } from './facilities/WellnessSpa';
import { Sports } from './facilities/Sports';
import { OtherFacilities } from './facilities/OtherFacilities';
import { Services } from '../content/Services';

export function ModulePage() {
    const { type, module } = useParams();
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!type || !module) {
            setLoading(false);
            setIsEnabled(false);
            return;
        }

        axios.get(`/api/modules/check/${type}/${module}`)
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, [type, module]);

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

    // Render Facilities modules
    if (type === 'facilities') {
        switch (module) {
            case 'restaurants_bars':
                return <RestaurantsBars />;
            case 'wellness_spa':
                return <WellnessSpa />;
            case 'sports':
                return <Sports />;
            case 'other_facilities':
                return <OtherFacilities />;
            default:
                break;
        }
    }

    // Services page
    if (type === 'services' && module === 'services') {
        return <Services />;
    }

    // Default module page
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {type} - {module}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Module page for {type}/{module}
            </p>
        </div>
    );
}



