import React, { useState } from 'react';

export function ImageWithFallback({ src, alt, className = "relative w-full h-full bg-gray-200 dark:bg-gray-700" }) {
    const [error, setError] = useState(false);

    return (
        <div className={className}>
            {!error && src && (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover relative z-10"
                    onError={() => setError(true)}
                />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-0">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        </div>
    );
}
