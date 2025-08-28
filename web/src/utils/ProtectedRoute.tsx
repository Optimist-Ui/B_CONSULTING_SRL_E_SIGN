import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import React from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // Get auth state from the Redux store
    const { isAuthenticated, loading } = useSelector((state: IRootState) => state.auth);
    const location = useLocation();

    // While checking the auth status, we can show a loader
    // This handles the initial page load where we're not sure if the user is logged in
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="animate-spin border-4 border-transparent border-l-primary rounded-full w-12 h-12"></span>
            </div>
        );
    }

    // If not authenticated, redirect to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the child component
    return <>{children}</>;
};

export default ProtectedRoute;
