import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { NotFound } from './NotFound';
import { RestaurantsBars } from '../content/facilities/restaurants_bars/RestaurantsBars';
import { RelaxSport } from '../content/facilities/relax_sport/RelaxSport';
import { WellnessSpa } from '../content/facilities/relax_sport/WellnessSpa';
import { Sports } from '../content/facilities/relax_sport/Sports';
import { Parking } from '../content/facilities/parking/Parking';
import { OtherFacilities } from '../content/facilities/other_facilities/OtherFacilities';
import { HotelInfo } from '../content/facilities/hotel_info/HotelInfo';
import { HotelRooms } from '../content/services/hotel_rooms/HotelRooms';

import { RoomService } from '../content/services/room_service/RoomService';
import { Amenities } from '../content/services/amenities/Amenities';
import { Laundry } from '../content/services/laundry/Laundry';
import { IssuesRepairs } from '../content/services/issues_repairs/IssuesRepairs';
import { CheckInOut } from '../content/services/check_in_out/CheckInOut';
import { Leisure } from '../content/leisure/Leisure';
import { Other } from '../content/other/Other';
import { WelcomeMessage } from '../content/welcome_message/WelcomeMessage';
import { LegalTexts } from '../content/legal_texts/LegalTexts';
import { ImageGallery } from '../content/image_gallery/ImageGallery';
import { ModuleSectionHub } from './ModuleSectionHub';
import { Revenue } from '../insights/Revenue';
import { Users } from '../insights/Users';
import { Transactions } from '../insights/Transactions';
import { Behavior } from '../insights/Behavior';
import { Guests } from '../crm/Guests';
import { Alerts } from '../crm/Alerts';
import { Promotions } from '../crm/Promotions';
import { Tasks } from '../crm/Tasks';
import { History } from '../crm/History';

const RELAX_SPORT_AREAS = {
    'wellness-spa': WellnessSpa,
    'gym-sport': Sports,
};

const FACILITIES_PAGES = {
    restaurants_bars: RestaurantsBars,
    relax_sport: RelaxSport,
    hotel_info: HotelInfo,
    parking: Parking,
    other_facilities: OtherFacilities,
};

const SERVICES_PAGES = {
    room_service: RoomService,
    hotel_rooms: HotelRooms,
    amenities: Amenities,
    laundry: Laundry,
    issues_repairs: IssuesRepairs,
    check_in_out: CheckInOut,
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

    if (type === 'content' && module === 'leisure') {
        return <Leisure />;
    }

    if (type === 'content' && module === 'other') {
        return <Other />;
    }

    if (type === 'content' && module === 'welcome_message') {
        return <WelcomeMessage />;
    }

    if ((type === 'content' || type === 'legal_texts') && module === 'legal_texts') {
        return <LegalTexts />;
    }

    if (type === 'content' && module === 'image_gallery') {
        return <ImageGallery />;
    }

    if (type === 'insights' && module === 'revenue') {
        return <Revenue />;
    }

    if (type === 'insights' && module === 'users') {
        return <Users />;
    }

    if (type === 'insights' && module === 'transactions') {
        return <Transactions />;
    }

    if (type === 'insights' && module === 'behavior') {
        return <Behavior />;
    }

    if (type === 'crm' && module === 'guests') {
        return <Guests />;
    }

    if (type === 'crm' && module === 'alerts') {
        return <Alerts />;
    }

    if (type === 'crm' && module === 'promotions') {
        return <Promotions />;
    }

    if (type === 'crm' && module === 'tasks') {
        return <Tasks />;
    }

    if (type === 'crm' && module === 'history') {
        return <History />;
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



