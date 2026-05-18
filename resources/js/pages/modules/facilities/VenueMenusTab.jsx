import React, { useEffect, useState } from 'react';

const NAVIGATION_SCREENS = ['RestaurantMenu', 'LobbyBarMenu'];

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function formatPrice(amount, currency = 'CZK') {
    if (currency === 'CZK') {
        return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount);
    }
    return `${amount} ${currency}`;
}

function patchMenus(setMenus, updater) {
    setMenus((prev) => updater(prev));
}

export function VenueMenusTab({ menus, setMenus, allergens, onSave, saveStatus }) {
    const [activeMenuIndex, setActiveMenuIndex] = useState(0);
    const [editingItem, setEditingItem] = useState(null);
    const [showMenuSettings, setShowMenuSettings] = useState(false);

    useEffect(() => {
        if (activeMenuIndex >= menus.length) {
            setActiveMenuIndex(Math.max(0, menus.length - 1));
        }
    }, [menus.length, activeMenuIndex]);

    const activeMenu = menus[activeMenuIndex];
    const totalItems = menus.reduce(
        (sum, m) => sum + (m.categories || []).reduce((s, c) => s + (c.items || []).length, 0),
        0
    );

    const updateMenu = (menuIndex, patch) => {
        patchMenus(setMenus, (prev) => prev.map((m, i) => (i === menuIndex ? { ...m, ...patch } : m)));
    };

    const applyMenusAndSave = async (nextMenus) => {
        setMenus(nextMenus);
        await onSave(nextMenus);
    };

    const updateCategory = (menuIndex, catIndex, patch) => {
        patchMenus(setMenus, (prev) =>
            prev.map((m, i) => {
                if (i !== menuIndex) return m;
                const categories = (m.categories || []).map((c, ci) =>
                    ci === catIndex ? { ...c, ...patch } : c
                );
                return { ...m, categories };
            })
        );
    };

    const updateItem = (menuIndex, catIndex, itemIndex, patch) => {
        patchMenus(setMenus, (prev) =>
            prev.map((m, i) => {
                if (i !== menuIndex) return m;
                const categories = (m.categories || []).map((c, ci) => {
                    if (ci !== catIndex) return c;
                    const items = (c.items || []).map((item, ii) =>
                        ii === itemIndex ? { ...item, ...patch } : item
                    );
                    return { ...c, items };
                });
                return { ...m, categories };
            })
        );
    };

    const deleteMenu = async (menuIndex) => {
        if (!window.confirm('Opravdu smazat celé menu včetně kategorií a položek?')) return;
        const next = menus.filter((_, i) => i !== menuIndex);
        setEditingItem(null);
        await applyMenusAndSave(next);
    };

    const deleteCategory = async (menuIndex, catIndex) => {
        if (!window.confirm('Smazat kategorii a všechny její položky?')) return;
        const next = menus.map((m, i) =>
            i === menuIndex
                ? { ...m, categories: (m.categories || []).filter((_, ci) => ci !== catIndex) }
                : m
        );
        setEditingItem(null);
        await applyMenusAndSave(next);
    };

    const deleteItem = async (menuIndex, catIndex, itemIndex) => {
        if (!window.confirm('Smazat tuto položku?')) return;
        const next = menus.map((m, i) => {
            if (i !== menuIndex) return m;
            const categories = (m.categories || []).map((c, ci) => {
                if (ci !== catIndex) return c;
                return { ...c, items: (c.items || []).filter((_, ii) => ii !== itemIndex) };
            });
            return { ...m, categories };
        });
        setEditingItem(null);
        await applyMenusAndSave(next);
    };

    const addMenu = () => {
        patchMenus(setMenus, (prev) => [
            ...prev,
            {
                id: null,
                slug: `menu-${prev.length + 1}`,
                title: 'Nové menu',
                navigation_screen: 'RestaurantMenu',
                sort_order: prev.length,
                is_active: true,
                categories: [],
            },
        ]);
        setActiveMenuIndex(menus.length);
    };

    const addCategory = () => {
        patchMenus(setMenus, (prev) =>
            prev.map((m, i) => {
                if (i !== activeMenuIndex) return m;
                const categories = m.categories || [];
                return {
                    ...m,
                    categories: [
                        ...categories,
                        {
                            id: null,
                            slug: `kategorie-${categories.length + 1}`,
                            title: 'Nová kategorie',
                            sort_order: categories.length,
                            items: [],
                        },
                    ],
                };
            })
        );
    };

    const addItem = (catIndex) => {
        let newIndex = 0;
        patchMenus(setMenus, (prev) =>
            prev.map((m, i) => {
                if (i !== activeMenuIndex) return m;
                const categories = (m.categories || []).map((c, ci) => {
                    if (ci !== catIndex) return c;
                    const items = c.items || [];
                    newIndex = items.length;
                    return {
                        ...c,
                        items: [
                            ...items,
                            {
                                id: null,
                                slug: `polozka-${items.length + 1}`,
                                name: 'Nová položka',
                                description_short: '',
                                description_long: '',
                                price_amount: 0,
                                currency: 'CZK',
                                sort_order: items.length,
                                is_available: true,
                                image_url: null,
                                allergen_codes: [],
                            },
                        ],
                    };
                });
                return { ...m, categories };
            })
        );
        setEditingItem({ menuIndex: activeMenuIndex, catIndex, itemIndex: newIndex });
    };

    const toggleAllergen = (menuIndex, catIndex, itemIndex, code) => {
        patchMenus(setMenus, (prev) =>
            prev.map((m, i) => {
                if (i !== menuIndex) return m;
                const categories = (m.categories || []).map((c, ci) => {
                    if (ci !== catIndex) return c;
                    const items = (c.items || []).map((item, ii) => {
                        if (ii !== itemIndex) return item;
                        const codes = item.allergen_codes || [];
                        const allergen_codes = codes.includes(code)
                            ? codes.filter((c) => c !== code)
                            : [...codes, code];
                        return { ...item, allergen_codes };
                    });
                    return { ...c, items };
                });
                return { ...m, categories };
            })
        );
    };

    const editingData =
        editingItem &&
        menus[editingItem.menuIndex]?.categories?.[editingItem.catIndex]?.items?.[editingItem.itemIndex];

    return (
        <div className="relative space-y-5">
            {/* Toolbar */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 shadow-sm">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Menu podniku</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {menus.length} nabídek · {totalItems} položek
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={addMenu}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        + Menu
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave()}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit změny'}
                    </button>
                </div>
            </div>

            {menus.length === 0 ? (
                <EmptyState onAddMenu={addMenu} />
            ) : (
                <>
                    {/* Menu tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {menus.map((menu, idx) => {
                            const count = (menu.categories || []).reduce(
                                (s, c) => s + (c.items || []).length,
                                0
                            );
                            const active = idx === activeMenuIndex;
                            return (
                                <button
                                    key={menu.id || idx}
                                    type="button"
                                    onClick={() => {
                                        setActiveMenuIndex(idx);
                                        setEditingItem(null);
                                    }}
                                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                        active
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-500/50'
                                    }`}
                                >
                                    <span className="block">{menu.title}</span>
                                    <span
                                        className={`block text-xs mt-0.5 ${active ? 'text-orange-100' : 'text-gray-400 dark:text-gray-500'}`}
                                    >
                                        {count} položek
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {activeMenu && (
                        <div className="space-y-6">
                            {/* Menu meta */}
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowMenuSettings((v) => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Nastavení nabídky „{activeMenu.title}“
                                    </span>
                                    <ChevronIcon open={showMenuSettings} small />
                                </button>
                                {showMenuSettings && (
                                    <div className="px-4 pb-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <LabeledField label="Název v adminu">
                                            <input
                                                className={inputClass}
                                                value={activeMenu.title}
                                                onChange={(e) => {
                                                    const title = e.target.value;
                                                    const patch = { title };
                                                    if (!activeMenu.id) patch.slug = slugify(title);
                                                    updateMenu(activeMenuIndex, patch);
                                                }}
                                            />
                                        </LabeledField>
                                        <LabeledField label="Slug">
                                            <input
                                                className={inputClass}
                                                value={activeMenu.slug}
                                                onChange={(e) =>
                                                    updateMenu(activeMenuIndex, {
                                                        slug: slugify(e.target.value),
                                                    })
                                                }
                                            />
                                        </LabeledField>
                                        <LabeledField label="Obrazovka v app">
                                            <select
                                                className={inputClass}
                                                value={activeMenu.navigation_screen}
                                                onChange={(e) =>
                                                    updateMenu(activeMenuIndex, {
                                                        navigation_screen: e.target.value,
                                                    })
                                                }
                                            >
                                                {NAVIGATION_SCREENS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </LabeledField>
                                        <div className="flex items-end gap-3">
                                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 pb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={activeMenu.is_active}
                                                    onChange={(e) =>
                                                        updateMenu(activeMenuIndex, {
                                                            is_active: e.target.checked,
                                                        })
                                                    }
                                                    className="rounded text-orange-500"
                                                />
                                                Aktivní
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => deleteMenu(activeMenuIndex)}
                                                className="text-sm text-red-600 dark:text-red-400 hover:underline pb-2"
                                            >
                                                Smazat menu
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Categories */}
                            {(activeMenu.categories || []).length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        V této nabídce zatím nejsou kategorie.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={addCategory}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                                    >
                                        + Přidat kategorii
                                    </button>
                                </div>
                            ) : (
                                (activeMenu.categories || []).map((cat, catIndex) => (
                                    <CategorySection
                                        key={cat.id || `cat-${catIndex}`}
                                        category={cat}
                                        catIndex={catIndex}
                                        menuIndex={activeMenuIndex}
                                        onUpdateTitle={(title) => {
                                            const patch = { title };
                                            if (!cat.id) patch.slug = slugify(title);
                                            updateCategory(activeMenuIndex, catIndex, patch);
                                        }}
                                        onDelete={() => deleteCategory(activeMenuIndex, catIndex)}
                                        onAddItem={() => addItem(catIndex)}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {(cat.items || []).map((item, itemIndex) => (
                                                <MenuItemCard
                                                    key={item.id || `item-${itemIndex}`}
                                                    item={item}
                                                    isSelected={
                                                        editingItem?.menuIndex === activeMenuIndex &&
                                                        editingItem?.catIndex === catIndex &&
                                                        editingItem?.itemIndex === itemIndex
                                                    }
                                                    onEdit={() =>
                                                        setEditingItem({
                                                            menuIndex: activeMenuIndex,
                                                            catIndex,
                                                            itemIndex,
                                                        })
                                                    }
                                                    onQuickUpdate={(patch) =>
                                                        updateItem(
                                                            activeMenuIndex,
                                                            catIndex,
                                                            itemIndex,
                                                            patch
                                                        )
                                                    }
                                                />
                                            ))}
                                            <AddItemCard onClick={() => addItem(catIndex)} />
                                        </div>
                                    </CategorySection>
                                ))
                            )}

                            <button
                                type="button"
                                onClick={addCategory}
                                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                            >
                                + Nová kategorie
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Edit panel */}
            {editingItem && editingData && (
                <ItemEditPanel
                    item={editingData}
                    allergens={allergens}
                    onClose={() => setEditingItem(null)}
                    onUpdate={(patch) =>
                        updateItem(
                            editingItem.menuIndex,
                            editingItem.catIndex,
                            editingItem.itemIndex,
                            patch
                        )
                    }
                    onToggleAllergen={(code) =>
                        toggleAllergen(
                            editingItem.menuIndex,
                            editingItem.catIndex,
                            editingItem.itemIndex,
                            code
                        )
                    }
                    onDelete={() =>
                        deleteItem(
                            editingItem.menuIndex,
                            editingItem.catIndex,
                            editingItem.itemIndex
                        )
                    }
                />
            )}
        </div>
    );
}

function CategorySection({ category, children, onUpdateTitle, onDelete, onAddItem }) {
    const itemCount = (category.items || []).length;

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-orange-500 shrink-0" />
                <input
                    className="flex-1 min-w-[200px] text-lg font-semibold bg-transparent border-0 border-b-2 border-transparent focus:border-orange-500 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400 px-0 py-1 transition-colors"
                    value={category.title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    placeholder="Název kategorie"
                />
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {itemCount} {itemCount === 1 ? 'položka' : itemCount < 5 ? 'položky' : 'položek'}
                </span>
                <button
                    type="button"
                    onClick={onDelete}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                    Smazat kategorii
                </button>
            </div>
            {children}
        </section>
    );
}

function MenuItemCard({ item, isSelected, onEdit, onQuickUpdate }) {
    return (
        <article
            className={`group relative flex flex-col rounded-2xl border overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md ${
                isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500/40'
            } ${!item.is_available ? 'opacity-60' : ''}`}
        >
            <button type="button" onClick={onEdit} className="text-left flex flex-col flex-1">
                <ItemImage url={item.image_url} name={item.name} />
                <div className="p-4 flex-1 flex flex-col gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                        {item.name || 'Bez názvu'}
                    </h3>
                    {item.description_short && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {item.description_short}
                        </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                            {formatPrice(item.price_amount, item.currency)}
                        </span>
                        {!item.is_available && (
                            <span className="text-[10px] uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                                Skryto
                            </span>
                        )}
                    </div>
                    {(item.allergen_codes || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {item.allergen_codes.slice(0, 5).map((code) => (
                                <span
                                    key={code}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                >
                                    {code}
                                </span>
                            ))}
                            {item.allergen_codes.length > 5 && (
                                <span className="text-[10px] text-gray-400">
                                    +{item.allergen_codes.length - 5}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </button>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onQuickUpdate({ is_available: !item.is_available });
                    }}
                    className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 shadow text-gray-600 dark:text-gray-300 hover:text-orange-500"
                    title={item.is_available ? 'Skrýt z menu' : 'Zobrazit v menu'}
                >
                    <EyeIcon hidden={!item.is_available} />
                </button>
            </div>
        </article>
    );
}

function ItemImage({ url, name }) {
  const [error, setError] = useState(false);

    if (url && !error) {
        return (
            <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <img
                    src={url}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    return (
        <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
            </svg>
        </div>
    );
}

function AddItemCard({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all"
        >
            <span className="text-3xl font-light mb-1">+</span>
            <span className="text-sm font-medium">Nová položka</span>
        </button>
    );
}

function ItemEditPanel({ item, allergens, onClose, onUpdate, onToggleAllergen, onDelete }) {
    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
                onClick={onClose}
                aria-hidden
            />
            <aside className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-700">
                <header className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upravit položku</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    >
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <ItemImage url={item.image_url} name={item.name} />

                    <LabeledField label="Název">
                        <input
                            className={inputClass}
                            value={item.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                const patch = { name };
                                if (!item.id) patch.slug = slugify(name);
                                onUpdate(patch);
                            }}
                        />
                    </LabeledField>

                    <div className="grid grid-cols-2 gap-3">
                        <LabeledField label="Cena">
                            <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={item.price_amount}
                                onChange={(e) =>
                                    onUpdate({ price_amount: parseInt(e.target.value, 10) || 0 })
                                }
                            />
                        </LabeledField>
                        <LabeledField label="Měna">
                            <input
                                className={inputClass}
                                value={item.currency || 'CZK'}
                                onChange={(e) => onUpdate({ currency: e.target.value })}
                            />
                        </LabeledField>
                    </div>

                    <LabeledField label="URL obrázku">
                        <input
                            className={inputClass}
                            value={item.image_url || ''}
                            onChange={(e) => onUpdate({ image_url: e.target.value || null })}
                            placeholder="https://…"
                        />
                    </LabeledField>

                    <LabeledField label="Krátký popis">
                        <input
                            className={inputClass}
                            value={item.description_short || ''}
                            onChange={(e) => onUpdate({ description_short: e.target.value })}
                        />
                    </LabeledField>

                    <LabeledField label="Dlouhý popis">
                        <textarea
                            className={inputClass}
                            rows={4}
                            value={item.description_long || ''}
                            onChange={(e) => onUpdate({ description_long: e.target.value })}
                        />
                    </LabeledField>

                    <LabeledField label="Slug">
                        <input
                            className={inputClass}
                            value={item.slug}
                            onChange={(e) => onUpdate({ slug: slugify(e.target.value) })}
                        />
                    </LabeledField>

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={item.is_available}
                            onChange={(e) => onUpdate({ is_available: e.target.checked })}
                            className="rounded text-orange-500"
                        />
                        Zobrazit v mobilní aplikaci
                    </label>

                    <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Alergeny (EU)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {allergens.map((a) => {
                                const active = (item.allergen_codes || []).includes(a.code);
                                return (
                                    <button
                                        key={a.code}
                                        type="button"
                                        onClick={() => onToggleAllergen(a.code)}
                                        title={a.name_cs}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                            active
                                                ? 'bg-orange-500 border-orange-500 text-white'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {a.code}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className="shrink-0 p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        Smazat
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold"
                    >
                        Hotovo
                    </button>
                </footer>
            </aside>
        </>
    );
}

function EmptyState({ onAddMenu }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center bg-gray-50/50 dark:bg-gray-900/30">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Zatím nemáš žádné menu.</p>
            <button
                type="button"
                onClick={onAddMenu}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold"
            >
                Vytvořit první menu
            </button>
        </div>
    );
}

function ChevronIcon({ open, small }) {
    const size = small ? 'w-4 h-4' : 'w-5 h-5';
    return (
        <svg className={`${size} transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function EyeIcon({ hidden }) {
    if (hidden) {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
        );
    }
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function LabeledField({ label, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500';
