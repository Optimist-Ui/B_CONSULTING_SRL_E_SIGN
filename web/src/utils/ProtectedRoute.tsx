import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import React from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // Get auth state from the Redux store
    const { isAuthenticated } = useSelector((state: IRootState) => state.auth);
    const location = useLocation();

    // If not authenticated, redirect to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the child component
    return <>{children}</>;
};

export default ProtectedRoute;
