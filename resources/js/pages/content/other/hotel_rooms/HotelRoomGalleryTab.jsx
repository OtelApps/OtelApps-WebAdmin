import React from 'react';

export function HotelRoomGalleryTab({ gallery, setGallery, onSave, saveStatus, imageKeys }) {
    const updateImage = (index, patch) => {
        setGallery((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
    };

    const addImage = () => {
        setGallery((prev) => [
            ...prev,
            {
                id: null,
                image_key: imageKeys[0] || '',
                image_url: '',
                sort_order: prev.length,
            },
        ]);
    };

    const deleteImage = async (index) => {
        if (!window.confirm('Smazat tento obrázek z galerie?')) return;
        const next = gallery.filter((_, i) => i !== index);
        setGallery(next);
        await onSave(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Galerie na detailu — tabulka{' '}
                    <code className="text-xs">hotel_room_type_images</code>
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addImage}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
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

            {gallery.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                        Galerie je volitelná. Bez záznamů se použije hlavní obrázek pokoje.
                    </p>
                    <button
                        type="button"
                        onClick={addImage}
                        className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                    >
                        Přidat obrázek
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {gallery.map((item, index) => (
                        <div
                            key={item.id || `new-${index}`}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">#{index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => deleteImage(index)}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    Smazat
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Klíč obrázku</span>
                                    <select
                                        className={inputClass}
                                        value={item.image_key || ''}
                                        onChange={(e) =>
                                            updateImage(index, {
                                                image_key: e.target.value || null,
                                            })
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
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">URL obrázku</span>
                                    <input
                                        className={inputClass}
                                        value={item.image_url || ''}
                                        onChange={(e) =>
                                            updateImage(index, {
                                                image_url: e.target.value || null,
                                            })
                                        }
                                        placeholder="https://…"
                                    />
                                </label>
                            </div>
                            <label className="block text-sm w-32">
                                <span className="text-gray-600 dark:text-gray-400">Pořadí</span>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={item.sort_order}
                                    onChange={(e) =>
                                        updateImage(index, {
                                            sort_order: parseInt(e.target.value, 10) || 0,
                                        })
                                    }
                                />
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
