import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { facilityData } from './facilityData';

export function OtherFacilities() {
    const config = facilityData.other_facilities;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="other_facilities" 
        />
    );
}
