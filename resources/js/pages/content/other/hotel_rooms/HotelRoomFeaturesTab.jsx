import React from 'react';

export function HotelRoomFeaturesTab({ features, setFeatures, onSave, saveStatus }) {
    const updateFeature = (index, patch) => {
        setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    };

    const addFeature = () => {
        setFeatures((prev) => [
            ...prev,
            {
                id: null,
                label: 'Nová položka',
                sort_order: prev.length,
            },
        ]);
    };

    const deleteFeature = async (index) => {
        if (!window.confirm('Smazat tuto položku vybavení?')) return;
        const next = features.filter((_, i) => i !== index);
        setFeatures(next);
        await onSave(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vybavení pokoje — tabulka{' '}
                    <code className="text-xs">hotel_room_type_features</code>
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addFeature}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        + Položka
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave()}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                    >
                        {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit vybavení'}
                    </button>
                </div>
            </div>

            {features.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Zatím žádné vybavení.</p>
                    <button
                        type="button"
                        onClick={addFeature}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                    >
                        Přidat první položku
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id || `new-${index}`}
                            className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                        >
                            <input
                                className={inputClass + ' flex-1 min-w-[200px]'}
                                value={feature.label}
                                onChange={(e) => updateFeature(index, { label: e.target.value })}
                                placeholder="např. Wi-Fi"
                            />
                            <input
                                type="number"
                                className={inputClass + ' w-24'}
                                value={feature.sort_order}
                                onChange={(e) =>
                                    updateFeature(index, {
                                        sort_order: parseInt(e.target.value, 10) || 0,
                                    })
                                }
                                title="Pořadí"
                            />
                            <button
                                type="button"
                                onClick={() => deleteFeature(index)}
                                className="text-sm text-red-600 hover:underline shrink-0"
                            >
                                Smazat
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const inputClass =
    'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
