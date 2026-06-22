import React from 'react';

/**
 * A standard white card used for wrapping form sections inside tabs.
 */
export function SectionCard({ title, description, children, className = '', action }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4 ${className}`}>
            {(title || action) && (
                <div className="flex items-start justify-between">
                    <div>
                        {title && <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>}
                        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {(!title && description) && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            {children}
        </div>
    );
}

/**
 * A standard label wrapper for form inputs.
 */
export function Field({ label, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
            {children}
        </label>
    );
}

/**
 * A standard text/number input.
 */
export function Input(props) {
    const { className = '', ...rest } = props;
    return (
        <input
            className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`}
            {...rest}
        />
    );
}

/**
 * A standard select input.
 */
export function Select(props) {
    const { className = '', children, ...rest } = props;
    return (
        <select
            className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white ${className}`}
            {...rest}
        >
            {children}
        </select>
    );
}

/**
 * A standard checkbox field.
 */
export function Checkbox({ label, ...rest }) {
    return (
        <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
                type="checkbox"
                className="rounded text-orange-500 focus:ring-orange-500"
                {...rest}
            />
            {label}
        </label>
    );
}
