import React from 'react';

export function UpsellTab({ formData, updateData, setSaving, setSaveStatus }) {
    const toggleUpsellActivated = () => {
        updateData({
            ...formData,
            upsell: {
                ...formData.upsell,
                activated: !formData.upsell.activated
            }
        });
    };

    const handleUpsellChange = (field, value) => {
        updateData({
            ...formData,
            upsell: {
                ...formData.upsell,
                [field]: value
            }
        });
    };

    const handleUpsellBackgroundDelete = () => {
        updateData({
            ...formData,
            upsell: {
                ...formData.upsell,
                backgroundImage: null
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upsell</h2>
                        <p className="text-sm text-gray-600">
                            This feature shows a pop-up on the service screen to promote offers or any other content you want to highlight.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-6">
                        <span className="text-sm text-gray-700">Activated</span>
                        <button
                            onClick={toggleUpsellActivated}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                formData.upsell.activated ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.upsell.activated ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background
                    </label>
                    {formData.upsell.backgroundImage ? (
                        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden group">
                            <img
                                src={formData.upsell.backgroundImage}
                                alt="Upsell background"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                            <button
                                onClick={handleUpsellBackgroundDelete}
                                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <button
                                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                                <span className="text-white text-sm font-medium">Change image</span>
                            </button>
                        </div>
                    ) : (
                        <div
                            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
                        >
                            <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.upsell.name}
                            onChange={(e) => handleUpsellChange('name', e.target.value)}
                            className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.upsell.subtitle}
                            onChange={(e) => handleUpsellChange('subtitle', e.target.value)}
                            className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <div className="relative">
                        <textarea
                            value={formData.upsell.description}
                            onChange={(e) => handleUpsellChange('description', e.target.value)}
                            rows="4"
                            className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
