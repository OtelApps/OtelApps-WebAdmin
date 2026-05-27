import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { serviceData } from './serviceData';

export function Amenities() {
    const config = serviceData.amenities;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="amenities" 
            moduleType="services"
        />
    );
}
