// src/utils/PublicRoute.tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import React from 'react';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    // Get auth state from the Redux store
    const { isAuthenticated } = useSelector((state: IRootState) => state.auth);

    // If the user is authenticated, redirect them to the home page
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // If not authenticated, render the public page (e.g., Login, Register)
    return <>{children}</>;
};

export default PublicRoute;