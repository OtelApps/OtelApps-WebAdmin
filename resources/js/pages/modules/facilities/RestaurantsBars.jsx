import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RestaurantsBars() {
    const navigate = useNavigate();
    const [showArchivedRestaurants, setShowArchivedRestaurants] = useState(false);
    const [showArchivedBars, setShowArchivedBars] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);

    // Mock data - v budoucnu se načte z API
    const restaurants = [
        {
            id: 1,
            title: 'Hotel restaurant',
            image: '/images/restaurant-1.jpg',
            bookingEnabled: true,
        },
        {
            id: 2,
            title: 'Kazoku Restaurant',
            image: '/images/restaurant-2.jpg',
            bookingEnabled: true,
        },
        {
            id: 3,
            title: 'Quick Order',
            image: '/images/restaurant-3.jpg',
            bookingEnabled: true,
        },
    ];

    const bars = [
        {
            id: 1,
            title: 'Le Gourmet',
            image: '/images/bar-1.jpg',
            bookingEnabled: true,
        },
        {
            id: 2,
            title: 'Kazoku Restaurant',
            image: '/images/bar-2.jpg',
            bookingEnabled: true,
        },
    ];

    const Card = ({ item, type }) => (
        <div
            className="bg-white rounded-lg shadow-md overflow-hidden relative group"
            onMouseEnter={() => setHoveredCard(`${type}-${item.id}`)}
            onMouseLeave={() => setHoveredCard(null)}
        >
            {/* Image */}
            <div className="relative h-48 bg-gray-200">
                <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                {/* Placeholder if no image */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* Overlay with Edit/Delete buttons on hover */}
                {hoveredCard === `${type}-${item.id}` && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-3 transition-opacity">
                        <button 
                            onClick={() => navigate(`/module/facilities/restaurants_bars/${item.id}/edit`)}
                            className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Edit
                        </button>
                        <button className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                {item.bookingEnabled && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Booking ON
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Restaurants Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowArchivedRestaurants(!showArchivedRestaurants);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Show archived services
                    </a>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-6">
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                        + ADD
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        HELP
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                    </button>
                    <div className="relative">
                        <button className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Restaurant Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.map((restaurant) => (
                        <Card key={restaurant.id} item={restaurant} type="restaurant" />
                    ))}
                </div>
            </div>

            {/* Bars Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Bars</h1>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowArchivedBars(!showArchivedBars);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Show archived services
                    </a>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-6">
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                        + ADD
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        HELP
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                    </button>
                    <div className="relative">
                        <button className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Bar Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bars.map((bar) => (
                        <Card key={bar.id} item={bar} type="bar" />
                    ))}
                </div>
            </div>
        </div>
    );
}

