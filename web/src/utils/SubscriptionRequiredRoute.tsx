import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../store/hooks/useSubscription';
import React from 'react';

// You might want to create a shared loader component
const CenteredLoader: React.FC<{ message?: string }> = ({ message = 'Please wait...' }) => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-center">
            <span className="animate-spin border-4 border-transparent border-l-primary rounded-full w-12 h-12 inline-block mb-4"></span>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
    </div>
);

interface SubscriptionRequiredRouteProps {
    children: React.ReactNode;
    requiresActiveSubscription?: boolean;
    requiresPackageCreation?: boolean;
    redirectTo?: string;
}

const SubscriptionRequiredRoute: React.FC<SubscriptionRequiredRouteProps> = ({
    children,
    requiresActiveSubscription = false,
    requiresPackageCreation = false,
    redirectTo = '/subscription-required',
}) => {
    const location = useLocation();

    const { subscriptionStatus, isFetchingStatus, canCreatePackages } = useSubscription({
        autoFetchStatus: true,
        fetchOnMount: true,
    });

    if (isFetchingStatus || !subscriptionStatus) {
        return <CenteredLoader message="Verifying account permissions..." />;
    }

    // --- REFINED LOGIC ---

    // Requirement 1 & 3: Does this route require an active subscription?
    if (requiresActiveSubscription && !subscriptionStatus.hasActiveSubscription) {
        return <Navigate to={redirectTo} state={{ from: location, reason: 'active_subscription_required' }} replace />;
    }

    // Requirement 2: Does this route specifically require the ability to create new packages?
    if (requiresPackageCreation && !canCreatePackages) {
        return <Navigate to={redirectTo} state={{ from: location, reason: 'package_creation_not_allowed' }} replace />;
    }

    // If all checks pass, access is granted.
    return <>{children}</>;
};

export default SubscriptionRequiredRoute;
