import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

export function Sidebar() {
    const location = useLocation();
    const [modules, setModules] = useState([]);
    const [expandedSections, setExpandedSections] = useState([]);

    useEffect(() => {
        axios.get('/api/modules/sidebar')
            .then(response => {
                const modulesData = response.data?.modules;
                // Convert to array format
                let modulesArray = [];
                if (Array.isArray(modulesData)) {
                    modulesArray = modulesData;
                } else if (modulesData && typeof modulesData === 'object') {
                    modulesArray = Object.entries(modulesData).map(([key, value]) => ({
                        key,
                        ...(typeof value === 'object' ? value : {}),
                    }));
                }
                setModules(modulesArray);
                
                // Auto-expand sections that contain the current route
                const currentPath = location.pathname;
                const sectionsToExpand = [];
                modulesArray.forEach((module, index) => {
                    if (module && module.submodules && Array.isArray(module.submodules)) {
                        const moduleKey = module.key || `module-${index}`;
                        const hasActiveSubmodule = module.submodules.some(sub => 
                            sub && sub.key && (currentPath === `/module/${moduleKey}/${sub.key}` || currentPath === `/module/${moduleKey}/${moduleKey}`)
                        );
                        // Also check if the section itself is active
                        const isSectionActive = currentPath === `/module/${moduleKey}/${moduleKey}`;
                        if (hasActiveSubmodule || isSectionActive) {
                            sectionsToExpand.push(moduleKey);
                        }
                    }
                });
                setExpandedSections(sectionsToExpand);
            })
            .catch(error => {
                console.error('Error loading sidebar modules:', error);
                setModules([]);
            });
    }, [location.pathname]);

    const toggleSection = (key) => {
        setExpandedSections(prev => 
            prev.includes(key) 
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const isActive = (type, module) => {
        return location.pathname === `/module/${type}/${module}`;
    };

    const isSectionActive = (sectionKey) => {
        // Check if any submodule of this section is active
        const module = modules.find(m => m.key === sectionKey);
        if (module && module.submodules) {
            return module.submodules.some(sub => 
                location.pathname === `/module/${sectionKey}/${sub.key}`
            );
        }
        // Check if the section itself is active
        return location.pathname === `/module/${sectionKey}/${sectionKey}`;
    };

    return (
        <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto h-full">
            <div className="p-4">
                {Array.isArray(modules) && modules.length > 0 ? (
                    modules.map((module, index) => {
                    const moduleKey = module.key || `module-${index}`;
                    
                    if (module.submodules) {
                        // Section with sub-items
                        const isExpanded = expandedSections.includes(moduleKey);
                        return (
                            <div key={moduleKey} className="mb-4">
                                <div className="flex items-center w-full">
                                    <Link
                                        to={`/module/${moduleKey}/${moduleKey}`}
                                        className={`flex-1 flex items-center justify-between px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                                            isExpanded || isSectionActive(moduleKey) ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : ''
                                        }`}
                                    >
                                        <span className="font-semibold">{module.label}</span>
                                    </Link>
                                    <button
                                        onClick={() => toggleSection(moduleKey)}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <svg
                                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {isExpanded && module.submodules && Array.isArray(module.submodules) && (
                                    <div className="mt-2 space-y-1">
                                        {module.submodules.map((subModule) => (
                                            <Link
                                                key={subModule.key}
                                                to={`/module/${moduleKey}/${subModule.key}`}
                                                className={`block px-6 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors ${
                                                    isActive(moduleKey, subModule.key)
                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                        : ''
                                                }`}
                                            >
                                                {subModule.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    } else {
                        // Simple module
                        return (
                            <Link
                                key={moduleKey}
                                to={`/module/${moduleKey}/${moduleKey}`}
                                className={`block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors mb-2 ${
                                    isActive(moduleKey, moduleKey)
                                        ? 'bg-orange-50 dark:bg-orange-900/20'
                                        : ''
                                }`}
                            >
                                <span className="font-medium">{module.label}</span>
                            </Link>
                        );
                    }
                })
                ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                )}
            </div>
        </aside>
    );
}

