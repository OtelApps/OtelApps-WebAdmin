import React from 'react';

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function LaundryCatalogTab({
    categories,
    setCategories,
    onSave,
    saveStatus,
    imageKeys,
}) {
    const updateCategory = (catIndex, patch) => {
        setCategories((prev) => prev.map((c, i) => (i === catIndex ? { ...c, ...patch } : c)));
    };

    const updateItem = (catIndex, itemIndex, patch) => {
        setCategories((prev) =>
            prev.map((c, ci) =>
                ci === catIndex
                    ? {
                          ...c,
                          items: c.items.map((item, ii) =>
                              ii === itemIndex ? { ...item, ...patch } : item
                          ),
                      }
                    : c
            )
        );
    };

    const addCategory = () => {
        setCategories((prev) => [
            ...prev,
            {
                id: null,
                slug: `kategorie-${prev.length + 1}`,
                title: 'Nová kategorie',
                sort_order: prev.length,
                items: [],
            },
        ]);
    };

    const deleteCategory = async (catIndex) => {
        if (!window.confirm('Smazat celou kategorii včetně položek?')) return;
        const next = categories.filter((_, i) => i !== catIndex);
        setCategories(next);
        await onSave(next);
    };

    const addItem = (catIndex) => {
        setCategories((prev) =>
            prev.map((c, i) =>
                i === catIndex
                    ? {
                          ...c,
                          items: [
                              ...c.items,
                              {
                                  id: null,
                                  slug: `polozka-${c.items.length + 1}`,
                                  title: 'Nová položka',
                                  icon_image_key: imageKeys[0] || null,
                                  sort_order: c.items.length,
                                  is_available: true,
                              },
                          ],
                      }
                    : c
            )
        );
    };

    const deleteItem = async (catIndex, itemIndex) => {
        if (!window.confirm('Smazat tuto položku?')) return;
        const next = categories.map((c, ci) =>
            ci === catIndex ? { ...c, items: c.items.filter((_, ii) => ii !== itemIndex) } : c
        );
        setCategories(next);
        await onSave(next);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kategorie a položky —{' '}
                    <code className="text-xs">hotel_housekeeping_categories</code>,{' '}
                    <code className="text-xs">hotel_housekeeping_items</code>
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addCategory}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        + Kategorie
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave()}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                    >
                        {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit katalog'}
                    </button>
                </div>
            </div>

            {categories.map((category, catIndex) => (
                <div
                    key={category.id || `cat-${catIndex}`}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4"
                >
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Slug kategorie</span>
                                <input
                                    className={inputClass}
                                    value={category.slug}
                                    onChange={(e) =>
                                        updateCategory(catIndex, { slug: e.target.value })
                                    }
                                />
                            </label>
                            <label className="block text-sm md:col-span-2">
                                <span className="text-gray-600 dark:text-gray-400">Název kategorie</span>
                                <input
                                    className={inputClass}
                                    value={category.title}
                                    onChange={(e) => {
                                        const title = e.target.value;
                                        updateCategory(catIndex, {
                                            title,
                                            slug:
                                                category.id == null
                                                    ? slugify(title) || category.slug
                                                    : category.slug,
                                        });
                                    }}
                                />
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={() => deleteCategory(catIndex)}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Smazat kategorii
                        </button>
                    </div>

                    <div className="space-y-3 pl-0 md:pl-4 border-l-0 md:border-l-2 border-orange-200 dark:border-orange-800">
                        {category.items.map((item, itemIndex) => (
                            <div
                                key={item.id || `item-${itemIndex}`}
                                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg"
                            >
                                <label className="md:col-span-2 block text-sm">
                                    <span className="text-gray-500 text-xs">Slug</span>
                                    <input
                                        className={inputClass}
                                        value={item.slug}
                                        onChange={(e) =>
                                            updateItem(catIndex, itemIndex, { slug: e.target.value })
                                        }
                                    />
                                </label>
                                <label className="md:col-span-3 block text-sm">
                                    <span className="text-gray-500 text-xs">Název</span>
                                    <input
                                        className={inputClass}
                                        value={item.title}
                                        onChange={(e) => {
                                            const title = e.target.value;
                                            updateItem(catIndex, itemIndex, {
                                                title,
                                                slug:
                                                    item.id == null
                                                        ? slugify(title) || item.slug
                                                        : item.slug,
                                            });
                                        }}
                                    />
                                </label>
                                <label className="md:col-span-3 block text-sm">
                                    <span className="text-gray-500 text-xs">Klíč ikony</span>
                                    <select
                                        className={inputClass}
                                        value={item.icon_image_key || ''}
                                        onChange={(e) =>
                                            updateItem(catIndex, itemIndex, {
                                                icon_image_key: e.target.value || null,
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
                                <label className="md:col-span-1 block text-sm">
                                    <span className="text-gray-500 text-xs">Poř.</span>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={item.sort_order}
                                        onChange={(e) =>
                                            updateItem(catIndex, itemIndex, {
                                                sort_order: parseInt(e.target.value, 10) || 0,
                                            })
                                        }
                                    />
                                </label>
                                <div className="md:col-span-3 flex items-center justify-between gap-2">
                                    <label className="flex items-center gap-1 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={item.is_available}
                                            onChange={(e) =>
                                                updateItem(catIndex, itemIndex, {
                                                    is_available: e.target.checked,
                                                })
                                            }
                                            className="rounded text-orange-500"
                                        />
                                        Dostupné
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => deleteItem(catIndex, itemIndex)}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Smazat
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addItem(catIndex)}
                            className="text-sm text-orange-600 hover:underline font-medium"
                        >
                            + Položka v „{category.title}“
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500';
