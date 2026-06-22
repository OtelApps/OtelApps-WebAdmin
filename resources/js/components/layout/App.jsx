import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '../../pages/dashboard/Dashboard';
import { Content } from '../../pages/content/Content';
import { Activity } from '../../pages/activity/Activity';
import { Concierge } from '../../pages/concierge/Concierge';
import { InsightsHub } from '../../pages/insights/InsightsHub';
import { CrmHub } from '../../pages/crm/CrmHub';
import { Page } from '../../pages/shared/Page';
import { DynamicModulePage } from '../../pages/shared/DynamicModulePage';
import { NotFound } from '../../pages/shared/NotFound';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ProtectedRoute, ProtectedModuleRoute } from '../ui/ProtectedRoute';
import { DynamicEditRouter } from '../../pages/shared/DynamicEditRouter';
import { FeedbackHub } from '../../pages/feedback/FeedbackHub';

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
                                <Activity />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="crm" 
                        element={
                            <ProtectedRoute moduleName="crm">
                                <CrmHub />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="feedback" 
                        element={
                            <ProtectedRoute moduleName="feedback">
                                <FeedbackHub />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="concierge" 
                        element={
                            <ProtectedRoute moduleName="concierge">
                                <Concierge />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="insights" 
                        element={
                            <ProtectedRoute moduleName="insights">
                                <InsightsHub />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="module/:type/:module" 
                        element={
                            <ProtectedModuleRoute>
                                <DynamicModulePage />
                            </ProtectedModuleRoute>
                        } 
                    />
                    <Route
                        path="module/:type/:module/:area/:id/edit"
                        element={
                            <ProtectedModuleRoute>
                                <DynamicEditRouter />
                            </ProtectedModuleRoute>
                        }
                    />
                    <Route
                        path="module/:type/:module/:area"
                        element={
                            <ProtectedModuleRoute>
                                <DynamicModulePage />
                            </ProtectedModuleRoute>
                        }
                    />
                    <Route 
                        path="module/:type/:module/:id/edit" 
                        element={
                            <ProtectedModuleRoute>
                                <DynamicEditRouter />
                            </ProtectedModuleRoute>
                        } 
                    />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </ErrorBoundary>
    );
}

