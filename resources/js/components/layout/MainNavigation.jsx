import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationBell, NavBadge } from '../notifications/NotificationBell';

export function MainNavigation({ settingsOpen, setSettingsOpen }) {
    const location = useLocation();
    const [modules, setModules] = useState([]);
    const [labels, setLabels] = useState({});
    const [moduleMap, setModuleMap] = useState({});
    const [languageOpen, setLanguageOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState("English");
    const [editLanguagesOpen, setEditLanguagesOpen] = useState(false);
    const languageButtonRef = useRef(null);
    const { badges, setSettingsOpen: setNotificationSettingsOpen } = useNotifications();

    useEffect(() => {
        axios
            .get("/api/modules/main-navigation")
            .then((response) => {
                console.log("Main navigation API response:", response.data);
                const modulesData = response.data?.modules || [];
                const labelsData = response.data?.labels || {};
                const mapData = response.data?.map || {};
                const modulesArray = Array.isArray(modulesData)
                    ? modulesData
                    : [];
                console.log("Setting modules:", modulesArray);
                setModules(modulesArray);
                setLabels(labelsData);
                setModuleMap(mapData);
            })
            .catch((error) => {
                console.error("Error loading modules:", error);
                console.error(
                    "Error details:",
                    error.response?.data || error.message,
                );
                setModules([]);
                setLabels({});
                setModuleMap({});
            });
    }, []);

    useEffect(() => {
        const handleDocumentClick = (event) => {
            if (!languageOpen) return;
            if (!languageButtonRef.current) return;
            if (!languageButtonRef.current.contains(event.target)) {
                setLanguageOpen(false);
            }
        };

        document.addEventListener("click", handleDocumentClick);
        return () => document.removeEventListener("click", handleDocumentClick);
    }, [languageOpen]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setLanguageOpen(false);
                setEditLanguagesOpen(false);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    const moduleIcons = {
        dashboard: "home",
        content: "article",
        my_app: "mobile_2",
        activity: "moving",
        crm: "group",
        feedback: "thumb_up",
        concierge: "chat",
        insights: "bar_chart",
    };

    const handleSettingsClick = () => {
        const newState = !settingsOpen;
        setSettingsOpen(newState);
        window.dispatchEvent(
            new CustomEvent("settings-toggle", { detail: newState }),
        );
    };

    const handleLanguageSelect = (lang) => {
        setCurrentLanguage(lang);
        setLanguageOpen(false);
    };

    const isActive = (module) => {
        if (module === "dashboard") {
            return (
                location.pathname === "/" || location.pathname === "/dashboard"
            );
        }
        
        const pathParts = location.pathname.split('/').filter(Boolean);
        const currentSection = pathParts[0] === 'module' ? pathParts[1] : pathParts[0];
        
        // Use the map to resolve the parent module (e.g. 'requests' -> 'activity')
        const resolvedSection = moduleMap[currentSection] || currentSection;
        
        return resolvedSection === module;
    };

    return (
        <nav className="bg-gray-800 text-white shadow-lg relative z-50">
            <div className="max-w-screen-2xl mx-auto px-0.5 sm:px-1 lg:px-1.5">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-1 flex items-center justify-start">
                        <Link to="/dashboard" className="flex items-center">
                            <div className="shrink-0 h-10 w-10 flex items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt="Otel Apps Hotel"
                                    className="max-h-10 max-w-10 object-contain"
                                />
                            </div>
                            <div className="ml-3">
                                <span className="text-xl font-semibold">
                                    Otel Apps Hotel
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-1">
                        {Array.isArray(modules) && modules.length > 0 ? (
                            modules.map((module) => (
                                <Link
                                    key={module}
                                    to={`/${module}`}
                                    className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive(module)
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                    }`}
                                >
                                    <div className="flex flex-col items-center space-y-1">
                                        <span className="relative material-symbols-outlined text-[20px]">
                                            {moduleIcons[module] || "extension"}
                                            {module === "activity" && (
                                                <NavBadge count={badges.activity} />
                                            )}
                                            {module === "concierge" && (
                                                <NavBadge count={badges.concierge} />
                                            )}
                                        </span>
                                        <span>{labels[module] || module}</span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-400">
                                Loading...
                            </div>
                        )}
                    </div>

                    {/* Notifications, Settings & Language */}
                    <div className="flex-1 flex items-center justify-end space-x-4 relative">
                        <NotificationBell />

                        {/* Settings Button */}
                        <div className="relative">
                            <button
                                onClick={handleSettingsClick}
                                className="text-gray-300 hover:text-white relative z-9999"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </button>

                            {/* Settings Dropdown Menu */}
                            {settingsOpen && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-gray-200 py-2 z-9999"
                                    style={{
                                        minWidth: "14rem",
                                        boxShadow:
                                            "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSettingsOpen(false);
                                            setNotificationSettingsOpen(true);
                                        }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                            />
                                        </svg>
                                        Nastavení notifikací
                                    </button>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                        Segmentation
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                            />
                                        </svg>
                                        Employees
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                            />
                                        </svg>
                                        Subscription
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                        Corporate
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Terms and conditions
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                        Review Mode
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                        Uptime Stats
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                        Product updates
                                    </a>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 font-medium"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-3 text-gray-900"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                        Logout
                                    </a>
                                </div>
                            )}
                        </div>

                        <div ref={languageButtonRef} className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setLanguageOpen((prev) => !prev)
                                }
                                className="flex items-center gap-2 text-gray-300 hover:text-white relative z-9999"
                            >
                                <span className="select-none">
                                    {currentLanguage === "English"
                                        ? "ENG"
                                        : "CZE"}
                                </span>
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 8l4 4 4-4" />
                                </svg>
                            </button>

                            {languageOpen && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-gray-200 py-2 z-9999"
                                    style={{
                                        boxShadow:
                                            "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleLanguageSelect("English")
                                        }
                                        className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center justify-between"
                                    >
                                        <span>English</span>
                                        <span className="text-xs text-gray-500">
                                            Default
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleLanguageSelect("Czech")
                                        }
                                        className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center justify-between"
                                    >
                                        <span>Czech</span>
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLanguageOpen(false);
                                            setEditLanguagesOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Edit languages
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {editLanguagesOpen && (
                <>
                    <div
                        onClick={() => setEditLanguagesOpen(false)}
                        className="fixed inset-0 z-10000 transition-opacity duration-200"
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.25)",
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Edit languages"
                        className="fixed inset-0 z-10001 flex items-start justify-center px-4 pt-20"
                        onClick={() => setEditLanguagesOpen(false)}
                    >
                        <div
                            className="w-full max-w-2xl bg-white rounded-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                boxShadow:
                                    "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                            }}
                        >
                            <div className="bg-gray-700 text-white text-center py-4">
                                <div className="text-2xl font-semibold tracking-wide">
                                    EDIT LANGUAGES
                                </div>
                            </div>

                            <div className="px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div className="grid grid-cols-2 gap-10 items-end">
                                        <div className="text-xl font-semibold text-gray-700">
                                            Language Name
                                        </div>
                                        <div className="text-xl font-semibold text-gray-700">
                                            ISO Code
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full px-5 py-2.5 text-sm"
                                        onClick={() => {}}
                                    >
                                        <span className="text-xl leading-none">
                                            +
                                        </span>
                                        <span>ADD LANGUAGE</span>
                                    </button>
                                </div>

                                <div className="mt-4 border-t border-gray-200" />

                                <div className="divide-y divide-gray-200">
                                    <div className="py-5 flex items-center">
                                        <div className="flex-1 grid grid-cols-2 gap-10">
                                            <div className="flex items-center gap-6">
                                                <div className="text-2xl text-gray-700">
                                                    Czech
                                                </div>
                                                <div className="text-sm font-semibold text-orange-500">
                                                    Default
                                                </div>
                                            </div>
                                            <div className="text-xl text-gray-700">
                                                cz
                                            </div>
                                        </div>
                                    </div>

                                    <div className="py-5 flex items-center">
                                        <div className="flex-1 grid grid-cols-2 gap-10">
                                            <div className="text-2xl text-gray-700">
                                                English
                                            </div>
                                            <div className="text-xl text-gray-700 flex items-center justify-between">
                                                <span>en</span>
                                                <button
                                                    type="button"
                                                    className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                                                    onClick={() => {}}
                                                    aria-label="Delete language"
                                                >
                                                    <span class="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-end gap-6">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditLanguagesOpen(false)
                                        }
                                        className="rounded-full px-9 py-3 border-2 border-orange-400 text-orange-500 font-semibold text-lg hover:bg-orange-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditLanguagesOpen(false)
                                        }
                                        className="rounded-full px-9 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
