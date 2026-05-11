import React from 'react';
import { FacilityLayout } from './FacilityLayout';
import { facilityData } from './facilityData';

export function OtherFacilities() {
    const config = facilityData.other_facilities;
    return (
        <FacilityLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="other_facilities" 
        />
    );
}
