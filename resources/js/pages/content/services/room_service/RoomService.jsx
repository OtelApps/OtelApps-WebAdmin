import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';
import { useHttpQuery } from '../../../../hooks/useHttpQuery';

export function RoomService() {
    const queryClient = useQueryClient();
    const key = ['content-list', '/api/hotel-room-service/menus'];
    const query = useHttpQuery(key, '/api/hotel-room-service/menus');

    return (
        <ContentCardsLayout
            title={query.data?.title ?? 'Pokojová služba'}
            sections={query.data?.sections ?? []}
            moduleKey="room_service"
            moduleType="services"
            loading={query.isPending}
            error={
                query.isError
                    ? query.error?.response?.data?.message ||
                      'Nepodařilo se načíst pokojovou službu. Zkontroluj Supabase a tabulky hotel_room_service_menus.'
                    : null
            }
            onReload={() => queryClient.invalidateQueries({ queryKey: key })}
            onRetry={() => query.refetch()}
        />
    );
}
