import React from 'react';
import { FacilityLayout } from './FacilityLayout';
import { facilityData } from './facilityData';

export function Sports() {
    const config = facilityData.sports;
    return (
        <FacilityLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="sports" 
        />
    );
}
