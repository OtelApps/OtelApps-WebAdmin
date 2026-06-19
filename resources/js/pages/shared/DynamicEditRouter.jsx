import React from 'react';
import { useParams } from 'react-router-dom';

import { CardEdit } from './CardEdit';
import { HotelInfoTopicEdit } from '../content/other/hotel_info/HotelInfoTopicEdit';
import { HotelRoomTypeEdit } from '../content/other/hotel_rooms/HotelRoomTypeEdit';
import { ParkingTopicEdit } from '../content/other/parking/ParkingTopicEdit';
import { AmenitiesEdit } from '../content/services/amenities/AmenitiesEdit';
import { IssuesRepairsEdit } from '../content/services/issues_repairs/IssuesRepairsEdit';
import { LaundryEdit } from '../content/services/laundry/LaundryEdit';
import { RoomServiceEdit } from '../content/services/room_service/RoomServiceEdit';
import { WellnessFacilityEdit } from '../content/facilities/relax_sport/WellnessFacilityEdit';
import { WellnessProgramEdit } from '../content/facilities/relax_sport/WellnessProgramEdit';
import { FitnessFacilityEdit } from '../content/facilities/relax_sport/FitnessFacilityEdit';
import { RelaxSportAreaEdit } from '../content/facilities/relax_sport/RelaxSportAreaEdit';
import { VenueEdit } from '../content/facilities/restaurants_bars/VenueEdit';

/**
 * Centrální směrovač pro editaci modulů.
 */
export function DynamicEditRouter() {
    const { module, area, id } = useParams();

    if (module === 'relax_sport' && area === 'wellness-spa') {
        if (id === 'settings') {
            return <RelaxSportAreaEdit />;
        }
        if (id === 'program') {
            return <WellnessProgramEdit />;
        }
        return <WellnessFacilityEdit />;
    }

    if (module === 'relax_sport' && area === 'gym-sport') {
        if (id === 'settings') {
            return <RelaxSportAreaEdit />;
        }
        return <FitnessFacilityEdit />;
    }

    if (module === 'hotel_info') {
        return <HotelInfoTopicEdit />;
    }

    if (module === 'hotel_rooms') {
        return <HotelRoomTypeEdit />;
    }

    if (module === 'parking') {
        return <ParkingTopicEdit />;
    }

    if (module === 'amenities') {
        return <AmenitiesEdit />;
    }

    if (module === 'issues_repairs') {
        return <IssuesRepairsEdit />;
    }

    if (module === 'laundry') {
        return <LaundryEdit />;
    }

    if (module === 'room_service') {
        return <RoomServiceEdit />;
    }

    if (module === 'wellness_spa') {
        if (id === 'program') {
            return <WellnessProgramEdit />;
        }
        return <WellnessFacilityEdit />;
    }

    if (module === 'sports') {
        return <FitnessFacilityEdit />;
    }

    if (module === 'restaurants_bars') {
        return <VenueEdit />;
    }

    return <CardEdit />;
};
