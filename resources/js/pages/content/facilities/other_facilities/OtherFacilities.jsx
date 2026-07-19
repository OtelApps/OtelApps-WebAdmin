import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';
import { useHttpQuery } from '../../../../hooks/useHttpQuery';

const MOCK_SECTIONS = [
    {
        id: 'other_facilities_main',
        title: 'Seznam ostatních prostor',
        items: [
            {
                id: '1',
                title: 'Konferenční sály',
                list_label: 'Prostory pro firemní akce a meetingy',
                image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '2',
                title: 'Dětský koutek',
                list_label: 'Herna pro nejmenší hosty',
                image: 'https://images.unsplash.com/photo-1566454544259-f4b9f44f8440?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '3',
                title: 'Zahrada a terasa',
                list_label: 'Venkovní odpočinková zóna s posezením',
                image: 'https://images.unsplash.com/photo-1523315802525-41e97de696f5?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
        ],
    },
];

export function OtherFacilities() {
    const queryClient = useQueryClient();
    const key = ['content-list', '/api/other-facilities/topics'];
    const query = useHttpQuery(key, '/api/other-facilities/topics', {
        retry: false,
    });

    const is404 = query.error?.response?.status === 404;
    const sections = is404 ? MOCK_SECTIONS : (query.data?.sections ?? []);
    const showError = query.isError && !is404;

    return (
        <ContentCardsLayout
            title="Ostatní prostory"
            hideSectionTitle
            sections={sections}
            moduleKey="other_facilities"
            loading={query.isPending}
            error={
                showError
                    ? query.error?.response?.data?.message ||
                      'Nepodařilo se načíst sekci ostatních prostor. Zkontrolujte připojení k databázi.'
                    : null
            }
            onReload={() => queryClient.invalidateQueries({ queryKey: key })}
            onRetry={() => query.refetch()}
        />
    );
}
