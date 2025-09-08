// ===== 2. SubscriptionRequired.tsx (Page Component) =====
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSubscription } from '../store/hooks/useSubscription';

const SubscriptionRequired: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { subscriptionStatus, hasActiveSubscription } = useSubscription({
        autoFetchStatus: true,
    });

    // Extract state from navigation
    const { from, reason, message } = location.state || {
        from: { pathname: '/dashboard' },
        reason: 'subscription_required',
        message: 'This feature requires a subscription.',
    };

    const handleGoToSubscriptions = () => {
        navigate('/subscriptions');
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    // Get appropriate messaging based on reason
    const getContent = () => {
        switch (reason) {
            case 'active_subscription_required':
                return {
                    title: 'Active Subscription Required',
                    description: 'To access this feature, you need an active subscription. Choose from our flexible plans below.',
                    icon: '🔒',
                    actionText: 'View Subscription Plans',
                };
            case 'package_creation_not_allowed':
                return {
                    title: 'Upgrade Your Plan',
                    description: "Your current subscription doesn't include package creation. Upgrade to unlock this powerful feature.",
                    icon: '📦',
                    actionText: 'Upgrade Subscription',
                };
            default:
                return {
                    title: 'Subscription Required',
                    description: 'This feature requires a subscription to continue. Get started with our affordable plans.',
                    icon: '⭐',
                    actionText: 'View Plans',
                };
        }
    };

    const content = getContent();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
                    {/* Icon */}
                    <div className="text-6xl mb-6">{content.icon}</div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{content.title}</h1>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{content.description}</p>

                    {/* Current Status */}
                    {subscriptionStatus && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Current Status:</span>
                                <span className={`font-semibold ${hasActiveSubscription ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{subscriptionStatus.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600 dark:text-gray-300">Package Creation:</span>
                                <span className={`font-semibold ${subscriptionStatus.canCreatePackages ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {subscriptionStatus.canCreatePackages ? 'Allowed' : 'Not Allowed'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={handleGoToSubscriptions}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                        >
                            {content.actionText}
                        </button>

                        <button
                            onClick={handleGoBack}
                            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Help Link */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Need help choosing a plan?{' '}
                            <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionRequired;
