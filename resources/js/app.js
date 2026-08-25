import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ModulesProvider } from './context/ModulesContext';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './lib/queryClient';
import Alpine from 'alpinejs';
import React from 'react';

window.Alpine = Alpine;
Alpine.start();

function showBootError(rootElement, error) {
    console.error('Error initializing React app:', error);
    rootElement.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;padding:2rem;">
            <div style="max-width:36rem;">
                <h1 style="font-size:1.25rem;margin-bottom:0.75rem;">Aplikace se nenačetla</h1>
                <p style="color:#64748b;margin-bottom:1rem;">Zkus obnovit stránku (Cmd+Shift+R). Když to nesedne, v konzoli prohlížeče bude přesná chyba.</p>
                <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:12px;">${String(error?.message || error)}</pre>
            </div>
        </div>
    `;
}

async function initReact() {
    const rootElement = document.getElementById('react-root');
    if (!rootElement) {
        console.error('React root element not found!');
        return;
    }

    try {
        const { App } = await import('./components/layout/App');
        const root = createRoot(rootElement);
        root.render(
            React.createElement(
                QueryClientProvider,
                { client: queryClient },
                React.createElement(
                    ModulesProvider,
                    null,
                    React.createElement(
                        AuthProvider,
                        null,
                        React.createElement(BrowserRouter, null, React.createElement(App)),
                    ),
                ),
            ),
        );
    } catch (error) {
        showBootError(rootElement, error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReact);
} else {
    initReact();
}
