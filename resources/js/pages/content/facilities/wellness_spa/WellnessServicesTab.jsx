import React from 'react';

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
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }).format(amount);
    }
    return `${amount} ${currency}`;
}

export function WellnessServicesTab({ services, setServices, onSave, saveStatus }) {
    const updateService = (index, patch) => {
        setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addService = () => {
        setServices((prev) => [
            ...prev,
            {
                id: null,
                slug: `sluzba-${prev.length + 1}`,
                name: 'Nová služba',
                duration_minutes: 50,
                price_amount: 0,
                currency: 'CZK',
                description: '',
                sort_order: prev.length,
                is_available: true,
            },
        ]);
    };

    const deleteService = async (index) => {
        if (!window.confirm('Smazat tuto službu z ceníku?')) return;
        const next = services.filter((_, i) => i !== index);
        setServices(next);
        await onSave(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ceník služeb (masáže, procedury) — tabulka <code className="text-xs">wellness_services</code>
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addService}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        + Služba
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave()}
                        disabled={saveStatus === 'saving'}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                    >
                        {saveStatus === 'saving' ? 'Ukládám…' : 'Uložit ceník'}
                    </button>
                </div>
            </div>

            {services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Zatím žádné služby v ceníku.</p>
                    <button
                        type="button"
                        onClick={addService}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                    >
                        + Přidat službu
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map((service, index) => (
                        <div
                            key={service.id || `svc-${index}`}
                            className={`rounded-xl border p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start ${
                                service.is_available
                                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-70'
                            }`}
                        >
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Název</label>
                                <input
                                    className={inputClass}
                                    value={service.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const patch = { name };
                                        if (!service.id) patch.slug = slugify(name);
                                        updateService(index, patch);
                                    }}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Délka (min)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={inputClass}
                                    value={service.duration_minutes}
                                    onChange={(e) =>
                                        updateService(index, {
                                            duration_minutes: parseInt(e.target.value, 10) || 1,
                                        })
                                    }
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Cena</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    className={inputClass}
                                    value={service.price_amount}
                                    onChange={(e) =>
                                        updateService(index, {
                                            price_amount: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div className="md:col-span-2 flex flex-col justify-end">
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-2">
                                    {formatPrice(service.price_amount, service.currency)}
                                </span>
                                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <input
                                        type="checkbox"
                                        checked={service.is_available}
                                        onChange={(e) =>
                                            updateService(index, { is_available: e.target.checked })
                                        }
                                        className="rounded text-orange-500"
                                    />
                                    Dostupné
                                </label>
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => deleteService(index)}
                                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                >
                                    Smazat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500';
