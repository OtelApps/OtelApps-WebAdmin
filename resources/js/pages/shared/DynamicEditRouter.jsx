import React from 'react';
import { useParams } from 'react-router-dom';

import { CardEdit } from './CardEdit';
import { HotelInfoTopicEdit } from '../content/facilities/HotelInfoTopicEdit';
import { HotelRoomTypeEdit } from '../content/facilities/HotelRoomTypeEdit';
import { ParkingTopicEdit } from '../content/facilities/ParkingTopicEdit';
import { AmenitiesEdit } from '../content/services/AmenitiesEdit';
import { IssuesRepairsEdit } from '../content/services/IssuesRepairsEdit';
import { LaundryEdit } from '../content/services/LaundryEdit';
import { RoomServiceEdit } from '../content/services/RoomServiceEdit';
import { WellnessFacilityEdit } from '../content/facilities/WellnessFacilityEdit';
import { WellnessProgramEdit } from '../content/facilities/WellnessProgramEdit';
import { FitnessFacilityEdit } from '../content/facilities/FitnessFacilityEdit';
import { RelaxSportAreaEdit } from '../content/facilities/RelaxSportAreaEdit';
import { VenueEdit } from '../content/facilities/VenueEdit';

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
