import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './components/layout/App';
import { ModulesProvider } from './context/ModulesContext';
import { queryClient } from './lib/queryClient';
import Alpine from 'alpinejs';
import React from 'react';

window.Alpine = Alpine;
Alpine.start();

function initReact() {
    const rootElement = document.getElementById('react-root');
    if (!rootElement) {
        console.error('React root element not found!');
        return;
    }

    try {
        const root = createRoot(rootElement);
        root.render(
            React.createElement(
                QueryClientProvider,
                { client: queryClient },
                React.createElement(
                    ModulesProvider,
                    null,
                    React.createElement(BrowserRouter, null, React.createElement(App)),
                ),
            ),
        );
    } catch (error) {
        console.error('Error initializing React app:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReact);
} else {
    initReact();
}
