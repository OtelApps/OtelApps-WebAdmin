import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './components/layout/App';
import Alpine from 'alpinejs';
import React from 'react';

// Initialize Alpine.js for simple interactions
window.Alpine = Alpine;
Alpine.start();

// Initialize React Router
function initReact() {
    const rootElement = document.getElementById('react-root');
    if (!rootElement) {
        console.error('React root element not found!');
        return;
    }

    try {
        const root = createRoot(rootElement);
        root.render(
            React.createElement(BrowserRouter, null, React.createElement(App))
        );
        console.log('React app initialized successfully');
    } catch (error) {
        console.error('Error initializing React app:', error);
    }
}

// Try to initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReact);
} else {
    // DOM is already ready
    initReact();
}
