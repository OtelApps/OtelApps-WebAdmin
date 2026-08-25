import React, { useState } from 'react';

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function RoomServiceCatalogTab({ categories, setCategories, onSave, saveStatus }) {
    const [expanded, setExpanded] = useState({});

    const toggleExpanded = (key) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

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

    const updateOption = (catIndex, itemIndex, optIndex, patch) => {
        setCategories((prev) =>
            prev.map((c, ci) =>
                ci === catIndex
                    ? {
                          ...c,
                          items: c.items.map((item, ii) =>
                              ii === itemIndex
                                  ? {
                                        ...item,
                                        options: item.options.map((opt, oi) =>
                                            oi === optIndex ? { ...opt, ...patch } : opt
                                        ),
                                    }
                                  : item
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
        if (!window.confirm('Smazat kategorii včetně všech položek?')) return;
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
                                  name: 'Nová položka',
                                  description_short: '',
                                  icon_emoji: '',
                                  price_amount: 0,
                                  currency: 'CZK',
                                  requires_option: false,
                                  sort_order: c.items.length,
                                  is_available: true,
                                  options: [],
                              },
                          ],
                      }
                    : c
            )
        );
        const key = categories[catIndex]?.id || `cat-${catIndex}`;
        setExpanded((prev) => ({ ...prev, [key]: true }));
    };

    const deleteItem = async (catIndex, itemIndex) => {
        if (!window.confirm('Smazat tuto položku?')) return;
        const next = categories.map((c, ci) =>
            ci === catIndex ? { ...c, items: c.items.filter((_, ii) => ii !== itemIndex) } : c
        );
        setCategories(next);
        await onSave(next);
    };

    const addOption = (catIndex, itemIndex) => {
        setCategories((prev) =>
            prev.map((c, ci) =>
                ci === catIndex
                    ? {
                          ...c,
                          items: c.items.map((item, ii) =>
                              ii === itemIndex
                                  ? {
                                        ...item,
                                        requires_option: true,
                                        options: [
                                            ...item.options,
                                            {
                                                id: null,
                                                slug: `varianta-${item.options.length + 1}`,
                                                label: 'Nová varianta',
                                                price_amount: item.price_amount,
                                                sort_order: item.options.length,
                                            },
                                        ],
                                    }
                                  : item
                          ),
                      }
                    : c
            )
        );
    };

    const deleteOption = (catIndex, itemIndex, optIndex) => {
        setCategories((prev) =>
            prev.map((c, ci) =>
                ci === catIndex
                    ? {
                          ...c,
                          items: c.items.map((item, ii) =>
                              ii === itemIndex
                                  ? {
                                        ...item,
                                        options: item.options.filter((_, oi) => oi !== optIndex),
                                    }
                                  : item
                          ),
                      }
                    : c
            )
        );
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Add products to the catalog</h2>
                        <p className="text-sm text-gray-600">
                            Kategorie a produkty —{' '}
                            <code className="text-xs">hotel_room_service_categories</code>,{' '}
                            <code className="text-xs">hotel_room_service_items</code>,{' '}
                            <code className="text-xs">hotel_room_service_item_options</code>
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={addCategory}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                        >
                            + ADD CATEGORY
                        </button>
                        <button
                            type="button"
                            onClick={() => onSave()}
                            disabled={saveStatus === 'saving'}
                            className="px-5 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-60 text-sm font-semibold"
                        >
                            {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit katalog'}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {categories.map((category, catIndex) => {
                        const catKey = category.id || `cat-${catIndex}`;
                        const isOpen = expanded[catKey] ?? true;

                        return (
                            <div
                                key={catKey}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="flex items-center justify-between p-4 bg-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpanded(catKey)}
                                        className="flex items-center gap-2 text-gray-800 font-medium"
                                    >
                                        <svg
                                            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                        {category.title}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteCategory(catIndex)}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        Smazat
                                    </button>
                                </div>

                                {isOpen && (
                                    <div className="p-4 space-y-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <label className="block text-sm">
                                                <span className="text-gray-600">Slug</span>
                                                <input
                                                    className={inputClass}
                                                    value={category.slug}
                                                    onChange={(e) =>
                                                        updateCategory(catIndex, {
                                                            slug: e.target.value,
                                                        })
                                                    }
                                                />
                                            </label>
                                            <label className="block text-sm md:col-span-2">
                                                <span className="text-gray-600">Název kategorie</span>
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

                                        {category.items.map((item, itemIndex) => (
                                            <div
                                                key={item.id || `item-${itemIndex}`}
                                                className="border border-gray-100 rounded-lg p-4 bg-white space-y-3"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                    <label className="md:col-span-2 block text-sm">
                                                        <span className="text-gray-500 text-xs">Slug</span>
                                                        <input
                                                            className={inputClass}
                                                            value={item.slug}
                                                            onChange={(e) =>
                                                                updateItem(catIndex, itemIndex, {
                                                                    slug: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                    <label className="md:col-span-3 block text-sm">
                                                        <span className="text-gray-500 text-xs">Název</span>
                                                        <input
                                                            className={inputClass}
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const name = e.target.value;
                                                                updateItem(catIndex, itemIndex, {
                                                                    name,
                                                                    slug:
                                                                        item.id == null
                                                                            ? slugify(name) || item.slug
                                                                            : item.slug,
                                                                });
                                                            }}
                                                        />
                                                    </label>
                                                    <label className="md:col-span-1 block text-sm">
                                                        <span className="text-gray-500 text-xs">Emoji</span>
                                                        <input
                                                            className={inputClass}
                                                            value={item.icon_emoji || ''}
                                                            onChange={(e) =>
                                                                updateItem(catIndex, itemIndex, {
                                                                    icon_emoji: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                    <label className="md:col-span-2 block text-sm">
                                                        <span className="text-gray-500 text-xs">Cena</span>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            className={inputClass}
                                                            value={item.price_amount}
                                                            onChange={(e) =>
                                                                updateItem(catIndex, itemIndex, {
                                                                    price_amount:
                                                                        parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                    <label className="md:col-span-1 block text-sm">
                                                        <span className="text-gray-500 text-xs">Měna</span>
                                                        <input
                                                            className={inputClass}
                                                            value={item.currency || 'CZK'}
                                                            onChange={(e) =>
                                                                updateItem(catIndex, itemIndex, {
                                                                    currency: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                    <div className="md:col-span-3 flex items-center justify-end gap-3">
                                                        <label className="flex items-center gap-1 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.requires_option}
                                                                onChange={(e) =>
                                                                    updateItem(catIndex, itemIndex, {
                                                                        requires_option: e.target.checked,
                                                                        options: e.target.checked
                                                                            ? item.options
                                                                            : [],
                                                                    })
                                                                }
                                                                className="rounded text-orange-500"
                                                            />
                                                            Varianty
                                                        </label>
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
                                                <label className="block text-sm">
                                                    <span className="text-gray-500 text-xs">Krátký popis</span>
                                                    <input
                                                        className={inputClass}
                                                        value={item.description_short || ''}
                                                        onChange={(e) =>
                                                            updateItem(catIndex, itemIndex, {
                                                                description_short: e.target.value || null,
                                                            })
                                                        }
                                                    />
                                                </label>

                                                {item.requires_option && (
                                                    <div className="pl-4 border-l-2 border-orange-200 space-y-2">
                                                        <p className="text-xs font-medium text-gray-600">
                                                            Varianty (např. druhy džusů)
                                                        </p>
                                                        {item.options.map((opt, optIndex) => (
                                                            <div
                                                                key={opt.id || `opt-${optIndex}`}
                                                                className="grid grid-cols-12 gap-2 items-end"
                                                            >
                                                                <label className="col-span-3 block text-sm">
                                                                    <span className="text-gray-500 text-xs">
                                                                        Slug
                                                                    </span>
                                                                    <input
                                                                        className={inputClass}
                                                                        value={opt.slug}
                                                                        onChange={(e) =>
                                                                            updateOption(
                                                                                catIndex,
                                                                                itemIndex,
                                                                                optIndex,
                                                                                { slug: e.target.value }
                                                                            )
                                                                        }
                                                                    />
                                                                </label>
                                                                <label className="col-span-5 block text-sm">
                                                                    <span className="text-gray-500 text-xs">
                                                                        Popisek
                                                                    </span>
                                                                    <input
                                                                        className={inputClass}
                                                                        value={opt.label}
                                                                        onChange={(e) => {
                                                                            const label = e.target.value;
                                                                            updateOption(
                                                                                catIndex,
                                                                                itemIndex,
                                                                                optIndex,
                                                                                {
                                                                                    label,
                                                                                    slug:
                                                                                        opt.id == null
                                                                                            ? slugify(label) ||
                                                                                              opt.slug
                                                                                            : opt.slug,
                                                                                }
                                                                            );
                                                                        }}
                                                                    />
                                                                </label>
                                                                <label className="col-span-2 block text-sm">
                                                                    <span className="text-gray-500 text-xs">
                                                                        Cena
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        min="0"
                                                                        className={inputClass}
                                                                        value={opt.price_amount}
                                                                        onChange={(e) =>
                                                                            updateOption(
                                                                                catIndex,
                                                                                itemIndex,
                                                                                optIndex,
                                                                                {
                                                                                    price_amount:
                                                                                        parseFloat(
                                                                                            e.target.value
                                                                                        ) || 0,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                </label>
                                                                <div className="col-span-2 flex justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            deleteOption(
                                                                                catIndex,
                                                                                itemIndex,
                                                                                optIndex
                                                                            )
                                                                        }
                                                                        className="text-xs text-red-600 hover:underline"
                                                                    >
                                                                        Smazat
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => addOption(catIndex, itemIndex)}
                                                            className="text-sm text-orange-600 hover:underline"
                                                        >
                                                            + Varianta
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addItem(catIndex)}
                                            className="text-sm text-orange-600 hover:underline font-medium"
                                        >
                                            + Přidat produkt do „{category.title}“
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500';
