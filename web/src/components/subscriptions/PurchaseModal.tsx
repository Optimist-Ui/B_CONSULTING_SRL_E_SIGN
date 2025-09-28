import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';

// Redux and Store imports
import { IRootState, AppDispatch } from '../../store';
import { Plan } from '../../store/slices/planSlice';
import { PaymentMethod } from '../../store/slices/paymentMethodSlice';
import { createSubscription, createTrialSubscription, fetchSubscription } from '../../store/thunk/subscriptionThunks';
import { fetchPaymentMethods } from '../../store/thunk/paymentMethodThunks';
import { invalidateStatusCache } from '../../store/slices/subscriptionSlice';

// Re-usable components from your PaymentMethods file
import { Modal, AddPaymentMethodForm } from '../../pages/PaymentMethods';
import IconStar from '../Icon/IconStar';
import IconPlus from '../Icon/IconPlus';
import IconArchive from '../Icon/IconArchive'; // Assume warning icon for trial end note

const stripePromise = loadStripe(import.meta.env.VITE_APP_STRIPE_PUBLISHABLE_KEY as string);

// A simple spinner for the modal's loading state
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

// A dedicated card component for SELECTION inside the modal.
const SelectablePaymentMethodCard: React.FC<{ pm: PaymentMethod; isSelected: boolean }> = ({ pm, isSelected }) => {
    const getCardBrandName = (brand: string) => {
        const brands: Record<string, string> = {
            visa: 'Visa',
            mastercard: 'Mastercard',
            amex: 'American Express',
        };
        return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
    };

    return (
        <div
            className={`flex items-center p-4 border rounded-lg transition-all duration-200 ${
                isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
        >
            <div className={`flex items-center justify-center w-12 h-8 rounded-md mr-4 text-white font-bold text-sm bg-gray-700`}>{getCardBrandName(pm.brand)}</div>
            <div className="flex-grow">
                <p className="font-semibold text-gray-800 dark:text-gray-200">**** **** **** {pm.last4}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Expires {pm.exp_month.toString().padStart(2, '0')}/{pm.exp_year}
                </p>
            </div>
            {pm.isDefault && (
                <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    <IconStar className="w-4 h-4 mr-1 text-yellow-500" />
                    Default
                </div>
            )}
        </div>
    );
};

const PurchaseModalContent: React.FC<PurchaseModalProps> = ({ isOpen, onClose, plan, isYearly }) => {
    const stripe = useStripe();
    const elements = useElements();
    const dispatch = useDispatch<AppDispatch>();

    const { paymentMethods, loading: pmLoading } = useSelector((state: IRootState) => state.paymentMethods);
    const { subscription } = useSelector((state: IRootState) => state.subscription);
    const { user } = useSelector((state: IRootState) => state.auth);
    const hasHadTrial = user?.hasHadTrial ?? false;

    const isTopUp = !!subscription && plan.name === subscription.planName && (isYearly ? subscription.planInterval === 'year' : subscription.planInterval === 'month');

    // Separate loading states for each action button for a better user experience
    const [isLoading, setIsLoading] = useState<'trial' | 'purchase' | false>(false);
    const [selectedPM, setSelectedPM] = useState<string>('');
    const [isAddingNewCard, setIsAddingNewCard] = useState(false);
    const [error, setError] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setInitialLoad(true);
            setSelectedPM('');
            setError('');
            setIsAddingNewCard(false);
            dispatch(fetchPaymentMethods()).finally(() => setInitialLoad(false));
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (!isOpen || initialLoad || pmLoading) return;
        if (paymentMethods.length > 0) {
            const defaultPM = paymentMethods.find((pm) => pm.isDefault)?.id;
            setSelectedPM(defaultPM || paymentMethods[0].id);
            setIsAddingNewCard(false);
        } else {
            setIsAddingNewCard(true);
        }
    }, [isOpen, initialLoad, pmLoading, paymentMethods]);

    const handleTransaction = async (isTrialAction: boolean) => {
        if (!stripe || !elements) return;

        let paymentMethodId = selectedPM;
        setError('');
        setIsLoading(isTrialAction ? 'trial' : 'purchase');

        try {
            if (isAddingNewCard) {
                const cardElement = elements.getElement(CardElement);
                if (!cardElement) throw new Error('Card details form not found.');

                const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement });
                if (pmError) throw new Error(pmError.message || 'Invalid card details.');
                paymentMethodId = paymentMethod.id;
            }

            if (!paymentMethodId) {
                throw new Error('Please select or add a payment method to continue.');
            }

            const priceId = isYearly ? plan.yearlyPriceId : plan.monthlyPriceId;
            if (!priceId) throw new Error('This plan is not available for purchase at the moment.');

            // Dispatch the appropriate thunk based on the user's action
            if (isTrialAction) {
                await dispatch(createTrialSubscription({ priceId, paymentMethodId })).unwrap();
                onTrialSuccess();
            } else {
                const resultAction = await dispatch(createSubscription({ priceId, paymentMethodId }));
                // Handle 3D Secure and other post-payment actions
                if (createSubscription.fulfilled.match(resultAction)) {
                    const subscriptionResponse = resultAction.payload;
                    const paymentIntent = subscriptionResponse.latest_invoice?.payment_intent;
                    if (paymentIntent && paymentIntent.status === 'requires_action') {
                        const { error: confirmationError } = await stripe.confirmCardPayment(paymentIntent.client_secret);
                        if (confirmationError) throw confirmationError;
                    }
                    onSuccess();
                } else {
                    throw new Error((resultAction.payload as string) || 'An unknown error occurred.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const showSuccessToast = (title: string, text: string) => {
        toast.success(title);
        dispatch(invalidateStatusCache()); // Invalidate status cache for immediate UI updates
        dispatch(fetchSubscription({ forceRefresh: true })); // Re-fetch details to show management view
        onClose();
    };

    const onSuccess = () =>
        showSuccessToast(
            isTopUp ? 'Top-up Successful!' : 'Subscription Successful!',
            isTopUp ? `You now have more documents available on your ${plan.name} plan!` : `Welcome to the ${plan.name} plan!`
        );
    const onTrialSuccess = () => showSuccessToast('Free Trial Started!', `You have 14 days of access to the ${plan.name} plan!`);

    const handleAddNewCardSuccess = () => {
        dispatch(fetchPaymentMethods());
        setIsAddingNewCard(false);
    };

    const renderContent = () => {
        if (initialLoad) return <ModalSpinner />;

        if (isAddingNewCard) {
            return <AddPaymentMethodForm onSuccess={handleAddNewCardSuccess} onCancel={() => paymentMethods.length > 0 && setIsAddingNewCard(false)} isLoading={pmLoading || !!isLoading} />;
        }

        return (
            <div className="space-y-6">
                {/* Plan Summary Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{isTopUp ? 'Top-up Details' : 'Your Plan'}</h3>
                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                                {plan.name} ({isYearly ? 'Yearly' : 'Monthly'})
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Billed {isYearly ? 'annually' : 'monthly'}.</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">€{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</p>
                    </div>
                </div>

                {subscription?.isTrialing && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg flex items-center text-yellow-800 dark:text-yellow-200">
                        <IconArchive className="w-5 h-5 mr-2" />
                        Note: Proceeding will end your free trial and charge you immediately.
                    </div>
                )}

                {/* Payment Method Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Select Payment Method</h3>
                    <div className="space-y-3">
                        {paymentMethods.map((pm) => (
                            <div key={pm.id} onClick={() => setSelectedPM(pm.id)} className="cursor-pointer">
                                <SelectablePaymentMethodCard pm={pm} isSelected={selectedPM === pm.id} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setIsAddingNewCard(true)} className="btn btn-outline-secondary w-full mt-4 flex items-center justify-center">
                        <IconPlus className="w-5 h-5 mr-2" /> Use a Different Card
                    </button>
                </div>

                {/* Actions Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-3">
                    {!hasHadTrial && plan.monthlyPrice > 0 && !isTopUp && (
                        <button onClick={() => handleTransaction(true)} disabled={!!isLoading} className="btn btn-primary w-full h-12 text-lg">
                            {isLoading === 'trial' ? 'Starting Trial...' : 'Start 14-Day Free Trial'}
                        </button>
                    )}
                    <button onClick={() => handleTransaction(false)} disabled={!!isLoading || !selectedPM} className="btn btn-outline-primary w-full h-12 text-lg">
                        {isLoading === 'purchase' ? 'Processing...' : `${isTopUp ? 'Top-up' : 'Subscribe'} Now (€${isYearly ? plan.yearlyPrice : plan.monthlyPrice})`}
                    </button>
                    {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">By continuing, you agree to our Terms of Service.</p>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isTopUp ? 'Top-up Your Plan' : 'Confirm Your Subscription'}>
            {renderContent()}
        </Modal>
    );
};

// Main Export
const PurchaseModal: React.FC<PurchaseModalProps> = (props) => (
    <Elements stripe={stripePromise}>
        <PurchaseModalContent {...props} />
    </Elements>
);

export default PurchaseModal;
