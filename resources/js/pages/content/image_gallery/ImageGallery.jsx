import React, { useState } from 'react';

// MOCK DATA for the frontend design
const MOCK_IMAGES = [
    { id: 1, url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800', name: 'hotel_exterior.jpg', size: '2.4 MB' },
    { id: 2, url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800', name: 'deluxe_room.jpg', size: '1.8 MB' },
    { id: 3, url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800', name: 'pool_area.jpg', size: '3.1 MB' },
    { id: 4, url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800', name: 'restaurant.jpg', size: '1.5 MB' },
    { id: 5, url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800', name: 'spa_wellness.jpg', size: '2.2 MB' },
    { id: 6, url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800', name: 'reception.jpg', size: '1.9 MB' },
];

export function ImageGallery() {
    const [images, setImages] = useState(MOCK_IMAGES);

    const handleDelete = (id) => {
        setImages(images.filter(img => img.id !== id));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                        Galerie médií
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Přehledné úložiště všech fotografií pro snadné použití napříč systémem.
                    </p>
                </div>
                
                <button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Nahrát fotky
                </button>
            </div>

            {/* Dropzone Area (Mock) */}
            <div className="mb-8 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Přetáhněte obrázky sem
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG, WEBP do velikosti 5MB
                </p>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {images.map((img) => (
                    <div key={img.id} className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col">
                        
                        {/* Image Container with strict aspect ratio */}
                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                            <img 
                                src={img.url} 
                                alt={img.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                            
                            {/* Action Buttons (Visible on hover) */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                                <button 
                                    onClick={() => handleDelete(img.id)}
                                    className="p-1.5 bg-white/90 hover:bg-red-500 text-gray-700 hover:text-white rounded-lg backdrop-blur-sm transition-colors shadow-sm"
                                    title="Smazat obrázek"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Image Meta Info */}
                        <div className="p-3">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={img.name}>
                                {img.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {img.size}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Zatím nebyly nahrány žádné obrázky.</p>
                </div>
            )}
        </div>
    );
}
