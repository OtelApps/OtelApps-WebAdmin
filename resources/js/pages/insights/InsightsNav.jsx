import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { INSIGHT_SEGMENTS } from './insightsTheme';

/**
 * Horizontální navigace mezi segmenty Insights — odpovídá položkám v sidebaru.
 */
export function InsightsNav() {
    const location = useLocation();
    const path = location.pathname;

    const isOverview = path === '/insights';
    const isSegmentActive = (key) => path === `/module/insights/${key}`;

    return (
        <nav className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <Link
                to="/insights"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    isOverview
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
            >
                Přehled
            </Link>
            {INSIGHT_SEGMENTS.map((seg) => (
                <Link
                    key={seg.key}
                    to={seg.path}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        isSegmentActive(seg.key)
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                    {seg.label}
                </Link>
            ))}
        </nav>
    );
}
