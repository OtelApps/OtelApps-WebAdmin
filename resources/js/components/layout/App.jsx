import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '../../pages/dashboard/Dashboard';
import { Content } from '../../pages/content/Content';
import { Concierge } from '../../pages/concierge/Concierge';
import { InsightsHub } from '../../pages/insights/InsightsHub';
import { CrmHub } from '../../pages/crm/CrmHub';
import { Page } from '../../pages/shared/Page';
import { DynamicModulePage } from '../../pages/shared/DynamicModulePage';
import { NotFound } from '../../pages/shared/NotFound';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ProtectedRoute, ProtectedModuleRoute, RequireAuth } from '../ui/ProtectedRoute';
import { DynamicEditRouter } from '../../pages/shared/DynamicEditRouter';
import { FeedbackHub } from '../../pages/feedback/FeedbackHub';
import { Recepce } from '../../pages/recepce/Recepce';
import { Login } from '../../pages/auth/Login';
import { Ukoly } from '../../pages/ukoly/Ukoly';
import { FinanceDashboard } from '../../pages/finance/FinanceDashboard';
import { ClosingWizard } from '../../pages/finance/closings/ClosingWizard';
import { UserAdmin } from '../../pages/admin/UserAdmin';
import { ProfileSettings } from '../../pages/auth/ProfileSettings';
import { useAuth } from '../../context/AuthContext';

function HomeRedirect() {
    const { canAccessModule } = useAuth();
    if (canAccessModule('ukoly')) return <Navigate to="/ukoly" replace />;
    if (canAccessModule('dashboard')) return <Navigate to="/dashboard" replace />;
    if (canAccessModule('recepce')) return <Navigate to="/recepce" replace />;
    return <Navigate to="/login" replace />;
}

/**
 * Hlavní React komponenta aplikace s React Router
 */
export function App() {
    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <RequireAuth>
                            <Layout />
                        </RequireAuth>
                    }
                >
                    <Route index element={<HomeRedirect />} />
                    <Route
                        path="ukoly"
                        element={
                            <ProtectedRoute moduleName="ukoly">
                                <Ukoly />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="finance"
                        element={
                            <ProtectedRoute moduleName="finance">
                                <FinanceDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="finance/closings/:id"
                        element={
                            <ProtectedRoute moduleName="finance">
                                <ClosingWizard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="recepce"
                        element={
                            <ProtectedRoute moduleName="recepce">
                                <Recepce />
                            </ProtectedRoute>
                        }
                    />
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
                    <Route path="activity" element={<Navigate to="/ukoly" replace />} />
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
                        path="nastaveni/profil"
                        element={
                            <RequireAuth>
                                <ProfileSettings />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="nastaveni/uzivatele"
                        element={
                            <RequireAuth>
                                <UserAdmin />
                            </RequireAuth>
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
