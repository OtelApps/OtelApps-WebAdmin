import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MainNavigation } from './MainNavigation';
import { Sidebar } from './Sidebar';
import { FloatingHelp } from './FloatingHelp';

export function Layout() {
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const showSidebar = location.pathname !== '/dashboard' && location.pathname !== '/';

    useEffect(() => {
        const handleSettingsToggle = (e) => {
            setSettingsOpen(e.detail);
        };
        
        const handleSettingsClose = () => {
            setSettingsOpen(false);
        };

        window.addEventListener('settings-toggle', handleSettingsToggle);
        window.addEventListener('settings-close', handleSettingsClose);

        return () => {
            window.removeEventListener('settings-toggle', handleSettingsToggle);
            window.removeEventListener('settings-close', handleSettingsClose);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Global Backdrop for Settings */}
            {settingsOpen && (
                <div
                    onClick={() => {
                        setSettingsOpen(false);
                        window.dispatchEvent(new CustomEvent('settings-close'));
                    }}
                    className="fixed inset-0 z-[9997] transition-opacity duration-200"
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.05)'
                    }}
                />
            )}

            {/* Top Navigation */}
            <MainNavigation settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                {showSidebar && <Sidebar />}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                    <Outlet />
                </main>
            </div>

            {/* Floating Help Button */}
            <FloatingHelp />
        </div>
    );
}

