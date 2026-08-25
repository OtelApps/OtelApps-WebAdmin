import React from 'react';

const facilitiesData = [
    { name: 'Restaurants', pills: ['Name', 'Description', 'Images', 'Opening hours', 'Map location'], catalog: 'Required', booking: 'Required' },
    { name: 'Spa', pills: ['Name', 'Description', 'Images', 'Opening hours', 'Map location'], catalog: 'Required', booking: 'Required' },
    { name: 'Sports', pills: ['Name', 'Description', 'Images', 'Opening hours', 'Map location'], catalog: 'Required', booking: 'Required' },
    { name: 'Gym', pills: ['Name', 'Description', 'Images', 'Opening hours', 'Map location'], catalog: null, booking: null },
    { name: 'Other facilities', pills: ['Name', 'Description', 'Images', 'Opening hours'], catalog: null, booking: null },
    { name: 'Pools', pills: ['Name', 'Description', 'Images', 'Opening hours', 'Map location'], catalog: null, booking: null },
    { name: 'Balinese beds', pills: ['Name', 'Description', 'Images', 'Opening hours', 'Map location'], catalog: null, booking: null },
    { name: 'Attractions', pills: ['Name', 'Description', 'Images'], catalog: null, booking: null },
    { name: 'Shops', pills: ['Name', 'Description', 'Images'], catalog: null, booking: null },
    { name: 'Directory', pills: ['Name', 'Description', 'Images'], catalog: null, booking: null },
];

export function RequiredContent() {
    return (
        <div className="p-8 w-full min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            {/* Header */}
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">
                Otel Apps Content audit
            </h1>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 mb-8">
                <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    Service list
                </button>
                <button className="pb-3 text-sm font-semibold text-teal-600 dark:text-teal-400 border-b-2 border-teal-500">
                    Required content
                </button>
            </div>

            {/* Main Content Box */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    Facilities
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                <th className="pb-4 pt-2 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300 w-[200px]">Service type</th>
                                <th className="pb-4 pt-2 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300 min-w-[500px]">Required content</th>
                                <th className="pb-4 pt-2 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300 w-[120px]">Catalog</th>
                                <th className="pb-4 pt-2 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300 w-[140px]">Booking system</th>
                                <th className="pb-4 pt-2 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300 w-[60px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {facilitiesData.map((row, index) => (
                                <tr key={index} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                    <td className="py-4 px-2 font-medium text-gray-700 dark:text-gray-200">
                                        {row.name}
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex flex-wrap gap-2">
                                            {row.pills.map((pill, i) => (
                                                <span 
                                                    key={i} 
                                                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-400 rounded-md"
                                                >
                                                    {pill}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        {row.catalog && (
                                            <span className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-400 rounded-md">
                                                {row.catalog}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-2">
                                        {row.booking && (
                                            <span className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-400 rounded-md">
                                                {row.booking}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
