import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation } from 'react-router-dom';
import { MainNavigation } from './MainNavigation';
import { Sidebar } from './Sidebar';
import { FloatingHelp } from '../ui/FloatingHelp';
import { NotificationProvider } from '../../context/NotificationContext';
import { NotificationToasts } from '../notifications/NotificationToasts';
import { NotificationSettingsModal } from '../notifications/NotificationSettingsModal';

export function Layout() {
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);

    const showSidebar =
        location.pathname !== '/dashboard' &&
        location.pathname !== '/' &&
        !location.pathname.startsWith('/concierge') &&
        !location.pathname.startsWith('/activity') &&
        !location.pathname.startsWith('/recepce') &&
        !location.pathname.startsWith('/ukoly') &&
        !location.pathname.startsWith('/nastaveni');

    useEffect(() => {
        const handleSettingsToggle = (e) => {
            setSettingsOpen(Boolean(e.detail));
        };
        const handleSettingsClose = () => {
            setSettingsOpen(false);
        };
        const handleOpenNotificationSettings = () => {
            setSettingsOpen(false);
            setNotificationSettingsOpen(true);
        };

        window.addEventListener('settings-toggle', handleSettingsToggle);
        window.addEventListener('settings-close', handleSettingsClose);
        window.addEventListener('open-notification-settings', handleOpenNotificationSettings);

        return () => {
            window.removeEventListener('settings-toggle', handleSettingsToggle);
            window.removeEventListener('settings-close', handleSettingsClose);
            window.removeEventListener('open-notification-settings', handleOpenNotificationSettings);
        };
    }, []);

    const openNotificationSettings = () => {
        setSettingsOpen(false);
        setNotificationSettingsOpen(true);
    };

    return (
        <NotificationProvider>
            <div className="flex h-screen flex-col overflow-hidden">
                {/* Backdrop pod navigací (nav má vyšší z-index) */}
                {settingsOpen && (
                    <div
                        onClick={() => setSettingsOpen(false)}
                        className="fixed inset-0 z-40 bg-black/5"
                    />
                )}

                <MainNavigation
                    settingsOpen={settingsOpen}
                    setSettingsOpen={setSettingsOpen}
                    onOpenNotificationSettings={openNotificationSettings}
                />

                <div className="flex flex-1 overflow-hidden">
                    {showSidebar && <Sidebar />}
                    <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                        <Outlet />
                    </main>
                </div>

                <FloatingHelp />
                <NotificationToasts />

                {typeof document !== 'undefined' &&
                    createPortal(
                        <NotificationSettingsModal
                            open={notificationSettingsOpen}
                            onClose={() => setNotificationSettingsOpen(false)}
                        />,
                        document.body,
                    )}
            </div>
        </NotificationProvider>
    );
}
