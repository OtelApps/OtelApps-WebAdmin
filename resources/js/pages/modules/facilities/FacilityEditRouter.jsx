import React from 'react';
import { useParams } from 'react-router-dom';
import { VenueEdit } from './VenueEdit';
import { WellnessFacilityEdit } from './WellnessFacilityEdit';
import { WellnessProgramEdit } from './WellnessProgramEdit';

/**
 * Směruje editaci podle modulu v URL (restaurants_bars vs wellness_spa).
 */
export function FacilityEditRouter() {
    const { module, id } = useParams();

    if (module === 'wellness_spa' && id === 'program') {
        return <WellnessProgramEdit />;
    }

    if (module === 'wellness_spa') {
        return <WellnessFacilityEdit />;
    }

    if (module === 'restaurants_bars') {
        return <VenueEdit />;
    }

    return (
        <div className="p-6">
            <p className="text-gray-600">Editace pro modul „{module}“ zatím není k dispozici.</p>
        </div>
    );
}
