import React from 'react';

export function HashTabs({ tabs, activeTab, onSelectTab }) {
    return (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === tab.id
                            ? 'border-orange-500 text-orange-500'
                            : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
