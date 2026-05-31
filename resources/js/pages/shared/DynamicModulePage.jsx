import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { NotFound } from './NotFound';
import { RestaurantsBars } from '../content/facilities/RestaurantsBars';
import { RelaxSport } from '../content/facilities/RelaxSport';
import { WellnessSpa } from '../content/facilities/WellnessSpa';
import { Sports } from '../content/facilities/Sports';
import { Parking } from '../content/facilities/Parking';
import { HotelInfo } from '../content/facilities/HotelInfo';
import { HotelRooms } from '../content/facilities/HotelRooms';
import { ServicesOverview } from '../content/ServicesOverview';

import { RoomService } from '../content/services/RoomService';
import { Amenities } from '../content/services/Amenities';
import { Laundry } from '../content/services/Laundry';
import { IssuesRepairs } from '../content/services/IssuesRepairs';
import { Leisure } from '../content/leisure/Leisure';
import { ModuleSectionHub } from './ModuleSectionHub';

const RELAX_SPORT_AREAS = {
    'wellness-spa': WellnessSpa,
    'gym-sport': Sports,
};

const FACILITIES_PAGES = {
    restaurants_bars: RestaurantsBars,
    relax_sport: RelaxSport,
    hotel_info: HotelInfo,
    hotel_rooms: HotelRooms,
    parking: Parking,
};

const SERVICES_PAGES = {
    room_service: RoomService,
    amenities: Amenities,
    laundry: Laundry,
    issues_repairs: IssuesRepairs,
    services: ServicesOverview,
};

export function DynamicModulePage() {
    const { type, module, area } = useParams();
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

    if (type === module && (type === 'facilities' || type === 'services')) {
        return <ModuleSectionHub />;
    }

    if (type === 'facilities' && module === 'relax_sport' && area && RELAX_SPORT_AREAS[area]) {
        const Page = RELAX_SPORT_AREAS[area];
        return <Page />;
    }

    if (type === 'facilities' && FACILITIES_PAGES[module]) {
        const Page = FACILITIES_PAGES[module];
        return <Page />;
    }

    if (type === 'services' && SERVICES_PAGES[module]) {
        const Page = SERVICES_PAGES[module];
        return <Page />;
    }

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



