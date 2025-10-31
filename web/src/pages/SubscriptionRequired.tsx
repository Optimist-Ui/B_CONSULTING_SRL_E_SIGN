import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSubscription } from '../store/hooks/useSubscription';
import { useTranslation } from 'react-i18next';

const SubscriptionRequired: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const { subscriptionStatus, hasActiveSubscription } = useSubscription({
        autoFetchStatus: true,
    });

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

    const getContent = () => {
        switch (reason) {
            case 'active_subscription_required':
                return {
                    title: t('subscriptionRequired.active.title'),
                    description: t('subscriptionRequired.active.description'),
                    icon: 'Lock',
                    actionText: t('subscriptionRequired.active.action'),
                };
            case 'package_creation_not_allowed':
                return {
                    title: t('subscriptionRequired.package.title'),
                    description: t('subscriptionRequired.package.description'),
                    icon: 'Package',
                    actionText: t('subscriptionRequired.package.action'),
                };
            default:
                return {
                    title: t('subscriptionRequired.default.title'),
                    description: t('subscriptionRequired.default.description'),
                    icon: 'Star',
                    actionText: t('subscriptionRequired.default.action'),
                };
        }
    };

    const content = getContent();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
                    <div className="text-6xl mb-6">{content.icon}</div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{content.title}</h1>

                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{content.description}</p>

                    {subscriptionStatus && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">{t('subscriptionRequired.status.current')}:</span>
                                <span className={`font-semibold ${hasActiveSubscription ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{subscriptionStatus.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600 dark:text-gray-300">{t('subscriptionRequired.status.packageCreation')}:</span>
                                <span className={`font-semibold ${subscriptionStatus.canCreatePackages ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {subscriptionStatus.canCreatePackages ? t('subscriptionRequired.status.allowed') : t('subscriptionRequired.status.notAllowed')}
                                </span>
                            </div>
                        </div>
                    )}

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
                            {t('subscriptionRequired.actions.goBack')}
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('subscriptionRequired.help.text')}{' '}
                            <Link to="/help" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                {t('subscriptionRequired.help.link')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionRequired;
