import React from 'react';

export function CatalogTab({ formData, updateData }) {
    const handleCatalogNameChange = (value) => {
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                newCatalogName: value
            }
        });
    };

    const addCatalog = () => {
        if (!formData.catalogs.newCatalogName.trim()) return;
        
        const newId = Math.max(...formData.catalogs.catalogs.map(c => c.id), 0) + 1;
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                catalogs: [
                    ...formData.catalogs.catalogs,
                    { id: newId, name: formData.catalogs.newCatalogName, icon: 'menu' }
                ],
                newCatalogName: ''
            }
        });
    };

    const removeCatalog = (catalogId) => {
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                catalogs: formData.catalogs.catalogs.filter(c => c.id !== catalogId)
            }
        });
    };

    const toggleCatalogEnabled = () => {
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                enabled: !formData.catalogs.enabled
            }
        });
    };

    const addCurrency = () => {
        const newId = Math.max(...formData.catalogs.currencies.map(c => c.id), 0) + 1;
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                currencies: [
                    ...formData.catalogs.currencies,
                    { id: newId, name: 'EUR' }
                ]
            }
        });
    };

    const removeCurrency = (currencyId) => {
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                currencies: formData.catalogs.currencies.filter(c => c.id !== currencyId)
            }
        });
    };

    const addCategory = () => {
        const newId = Math.max(...formData.catalogs.categories.map(c => c.id), 0) + 1;
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                categories: [
                    ...formData.catalogs.categories,
                    { id: newId, name: 'New Category', expanded: false }
                ]
            }
        });
    };

    const removeCategory = (categoryId) => {
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                categories: formData.catalogs.categories.filter(c => c.id !== categoryId)
            }
        });
    };

    const toggleCategoryExpanded = (categoryId) => {
        updateData({
            ...formData,
            catalogs: {
                ...formData.catalogs,
                categories: formData.catalogs.categories.map(c =>
                    c.id === categoryId ? { ...c, expanded: !c.expanded } : c
                )
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Product catalog</h2>
                <p className="text-sm text-gray-600 mb-6">
                    In this section, you can add the list of products available in this service or facility. You can choose between 3 catalog types: PDF, linked, or manual. You can create several catalogs if you need to.
                </p>

                {formData.catalogs.catalogs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.catalogs.catalogs.map((catalog) => (
                            <div
                                key={catalog.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                            >
                                <span>{catalog.name}</span>
                                <button
                                    onClick={() => removeCatalog(catalog.id)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select an icon and enter a name for your catalog
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.catalogs.newCatalogName}
                            onChange={(e) => handleCatalogNameChange(e.target.value)}
                            maxLength={24}
                            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Katalog (např. Menu)"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Maximum 24 characters</p>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={addCatalog}
                        disabled={!formData.catalogs.newCatalogName.trim()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + ADD CATALOG
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">ENABLED</span>
                        <button
                            onClick={toggleCatalogEnabled}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                formData.catalogs.enabled ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.catalogs.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-4 text-sm text-gray-700">Products</span>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Currencies</h2>
                    <button
                        onClick={addCurrency}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                        + ADD CURRENCY
                    </button>
                </div>

                {formData.catalogs.currencies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {formData.catalogs.currencies.map((currency) => (
                            <div
                                key={currency.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                            >
                                <span>{currency.name}</span>
                                <button
                                    onClick={() => removeCurrency(currency.id)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Add products to the catalog</h2>
                        <p className="text-sm text-gray-600">
                            To add products, you first need to add a category to the catalog. Click on ADD CATEGORY, type a name, and click on the arrow next to it. You will then be able to start adding products.
                        </p>
                    </div>
                    <button
                        onClick={addCategory}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
                    >
                        + ADD CATEGORY
                    </button>
                </div>

                <div className="space-y-2">
                    {formData.catalogs.categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                            <button
                                onClick={() => toggleCategoryExpanded(category.id)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <svg
                                    className={`w-5 h-5 transition-transform ${category.expanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="font-medium">+ {category.name}</span>
                            </button>
                            <button
                                onClick={() => removeCategory(category.id)}
                                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
