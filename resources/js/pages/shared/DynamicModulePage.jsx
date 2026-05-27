import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { NotFound } from './NotFound';
import { RestaurantsBars } from '../content/facilities/RestaurantsBars';
import { WellnessSpa } from '../content/facilities/WellnessSpa';
import { Sports } from '../content/facilities/Sports';
import { OtherFacilities } from '../content/facilities/OtherFacilities';
import { ServicesOverview } from '../content/ServicesOverview';

import { RoomService } from '../content/services/RoomService';
import { Amenities } from '../content/services/Amenities';
import { Laundry } from '../content/services/Laundry';
import { IssuesRepairs } from '../content/services/IssuesRepairs';
import { Housekeeping } from '../content/services/Housekeeping';

import { Leisure } from '../content/leisure/Leisure';

export function DynamicModulePage() {
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

    // Render Services submodules
    if (type === 'services') {
        switch (module) {
            case 'room_service':
                return <RoomService />;
            case 'amenities':
                return <Amenities />;
            case 'laundry':
                return <Laundry />;
            case 'issues_repairs':
                return <IssuesRepairs />;
            case 'housekeeping':
                return <Housekeeping />;
            // If it's the main services overview page
            case 'services':
                return <ServicesOverview />;
            default:
                break;
        }
    }

    // Render Leisure module
    if (type === 'leisure' && module === 'leisure') {
        return <Leisure />;
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



