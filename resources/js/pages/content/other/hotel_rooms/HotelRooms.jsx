import React from 'react';
import { ContentListPage } from '../../../shared/ContentListPage';

export function HotelRooms() {
    return (
        <ContentListPage
            title="Hotel Rooms"
            endpoint="/api/hotel-rooms/types"
            moduleKey="hotel_rooms"
            moduleType="other"
            errorFallback="Nepodařilo se načíst pokoje. Zkontroluj připojení k Supabase."
        />
    );
}
