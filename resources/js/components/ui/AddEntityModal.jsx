import React, { useEffect, useState } from 'react';
import { slugify } from '../../utils/slugify';

export function AddEntityModal({ open, title, fields, onClose, onSubmit, submitting, error }) {
    const [values, setValues] = useState({});

    useEffect(() => {
        if (open) {
            const initial = {};
            fields.forEach((f) => {
                initial[f.name] = f.defaultValue ?? '';
            });
            setValues(initial);
        }
    }, [open, fields]);

    if (!open) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(values);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-entity-title"
            >
                <h2 id="add-entity-title" className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {title}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {field.label}
                            </label>
                            {field.type === 'select' ? (
                                <select
                                    value={values[field.name] ?? ''}
                                    onChange={(e) =>
                                        setValues((v) => ({ ...v, [field.name]: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    required={field.required}
                                >
                                    {field.options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={values[field.name] ?? ''}
                                    onChange={(e) =>
                                        setValues((v) => ({ ...v, [field.name]: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    placeholder={field.placeholder}
                                    required={field.required !== false}
                                />
                            )}
                            {field.name === 'title' && values.title && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Slug: <span className="font-mono">{slugify(values.title) || '—'}</span>
                                </p>
                            )}
                        </div>
                    ))}
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60 font-medium"
                        >
                            {submitting ? 'Ukládám…' : 'Přidat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
