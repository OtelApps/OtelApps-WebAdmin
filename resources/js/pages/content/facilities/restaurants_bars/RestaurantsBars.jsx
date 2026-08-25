import React from 'react';
import { ContentListPage } from '../../../shared/ContentListPage';

export function RestaurantsBars() {
    return (
        <ContentListPage
            title="Restaurants & Bars"
            endpoint="/api/venues"
            moduleKey="restaurants_bars"
            errorFallback="Nepodařilo se načíst podniky. Zkontroluj připojení k Supabase (DB_CONNECTION=supabase v .env)."
        />
    );
}
