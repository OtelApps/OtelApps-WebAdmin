import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { serviceData } from './serviceData';

export function Housekeeping() {
    const config = serviceData.housekeeping;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="housekeeping" 
            moduleType="services"
        />
    );
}
