import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { serviceData } from './serviceData';

export function IssuesRepairs() {
    const config = serviceData.issues_repairs;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="issues_repairs" 
            moduleType="services"
        />
    );
}
