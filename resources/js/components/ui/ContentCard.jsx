import React from 'react';
import { ImageWithFallback } from './ImageWithFallback';

export function ContentCard({
    title,
    subtitle,
    image,
    scheduleSummary,
    isActive,
    onEdit,
    onDelete,
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative group">
            <div className="relative h-48">
                <ImageWithFallback src={image} alt={title} />

                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="px-6 py-2 bg-white text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                {subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{subtitle}</p>
                )}
                {scheduleSummary && (
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                        {scheduleSummary}
                    </span>
                )}
                {isActive === false && (
                    <span className="inline-block ml-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium rounded">
                        Neaktivní
                    </span>
                )}
            </div>
        </div>
    );
}
