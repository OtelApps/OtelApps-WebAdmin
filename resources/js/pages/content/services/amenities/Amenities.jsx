import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';
import { ContentListSkeleton, PageLoadError } from '../../../../components/ui/PageSkeleton';
import { useHttpQuery } from '../../../../hooks/useHttpQuery';

export function Amenities() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const key = ['content-list', '/api/hotel-supplies'];
    const query = useHttpQuery(key, '/api/hotel-supplies');
    const data = query.data;
    const slug = data?.supplies_slug || 'doplnky';

    if (query.isPending) {
        return <ContentListSkeleton title="Doplňky" />;
    }

    if (query.isError) {
        return (
            <PageLoadError
                message={
                    query.error?.response?.data?.message ||
                    'Nepodařilo se načíst doplňky. Zkontroluj Supabase (OTELAPPS_DB_CONNECTION) a tabulky hotel_supplies.'
                }
                onRetry={() => query.refetch()}
            />
        );
    }

    return (
        <div>
            <div className="px-6 pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.title}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{data.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs">
                            {data.schedule_summary && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-medium">
                                    {data.schedule_summary}
                                </span>
                            )}
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                Max. {data.max_quantity_per_item} ks / položka
                            </span>
                            {data.is_active === false && (
                                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 rounded">
                                    Služba neaktivní
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(`/module/services/amenities/${slug}/edit`)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold shrink-0"
                    >
                        Upravit službu →
                    </button>
                </div>
            </div>
            <ContentCardsLayout
                title={data.title || 'Doplňky'}
                hideSectionTitle
                sections={data.sections ?? []}
                moduleKey="amenities"
                moduleType="services"
                onReload={() => queryClient.invalidateQueries({ queryKey: key })}
                listMeta={{ suppliesSlug: data.supplies_slug }}
            />
        </div>
    );
}
