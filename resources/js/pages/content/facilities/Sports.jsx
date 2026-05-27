import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { facilityData } from './facilityData';

export function Sports() {
    const config = facilityData.sports;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="sports" 
        />
    );
}
