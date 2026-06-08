import React from 'react';
import { localeMeta } from './conciergeLocales';

export function GuestLocaleFlag({ locale, size = 'md', showLabel = false }) {
    const meta = localeMeta(locale);
    const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

    return (
        <span
            className="inline-flex items-center gap-1 shrink-0"
            title={`${meta.label} (${meta.code})`}
        >
            <span className={sizeClass} role="img" aria-label={meta.label}>
                {meta.flag}
            </span>
            {showLabel ? (
                <span className="text-xs font-medium text-gray-500 uppercase">{meta.country}</span>
            ) : null}
        </span>
    );
}
