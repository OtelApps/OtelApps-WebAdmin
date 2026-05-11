import React from 'react';
import { FacilityLayout } from './FacilityLayout';
import { facilityData } from './facilityData';

export function WellnessSpa() {
    const config = facilityData.wellness_spa;
    return (
        <FacilityLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="wellness_spa" 
        />
    );
}
