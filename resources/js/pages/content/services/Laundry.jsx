import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { serviceData } from './serviceData';

export function Laundry() {
    const config = serviceData.laundry;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="laundry" 
            moduleType="services"
        />
    );
}
