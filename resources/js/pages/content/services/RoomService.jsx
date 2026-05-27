import React from 'react';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';
import { serviceData } from './serviceData';

export function RoomService() {
    const config = serviceData.room_service;
    return (
        <ContentCardsLayout 
            title={config.title} 
            sections={config.sections} 
            moduleKey="room_service" 
            moduleType="services"
        />
    );
}
