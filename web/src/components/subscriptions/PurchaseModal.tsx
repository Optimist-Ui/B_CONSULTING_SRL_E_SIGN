// src/components/subscriptions/PurchaseModal.tsx - WITH INLINE PAYMENT METHOD ADDITION
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Redux and Store imports
import { IRootState, AppDispatch } from '../../store';
import { Plan } from '../../store/slices/planSlice';
import { PaymentMethod } from '../../store/slices/paymentMethodSlice';
import { createSubscription, createTrialSubscription, fetchSubscription } from '../../store/thunk/subscriptionThunks';
import { fetchPaymentMethods, createPaymentOrder } from '../../store/thunk/paymentMethodThunks';
import { invalidateStatusCache } from '../../store/slices/subscriptionSlice';

// Re-usable components
import { Modal } from '../../pages/PaymentMethods';
import IconStar from '../Icon/IconStar';
import IconPlus from '../Icon/IconPlus';
import IconArchive from '../Icon/IconArchive';
import IconCreditCard from '../Icon/IconCreditCard';
import IconLock from '../Icon/IconLock';

// Simple spinner for the modal's loading state
const ModalSpinner = () => (
    <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
);

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: Plan;
    isYearly: boolean;
}

// Card component for SELECTION inside the modal
const SelectablePaymentMethodCard: React.FC<{
    pm: PaymentMethod;
    isSelected: boolean;
    onClick: () => void;
}> = ({ pm, isSelected, onClick }) => {
    const { t } = useTranslation();

    return (
        <div
            onClick={onClick}
            className={`flex items-center p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400'
            }`}
        >
            <div className="flex items-center justify-center w-12 h-8 rounded-md mr-4 bg-gray-700 text-white font-bold text-xs">{pm.cardType}</div>
            <div className="flex-grow">
                <p className="font-semibold text-gray-800 dark:text-gray-200">•••• •••• •••• {pm.last4}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('purchaseModal.expires', {
                        month: pm.exp_month?.toString().padStart(2, '0'),
                        year: pm.exp_year,
                    })}
                </p>
            </div>
            {pm.isDefault && (
                <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    <IconStar className="w-4 h-4 mr-1 text-yellow-500" />
                    {t('purchaseModal.default')}
                </div>
            )}
        </div>
    );
};

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, plan, isYearly }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();

    const { paymentMethods, loading: pmLoading, isCreatingOrder } = useSelector((state: IRootState) => state.paymentMethods);
    const { subscription } = useSelector((state: IRootState) => state.subscription);
    const { user } = useSelector((state: IRootState) => state.auth);
    const hasHadTrial = user?.hasHadTrial ?? false;

    const isTopUp = !!subscription && plan.name === subscription.planName && (isYearly ? subscription.planInterval === 'year' : subscription.planInterval === 'month');

    // Loading states
    const [isLoading, setIsLoading] = useState<'trial' | 'purchase' | false>(false);
    const [selectedPM, setSelectedPM] = useState<string>('');
    const [error, setError] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);

    // Payment method addition states
    const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');

    // ✅ Load payment methods on modal open
    useEffect(() => {
        if (isOpen) {
            setInitialLoad(true);
            setSelectedPM('');
            setError('');
            setShowAddPaymentForm(false);
            dispatch(fetchPaymentMethods()).finally(() => setInitialLoad(false));
        }
    }, [isOpen, dispatch]);

    // ✅ Set user details for payment form
    useEffect(() => {
        if (user) {
            setUserName(`${user.firstName} ${user.lastName}`);
            setUserEmail(user.email);
        }
    }, [user]);

    // ✅ Auto-select default payment method
    useEffect(() => {
        if (!isOpen || initialLoad || pmLoading) return;

        if (paymentMethods.length > 0) {
            const defaultPM = paymentMethods.find((pm) => pm.isDefault)?.id;
            setSelectedPM(defaultPM || paymentMethods[0].id);
        }
    }, [isOpen, initialLoad, pmLoading, paymentMethods]);

    // ✅ Check if user needs to add payment method
    const needsPaymentMethod = paymentMethods.length === 0;

    // ✅ Handle adding a new payment method
    const handleAddPaymentMethod = async () => {
        if (!userName.trim() || !userEmail.trim()) {
            setError(t('paymentMethods.addForm.errors.fillAllFields'));
            return;
        }

        try {
            const result = await dispatch(
                createPaymentOrder({
                    name: userName,
                    email: userEmail,
                    returnUrl: `${window.location.origin}/payment-callback`,
                })
            ).unwrap();

            // Redirect to Viva Wallet checkout
            window.location.href = result.checkoutUrl;
        } catch (err: any) {
            setError(err.toString() || t('purchaseModal.errors.unknownError'));
        }
    };

    // ✅ Handle subscription purchase/trial
    const handleTransaction = async (isTrialAction: boolean) => {
        setError('');
        setIsLoading(isTrialAction ? 'trial' : 'purchase');

        try {
            // Validate payment method selected
            if (!selectedPM) {
                throw new Error(t('purchaseModal.errors.noPaymentMethod'));
            }

            const billingInterval = isYearly ? 'year' : 'month';

            if (isTrialAction) {
                // ✅ Create trial subscription
                await dispatch(
                    createTrialSubscription({
                        planId: plan._id,
                        paymentMethodId: selectedPM,
                    })
                ).unwrap();

                onTrialSuccess();
            } else {
                // ✅ Create paid subscription (or upgrade/downgrade)
                const result = await dispatch(
                    createSubscription({
                        planId: plan._id,
                        billingInterval,
                        paymentMethodId: selectedPM,
                    })
                ).unwrap();

                onSuccess(result.message);
            }
        } catch (err: any) {
            setError(err.toString() || t('purchaseModal.errors.unknownError'));
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Success handlers
    const showSuccessToast = (title: string, text: string) => {
        toast.success(title);
        dispatch(invalidateStatusCache());
        dispatch(fetchSubscription({ forceRefresh: true }));

        // Hard reload to update subscription status across dashboard
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const onSuccess = (message?: string) => {
        const title = isTopUp ? t('purchaseModal.success.topUp') : t('purchaseModal.success.subscription');
        const text = message || (isTopUp ? t('purchaseModal.success.topUpMessage', { planName: plan.name }) : t('purchaseModal.success.subscriptionMessage', { planName: plan.name }));

        showSuccessToast(title, text || '');
    };

    const onTrialSuccess = () => {
        showSuccessToast(t('purchaseModal.success.trial'), t('purchaseModal.success.trialMessage', { planName: plan.name }));
    };

    const formatPrice = (priceInCents: number): string => {
        return (priceInCents / 100).toFixed(2);
    };

    // ✅ Render add payment method form
    const renderAddPaymentForm = () => {
        return (
            <div className="space-y-6">
                <div className="text-center mb-6">
                    <div className="mx-auto h-16 w-16 text-blue-500 mb-4">
                        <IconCreditCard className="h-full w-full" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('purchaseModal.addPaymentMethod.title')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('purchaseModal.addPaymentMethod.description')}</p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddPaymentMethod();
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentMethods.addForm.nameLabel')}</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder={t('paymentMethods.addForm.namePlaceholder')}
                            className="form-input w-full"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentMethods.addForm.emailLabel')}</label>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder={t('paymentMethods.addForm.emailPlaceholder')}
                            className="form-input w-full"
                            required
                        />
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <IconLock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                        {t('paymentMethods.addForm.secureNote')}
                    </div>

                    {error && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddPaymentForm(false);
                                setError('');
                            }}
                            disabled={isCreatingOrder}
                            className="btn btn-outline-secondary flex-1 py-3 disabled:opacity-50"
                        >
                            {t('paymentMethods.addForm.buttons.cancel')}
                        </button>
                        <button type="submit" disabled={isCreatingOrder} className="btn btn-primary flex-1 py-3 disabled:opacity-50">
                            {isCreatingOrder ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {t('paymentMethods.addForm.buttons.processing')}
                                </span>
                            ) : (
                                t('paymentMethods.addForm.buttons.add')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // ✅ Render modal content
    const renderContent = () => {
        if (initialLoad) return <ModalSpinner />;

        // ✅ Show add payment method form if requested or if no payment methods exist
        if (showAddPaymentForm || (needsPaymentMethod && !showAddPaymentForm)) {
            return renderAddPaymentForm();
        }

        return (
            <div className="space-y-6">
                {/* Plan Summary Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{isTopUp ? t('purchaseModal.topUpDetails') : t('purchaseModal.yourPlan')}</h3>
                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                                {plan.name} ({isYearly ? t('purchaseModal.yearly') : t('purchaseModal.monthly')})
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('purchaseModal.billed', {
                                    interval: isYearly ? t('purchaseModal.annually') : t('purchaseModal.monthly'),
                                })}
                            </p>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">€{isYearly ? formatPrice(plan.yearlyPrice) : formatPrice(plan.monthlyPrice)}</p>
                    </div>
                </div>

                {/* Trial End Warning */}
                {subscription?.isTrialing && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg flex items-center text-yellow-800 dark:text-yellow-200">
                        <IconArchive className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="text-sm">{t('purchaseModal.trialEndNote')}</span>
                    </div>
                )}

                {/* Payment Method Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('purchaseModal.selectPaymentMethod')}</h3>
                    <div className="space-y-3">
                        {paymentMethods.map((pm) => (
                            <SelectablePaymentMethodCard key={pm.id} pm={pm} isSelected={selectedPM === pm.id} onClick={() => setSelectedPM(pm.id)} />
                        ))}
                    </div>
                    <button onClick={() => setShowAddPaymentForm(true)} className="btn btn-outline-secondary w-full mt-4 flex items-center justify-center">
                        <IconPlus className="w-5 h-5 mr-2" />
                        {t('purchaseModal.useDifferentCard')}
                    </button>
                </div>

                {/* Actions Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-3">
                    {/* Trial Button (if eligible) */}
                    {!hasHadTrial && plan.monthlyPrice > 0 && !isTopUp && (
                        <button
                            onClick={() => handleTransaction(true)}
                            disabled={!!isLoading || !selectedPM}
                            className="btn btn-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading === 'trial' ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    {t('purchaseModal.startingTrial')}
                                </span>
                            ) : (
                                t('purchaseModal.startTrial')
                            )}
                        </button>
                    )}

                    {/* Subscribe Button */}
                    <button
                        onClick={() => handleTransaction(false)}
                        disabled={!!isLoading || !selectedPM}
                        className="btn btn-outline-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading === 'purchase' ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                {t('purchaseModal.processing')}
                            </span>
                        ) : (
                            t('purchaseModal.subscribe', {
                                action: isTopUp ? t('purchaseModal.topUp') : t('purchaseModal.subscribeNow'),
                                price: isYearly ? formatPrice(plan.yearlyPrice) : formatPrice(plan.monthlyPrice),
                            })
                        )}
                    </button>

                    {/* Error Message */}
                    {error && <p className="text-red-600 text-sm mt-3 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

                    {/* Terms Agreement */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">{t('purchaseModal.termsAgreement')}</p>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isTopUp ? t('purchaseModal.topUpTitle') : t('purchaseModal.confirmSubscription')}>
            {renderContent()}
        </Modal>
    );
};

export default PurchaseModal;
