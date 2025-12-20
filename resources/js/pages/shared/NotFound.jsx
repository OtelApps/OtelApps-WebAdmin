import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Module Not Found</h2>
                <p className="text-gray-600 mb-8">
                    This module is disabled or does not exist.
                </p>
                <Link
                    to="/dashboard"
                    className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}

