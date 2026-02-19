
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Investigation from './pages/Investigation';
import AdminConfig from './pages/AdminConfig';
import Login from './pages/Login';
import AlertDetail from './pages/AlertDetail';

// Mock Auth wrapper - in a real app this would use context
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // For demo purposes, we'll allow access. 
    // In production, check auth state here.
    const isAuthenticated = true;
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <MainLayout>{children}</MainLayout>;
};

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/investigation"
                element={
                    <ProtectedRoute>
                        <Investigation />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <AdminConfig />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/alert/:id"
                element={
                    <ProtectedRoute>
                        <AlertDetail />
                    </ProtectedRoute>
                }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
