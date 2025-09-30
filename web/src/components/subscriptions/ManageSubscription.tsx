import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { IRootState, AppDispatch } from '../../store';
import InvoiceHistory from './InvoiceHistory';

// Redux Thunks
import { cancelSubscription, reactivateSubscription, endTrialEarly } from '../../store/thunk/subscriptionThunks';

// Icons
import IconUsers from '../Icon/IconUsers';
import IconFile from '../Icon/IconFile';
import IconCalendar from '../Icon/IconCalendar';
import IconRefresh from '../Icon/IconRefresh';
import IconXCircle from '../Icon/IconXCircle';
import IconCreditCard from '../Icon/IconCreditCard';
import IconStar from '../Icon/IconStar';
import IconTrendingUp from '../Icon/IconTrendingUp';

// Helper to format dates nicely
const formatDate = (isoString: string | null | undefined): string => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// A small, reusable component for status badges
const StatusBadge: React.FC<{ status: string; cancelAtPeriodEnd: boolean }> = ({ status, cancelAtPeriodEnd }) => {
    let badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    let text = status.charAt(0).toUpperCase() + status.slice(1);
    let icon = null;

    if (cancelAtPeriodEnd) {
        badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        text = 'Cancels soon';
        icon = <IconXCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
    } else {
        switch (status) {
            case 'active':
                badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                icon = <IconStar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
                break;
            case 'trialing':
                badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                text = 'Trial Active';
                icon = <IconTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
                break;
            case 'past_due':
                badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                text = 'Past Due';
                icon = <IconXCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
                break;
            case 'canceled':
                badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
                text = 'Canceled';
                icon = <IconXCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />;
                break;
        }
    }

    return (
        <span className={`inline-flex items-center px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${badgeClass}`}>
            {icon}
            {text}
        </span>
    );
};

interface ManageSubscriptionProps {
    onChangePlan: () => void;
}

// The Main Management Component
const ManageSubscription: React.FC<ManageSubscriptionProps> = ({ onChangePlan }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { subscription, isCancelling, isReactivating, isEndingTrial } = useSelector((state: IRootState) => state.subscription);

    if (!subscription) {
        return (
            <div className="text-center py-16 sm:py-32 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mb-4 sm:mb-6">
                    <IconUsers className="h-full w-full" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Active Subscription</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Please contact support if you believe this is an error.</p>
            </div>
        );
    }

    const [showInvoicesModal, setShowInvoicesModal] = useState<boolean>(false);

    const showMessage = (msg: string, type: 'success' | 'error' = 'success'): void => {
        const toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3500,
            customClass: { container: 'toast' },
        });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    const handleCancel = () => {
        const isTrial = subscription.status === 'trialing';
        const title = isTrial ? 'Cancel Free Trial?' : 'Cancel Subscription?';
        const text = isTrial
            ? `Your trial will remain active until ${formatDate(subscription.trialEndDate)}, but it will not convert to a paid plan. Are you sure?`
            : `Your subscription will remain active until the end of the current period on ${formatDate(subscription.renewsAt)}. Are you sure?`;
        const confirmButtonText = isTrial ? 'Yes, cancel trial' : 'Yes, cancel subscription';

        Swal.fire({
            icon: 'warning',
            title,
            text,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText: 'Keep My Plan',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(cancelSubscription()).unwrap();
                    showMessage('Your plan is now set to cancel.');
                } catch (error: any) {
                    showMessage(error.toString(), 'error');
                }
            }
        });
    };

    const handleReactivate = async () => {
        try {
            await dispatch(reactivateSubscription()).unwrap();
            showMessage('Your subscription has been reactivated successfully!');
        } catch (error: any) {
            showMessage(error.toString(), 'error');
        }
    };

    const handleEndTrial = () => {
        Swal.fire({
            icon: 'question',
            title: 'Activate Paid Plan Now?',
            text: `You will be charged €${subscription.planPrice} immediately and gain full access to the ${subscription.planName} plan benefits, including your new document limit.`,
            showCancelButton: true,
            confirmButtonText: 'Yes, Activate Now',
            cancelButtonText: 'Stay on Trial',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(endTrialEarly()).unwrap();
                    showMessage('Your subscription is now active!', 'success');
                } catch (error: any) {
                    showMessage(error, 'error');
                }
            }
        });
    };

    const usagePercentage = subscription.documentLimit > 0 ? (subscription.documentsUsed / subscription.documentLimit) * 100 : 0;

    const getPlanColor = (planName: string): string => {
        const colors: Record<string, string> = {
            starter: 'from-blue-500 to-blue-600',
            pro: 'from-purple-500 to-purple-600',
            enterprise: 'from-orange-500 to-orange-600',
        };
        return colors[planName.toLowerCase()] || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            {/* Header with Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Subscription Management</h1>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">Monitor your plan usage and manage billing preferences</p>
                </div>

                {/* Primary Action Buttons - Moved to Top */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {subscription.isTrialing ? (
                        <>
                            {subscription.cancelAtPeriodEnd ? (
                                <button
                                    onClick={handleReactivate}
                                    disabled={isReactivating}
                                    className="btn btn-primary px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500 flex items-center"
                                >
                                    {isReactivating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                            Reactivating...
                                        </>
                                    ) : (
                                        <>
                                            <IconRefresh className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                            Reactivate Trial
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleEndTrial}
                                        disabled={isEndingTrial}
                                        className="btn btn-primary px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500 flex items-center"
                                    >
                                        {isEndingTrial ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                                Activating...
                                            </>
                                        ) : (
                                            <>
                                                <IconCreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                Activate Now
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="btn btn-outline-danger px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/50 focus:ring-2 focus:ring-red-500 flex items-center"
                                    >
                                        {isCancelling ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600 mr-2"></div>
                                                Cancelling...
                                            </>
                                        ) : (
                                            <>
                                                <IconXCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                Cancel Trial
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {subscription.cancelAtPeriodEnd? (
                                <button
                                    onClick={handleReactivate}
                                    disabled={isReactivating}
                                    className="btn btn-primary px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500 flex items-center"
                                >
                                    {isReactivating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                            Reactivating...
                                        </>
                                    ) : (
                                        <>
                                            <IconRefresh className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                            Reactivate Plan
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="btn btn-outline-danger px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/50 focus:ring-2 focus:ring-red-500 flex items-center"
                                >
                                    {isCancelling ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600 mr-2"></div>
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <IconXCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                            Cancel
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Plan Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getPlanColor(subscription.planName)}`}></div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex items-center">
                        <div className={`p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r ${getPlanColor(subscription.planName)} text-white mr-3 sm:mr-4 lg:mr-6`}>
                            <IconUsers className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{subscription.planName} Plan</h2>
                            <StatusBadge status={subscription.status} cancelAtPeriodEnd={subscription.cancelAtPeriodEnd} />
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{subscription.planInterval}ly</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">€{subscription.planPrice || 'N/A'}</p>
                    </div>
                </div>

                {subscription.isTrialing && (
                    <div className="bg-blue-50 dark:bg-blue-900/50 p-3 sm:p-4 rounded-lg text-center mb-4 sm:mb-6">
                        <p className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">Your trial ends on {formatDate(subscription.trialEndDate)}.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {/* Usage Section */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6">
                        <div className="flex items-center mb-3 sm:mb-4">
                            <IconFile className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-500 mr-2 sm:mr-3" />
                            <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">Document Usage</h3>
                        </div>

                        {subscription.documentLimit === -1 ? (
                            <div className="text-center py-4 sm:py-6">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Unlimited</p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No document limits on your enterprise plan</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{subscription.documentsUsed}</span>
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">of {subscription.documentLimit} documents</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                                    <div className={`h-2 sm:h-3 rounded-full bg-gradient-to-r ${getPlanColor(subscription.planName)}`} style={{ width: `${Math.min(usagePercentage, 100)}%` }}></div>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Usage resets on {formatDate(subscription.renewsAt)}</p>
                            </div>
                        )}
                    </div>

                    {/* Billing Section */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6">
                        <div className="flex items-center mb-3 sm:mb-4">
                            <IconCalendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 mr-2 sm:mr-3" />
                            <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">Billing Status</h3>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            {subscription.cancelAtPeriodEnd ? (
                                <>
                                    <div className="flex items-center text-yellow-600 dark:text-yellow-400 mb-2">
                                        <IconXCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        <span className="text-xs sm:text-sm font-semibold">Cancellation Pending</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        Your plan will be cancelled on <span className="font-semibold text-gray-800 dark:text-white">{formatDate(subscription.renewsAt)}</span>
                                    </p>
                                </>
                            ) : subscription.status === 'past_due' ? (
                                <>
                                    <div className="flex items-center text-red-600 dark:text-red-400 mb-2">
                                        <IconXCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        <span className="text-xs sm:text-sm font-semibold">Payment Past Due</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Please update your payment method to continue service</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Next renewal</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatDate(subscription.renewsAt)}</p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Auto-renewal is active</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Plan Started</p>
                            <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mt-1">{formatDate(subscription.startDate)}</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <IconCalendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Billing Cycle</p>
                            <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mt-1 capitalize">{subscription.planInterval}ly</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <IconRefresh className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Documents Left</p>
                            <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                {subscription.documentLimit === -1 ? 'Unlimited' : subscription.documentLimit - subscription.documentsUsed}
                            </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <IconFile className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 shadow-lg">
                <div className="flex items-center mb-4 sm:mb-6">
                    <IconCreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600 dark:text-gray-400 mr-2 sm:mr-3" />
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Plan Management</h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-2">Manage your subscription, view invoices, or change your plan.</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">Changes will take effect according to your billing cycle</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 flex items-center"
                            onClick={() => setShowInvoicesModal(true)}
                        >
                            <IconFile className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Invoices
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 focus:ring-2 focus:ring-blue-300 flex items-center"
                            onClick={onChangePlan}
                        >
                            <IconTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Top-Up
                        </button>
                    </div>
                </div>
            </div>

            <InvoiceHistory isOpen={showInvoicesModal} onClose={() => setShowInvoicesModal(false)} />
        </div>
    );
};

export default ManageSubscription;
