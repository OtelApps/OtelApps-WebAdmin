import React from 'react';

export function InformationTab({ formData, updateData, setSaving, setSaveStatus }) {
    const handleInputChange = (field, value) => {
        updateData({
            ...formData,
            [field]: value
        });
    };

    const handleAdditionalInfoChange = (id, field, value) => {
        updateData({
            ...formData,
            additionalInfo: formData.additionalInfo.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        });
    };

    const addAdditionalInfo = () => {
        const newId = Math.max(...formData.additionalInfo.map(i => i.id), 0) + 1;
        updateData({
            ...formData,
            additionalInfo: [
                ...formData.additionalInfo,
                {
                    id: newId,
                    icon: 'fork-knife',
                    title: '',
                    description: '',
                    linkToService: false
                }
            ]
        });
    };

    const removeAdditionalInfo = (id) => {
        updateData({
            ...formData,
            additionalInfo: formData.additionalInfo.filter(item => item.id !== id)
        });
    };

    const handleImageDelete = (imageId) => {
        updateData({
            ...formData,
            images: formData.images.map(img =>
                img.id === imageId ? { ...img, url: null } : img
            )
        });
    };

    const getIconSvg = (iconName) => {
        switch (iconName) {
            case 'fork-knife':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                    </svg>
                );
            case 'crab':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.42.17L8.41 3 7 4.41l1.63 1.63C7.88 6.55 7.26 7.22 6.81 8H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h4.18c.16.65.46 1.24.88 1.74L6 19.41 7.41 21l2.17-2.17c.46.11.93.17 1.42.17s.96-.06 1.42-.17L14.59 21 16 19.41l-2.06-2.07c.42-.5.72-1.09.88-1.74H20c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2zM4 13v-3h2.12c.08.32.2.63.35.92L4 13zm16 0h-2.47l-2.47-2.08c.15-.29.27-.6.35-.92H20v3z"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Information</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Add the basic information about the service. You can include the translation into other languages by clicking on the flag icon next to each text box.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <div className="relative">
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows="5"
                                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <p>Maximum file size: 1 MB</p>
                        <p>Recommended dimensions: 800 × 420 pixels</p>
                        <p>Format: landscape</p>
                        <p>The first image will be the cover image</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {formData.images.map((image, index) => (
                            <div key={image.id} className="relative">
                                {image.url ? (
                                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                                        <img
                                            src={image.url}
                                            alt={`Image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <button
                                            onClick={() => handleImageDelete(image.id)}
                                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <button className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <span className="text-white text-sm font-medium">Change image</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer">
                                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-500">Upload image</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Additional Info</h2>
                        <p className="text-sm text-gray-600">
                            Include additional information about the service such as contact details, directions to get there, or specific rules.
                        </p>
                    </div>
                    <button
                        onClick={addAdditionalInfo}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
                    >
                        + ADD ADDITIONAL INFO
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {formData.additionalInfo.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                            <div className="flex-shrink-0 mt-1 text-gray-600">
                                {getIconSvg(item.icon)}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => handleAdditionalInfoChange(item.id, 'title', e.target.value)}
                                        placeholder="Title"
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleAdditionalInfoChange(item.id, 'description', e.target.value)}
                                        placeholder="Description"
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={item.linkToService}
                                        onChange={(e) => handleAdditionalInfoChange(item.id, 'linkToService', e.target.checked)}
                                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">Link to service</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => removeAdditionalInfo(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dress code</h3>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={formData.dressCode}
                            onChange={(e) => handleInputChange('dressCode', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
