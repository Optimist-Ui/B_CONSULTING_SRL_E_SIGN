import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '../../store/slices/subscriptionSlice';

// Import your icon components
import { IconRocket, IconStar } from '../Icon/IconRocket';
import IconLockDots from '../common/IconLockDots';
import IconArchive from '../Icon/IconArchive';

interface SubscriptionBannerProps {
    subscriptionStatus: SubscriptionStatus;
}

const SubscriptionNotificationBanner: React.FC<SubscriptionBannerProps> = ({ subscriptionStatus }) => {
    const navigate = useNavigate();

    const { hasActiveSubscription, canCreatePackages, reason, status, documentsUsed, documentLimit } = subscriptionStatus;

    const handleUpgrade = () => {
        navigate('/subscriptions?mode=upgrade');
    };

    const getBannerConfig = () => {
        if (!hasActiveSubscription) {
            return {
                title: 'Unlock All Features',
                message: 'Activate a subscription to start creating and managing documents.',
                bgGradient: 'from-purple-600 to-blue-600', // On-brand colors
                icon: IconRocket,
                ctaText: 'View Plans',
            };
        }
        if (!canCreatePackages) {
            return {
                title: 'Document Limit Reached',
                message: reason || 'Please upgrade your plan to continue creating new documents.',
                bgGradient: 'from-blue-600 to-teal-600', // On-brand colors
                icon: IconStar,
                ctaText: 'Upgrade Plan',
            };
        }
        if (status === 'ACTIVE' && documentsUsed !== undefined && documentLimit !== undefined) {
            const remaining = documentLimit - documentsUsed;
            if (remaining <= 5 && remaining > 0) {
                return {
                    title: 'Running Low on Documents',
                    message: `You have only ${remaining} documents left. Upgrade to get more.`,
                    bgGradient: 'from-yellow-600 to-orange-600',
                    icon: IconArchive, // Use a warning icon
                    ctaText: 'Upgrade Plan',
                };
            }
        }
        return null;
    };

    const config = getBannerConfig();

    // If the user has full access, the component renders nothing.
    if (!config) {
        return null;
    }

    const BannerIcon = config.icon;

    return (
        // Renders as a standard block, positioned by the parent (sidebar).
        <div className="p-4">
            <div className={`bg-gradient-to-r ${config.bgGradient} rounded-xl shadow-lg p-4 text-white text-center animate-fade-in`}>
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-white/20 mx-auto mb-3">
                    <BannerIcon className="w-6 h-6 text-white" />
                </div>

                <h4 className="font-bold text-base mb-1">{config.title}</h4>
                <p className="text-xs text-white/80 mb-4">{config.message}</p>

                <button
                    onClick={handleUpgrade}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-md group flex items-center justify-center"
                >
                    <IconLockDots className="w-4 h-4 mr-2" />
                    <span>{config.ctaText}</span>
                </button>
            </div>
        </div>
    );
};

export default SubscriptionNotificationBanner;
