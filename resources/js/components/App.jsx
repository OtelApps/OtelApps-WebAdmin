import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '../pages/main/Dashboard';
import { Content } from '../pages/content/Content';
import { Page } from '../pages/shared/Page';
import { ModulePage } from '../pages/modules/ModulePage';
import { NotFound } from '../pages/shared/NotFound';
import { ErrorBoundary } from './ErrorBoundary';
import { ProtectedRoute, ProtectedModuleRoute } from './ProtectedRoute';
import { RestaurantEdit } from '../pages/modules/facilities/RestaurantEdit';

/**
 * Hlavní React komponenta aplikace s React Router
 */
export function App() {
    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route 
                        path="dashboard" 
                        element={
                            <ProtectedRoute moduleName="dashboard">
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="content" 
                        element={
                            <ProtectedRoute moduleName="content">
                                <Content />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="my_app" 
                        element={
                            <ProtectedRoute moduleName="my_app">
                                <Page title="My App" />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="activity" 
                        element={
                            <ProtectedRoute moduleName="activity">
                                <Page title="Activity" />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="crm" 
                        element={
                            <ProtectedRoute moduleName="crm">
                                <Page title="CRM" />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="feedback" 
                        element={
                            <ProtectedRoute moduleName="feedback">
                                <Page title="Feedback" />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="concierge" 
                        element={
                            <ProtectedRoute moduleName="concierge">
                                <Page title="Concierge" />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="insights" 
                        element={
                            <ProtectedRoute moduleName="insights">
                                <Page title="Insights" />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="module/:type/:module" 
                        element={
                            <ProtectedModuleRoute>
                                <ModulePage />
                            </ProtectedModuleRoute>
                        } 
                    />
                    <Route 
                        path="module/:type/:module/:id/edit" 
                        element={
                            <ProtectedModuleRoute>
                                <RestaurantEdit />
                            </ProtectedModuleRoute>
                        } 
                    />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </ErrorBoundary>
    );
}

