import React from 'react';

export function FitnessGalleryTab({ images, setImages, imageKeys, onSave, saveStatus }) {
    const updateImage = (index, patch) => {
        setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
    };

    const addImage = () => {
        setImages((prev) => [
            ...prev,
            {
                id: null,
                image_key: imageKeys[0] || null,
                image_url: null,
                sort_order: prev.length,
            },
        ]);
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                    Galerie detailu — <code className="text-xs">fitness_facility_images</code>
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addImage}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        + Obrázek
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave()}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                    >
                        {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit galerii'}
                    </button>
                </div>
            </div>

            {images.length === 0 && (
                <p className="text-sm text-gray-500">Zatím žádné obrázky v galerii.</p>
            )}

            {images.map((img, index) => (
                <div
                    key={img.id || `img-${index}`}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                >
                    <label className="md:col-span-3 block text-sm">
                        <span className="text-gray-500 text-xs">Klíč obrázku</span>
                        <select
                            className={inputClass}
                            value={img.image_key || ''}
                            onChange={(e) =>
                                updateImage(index, { image_key: e.target.value || null })
                            }
                        >
                            <option value="">— žádný —</option>
                            {imageKeys.map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="md:col-span-6 block text-sm">
                        <span className="text-gray-500 text-xs">URL (volitelné)</span>
                        <input
                            className={inputClass}
                            value={img.image_url || ''}
                            onChange={(e) =>
                                updateImage(index, { image_url: e.target.value || null })
                            }
                            placeholder="https://…"
                        />
                    </label>
                    <label className="md:col-span-1 block text-sm">
                        <span className="text-gray-500 text-xs">Poř.</span>
                        <input
                            type="number"
                            className={inputClass}
                            value={img.sort_order}
                            onChange={(e) =>
                                updateImage(index, {
                                    sort_order: parseInt(e.target.value, 10) || 0,
                                })
                            }
                        />
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Smazat
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500';
