import React from 'react';

export function HotelInfoSectionsTab({
    sections,
    setSections,
    onSave,
    saveStatus,
    iconLibraries,
}) {
    const updateSection = (index, patch) => {
        setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addSection = () => {
        setSections((prev) => [
            ...prev,
            {
                id: null,
                slug: `sekce-${prev.length + 1}`,
                title: 'Nová podsekce',
                description: '',
                icon_library: iconLibraries[0] || 'ionicons',
                icon_name: 'information-circle-outline',
                sort_order: prev.length,
            },
        ]);
    };

    const deleteSection = async (index) => {
        if (!window.confirm('Smazat tuto podsekci?')) return;
        const next = sections.filter((_, i) => i !== index);
        setSections(next);
        await onSave(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Podsekce na detailu v aplikaci — tabulka{' '}
                    <code className="text-xs">hotel_info_sections</code>
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addSection}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        + Podsekce
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave()}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                    >
                        {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit podsekce'}
                    </button>
                </div>
            </div>

            {sections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Zatím žádné podsekce.</p>
                    <button
                        type="button"
                        onClick={addSection}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                    >
                        Přidat první podsekci
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <div
                            key={section.id || `new-${index}`}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                        >
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-medium text-gray-400">
                                    #{index + 1} · {section.slug}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => deleteSection(index)}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    Smazat
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Slug</span>
                                    <input
                                        className={inputClass}
                                        value={section.slug}
                                        onChange={(e) => updateSection(index, { slug: e.target.value })}
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Nadpis</span>
                                    <input
                                        className={inputClass}
                                        value={section.title}
                                        onChange={(e) => updateSection(index, { title: e.target.value })}
                                    />
                                </label>
                            </div>
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Popis</span>
                                <textarea
                                    className={inputClass}
                                    rows={4}
                                    value={section.description}
                                    onChange={(e) => updateSection(index, { description: e.target.value })}
                                />
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Knihovna ikon</span>
                                    <select
                                        className={inputClass}
                                        value={section.icon_library}
                                        onChange={(e) =>
                                            updateSection(index, { icon_library: e.target.value })
                                        }
                                    >
                                        {iconLibraries.map((lib) => (
                                            <option key={lib} value={lib}>
                                                {lib}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block text-sm md:col-span-2">
                                    <span className="text-gray-600 dark:text-gray-400">Název ikony</span>
                                    <input
                                        className={inputClass}
                                        value={section.icon_name}
                                        onChange={(e) => updateSection(index, { icon_name: e.target.value })}
                                        placeholder="např. person-outline"
                                    />
                                </label>
                            </div>
                            <label className="block text-sm w-32">
                                <span className="text-gray-600 dark:text-gray-400">Pořadí</span>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={section.sort_order}
                                    onChange={(e) =>
                                        updateSection(index, {
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
