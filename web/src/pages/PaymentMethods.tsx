import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';

// Redux imports
import { IRootState, AppDispatch } from '../store';
import { setPageTitle } from '../store/slices/themeConfigSlice';
import { fetchPaymentMethods, attachPaymentMethod, setDefaultPaymentMethod, deletePaymentMethod } from '../store/thunk/paymentMethodThunks';
import { clearError, PaymentMethod } from '../store/slices/paymentMethodSlice';

// Icon imports
import IconCreditCard from '../components/Icon/IconCreditCard';
import IconTrash from '../components/Icon/IconTrash';
import IconX from '../components/Icon/IconX';
import IconStar from '../components/Icon/IconStar';
import IconPlus from '../components/Icon/IconPlus';
import IconLock from '../components/Icon/IconLock'; // Assuming you have a lock icon

// Stripe imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

// Type definitions
interface AddPaymentMethodFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    onSetDefault: (id: string) => void;
    onDelete: (id: string) => void;
    isSettingDefault: boolean;
    isDeletingId: string | null;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_APP_STRIPE_PUBLISHABLE_KEY as string);

// Card form component
export const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onSuccess, onCancel, isLoading }) => {
    const stripe = useStripe();
    const elements = useElements();
    const dispatch = useDispatch<AppDispatch>();
    const [cardError, setCardError] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setCardError('');

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            setCardError('Card element not found');
            setIsProcessing(false);
            return;
        }

        try {
            // Create payment method
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                setCardError(error.message || 'An error occurred while processing your card.');
                setIsProcessing(false);
                return;
            }

            // Attach payment method to customer
            await dispatch(
                attachPaymentMethod({
                    paymentMethodId: paymentMethod.id,
                })
            ).unwrap();

            onSuccess();
        } catch (error: any) {
            setCardError(error.toString() || 'Failed to add payment method.');
        } finally {
            setIsProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#1f2937',
                '::placeholder': {
                    color: '#9ca3af',
                },
                backgroundColor: 'transparent',
            },
            invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
            },
        },
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Information</label>
                <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                    <CardElement options={cardElementOptions} />
                </div>
                {cardError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                        <IconX className="w-4 h-4 mr-1" />
                        {cardError}
                    </p>
                )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <IconLock className="w-4 h-4 mr-2 text-green-500" />
                Your payment information is encrypted and securely processed by Stripe.
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isProcessing || isLoading}
                    className="btn btn-outline-secondary px-6 py-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing || isLoading}
                    className="btn btn-primary px-6 py-2 rounded-md transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500"
                >
                    {isProcessing ? 'Adding...' : 'Add Payment Method'}
                </button>
            </div>
        </form>
    );
};

// Card display component
export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ paymentMethod, onSetDefault, onDelete, isSettingDefault, isDeletingId }) => {
    const getCardIcon = (brand: string): string => {
        const icons: Record<string, string> = {
            visa: '💳', // Replace with actual SVG if available
            mastercard: '💳',
            amex: '💳',
            discover: '💳',
        };
        return icons[brand] || '💳';
    };

    const formatCardBrand = (brand: string): string => {
        const brands: Record<string, string> = {
            visa: 'Visa',
            mastercard: 'Mastercard',
            amex: 'American Express',
            discover: 'Discover',
        };
        return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
            {paymentMethod.isDefault && (
                <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <IconStar className="w-4 h-4 mr-1" />
                        Default
                    </span>
                </div>
            )}

            <div className="flex items-center mb-6">
                <div className="text-3xl mr-4">{getCardIcon(paymentMethod.brand)}</div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{formatCardBrand(paymentMethod.brand)}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-base">•••• •••• •••• {paymentMethod.last4}</p>
                </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Expires {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
            </div>

            <div className="flex space-x-3">
                {!paymentMethod.isDefault && (
                    <button
                        onClick={() => onSetDefault(paymentMethod.id)}
                        disabled={isSettingDefault}
                        className="btn btn-outline-primary btn-sm px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 focus:ring-2 focus:ring-blue-500"
                    >
                        {isSettingDefault ? 'Setting...' : 'Set as Default'}
                    </button>
                )}

                <button
                    onClick={() => onDelete(paymentMethod.id)}
                    disabled={isDeletingId === paymentMethod.id}
                    className="btn btn-outline-danger btn-sm px-4 py-2 rounded-md transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/50 focus:ring-2 focus:ring-red-500"
                >
                    {isDeletingId === paymentMethod.id ? (
                        <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            Removing...
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <IconTrash className="w-4 h-4 mr-2" />
                            Remove
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

// Modal component
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity duration-300 backdrop-blur-sm" onClick={onClose}></div>

                <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all my-8 max-w-xl w-full scale-100 opacity-100 p-1">
                    <div className="bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center">
                            <IconLock className="w-5 h-5 text-blue-500 mr-2" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 focus:ring-2 focus:ring-gray-300 rounded-full p-1"
                        >
                            <IconX className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6">{children}</div>
                </div>
            </div>
        </div>
    );
};

// Main component
const PaymentMethods: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { paymentMethods, loading, error, isAttaching, isSettingDefault, isDeleting } = useSelector((state: IRootState) => state.paymentMethods);

    const [showAddModal, setShowAddModal] = useState<boolean>(false);

    useEffect(() => {
        dispatch(setPageTitle('Payment Methods'));
        dispatch(fetchPaymentMethods());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            showMessage(error, 'error');
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleAddSuccess = async (): Promise<void> => {
        setShowAddModal(false);
        await dispatch(fetchPaymentMethods());
        showMessage('Payment method added successfully!');
    };

    const handleSetDefault = async (paymentMethodId: string): Promise<void> => {
        try {
            await dispatch(setDefaultPaymentMethod({ paymentMethodId })).unwrap();
            await dispatch(fetchPaymentMethods());
            showMessage('Default payment method updated successfully!');
        } catch (error: any) {
            showMessage(error.toString(), 'error');
        }
    };

    const handleDelete = (paymentMethodId: string): void => {
        Swal.fire({
            icon: 'warning',
            title: 'Remove Payment Method?',
            text: 'Are you sure you want to remove this payment method?',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it',
            cancelButtonText: 'Cancel',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deletePaymentMethod({ paymentMethodId })).unwrap();
                    showMessage('Payment method removed successfully!');
                } catch (error: any) {
                    showMessage(error.toString(), 'error');
                }
            }
        });
    };

    const showMessage = (msg: string, type: 'success' | 'error' = 'success'): void => {
        const toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    if (loading && paymentMethods.length === 0) {
        return (
            <div className="flex items-center justify-center py-32 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading payment methods...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Methods</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">Securely manage your payment options for seamless e-signing experiences</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary px-6 py-3 rounded-md flex items-center transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500"
                >
                    <IconPlus className="w-5 h-5 mr-2" />
                    Add Payment Method
                </button>
            </div>

            {paymentMethods.length === 0 ? (
                <div className="text-center py-32 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="mx-auto h-32 w-32 text-gray-400 mb-8">
                        <IconCreditCard className="h-full w-full" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No Payment Methods Added</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Add a payment method to manage your e-sign subscriptions effortlessly</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary px-6 py-3 rounded-md flex items-center mx-auto transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500"
                    >
                        <IconPlus className="w-5 h-5 mr-2" />
                        Add Your First Payment Method
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {paymentMethods.map((paymentMethod) => (
                        <PaymentMethodCard
                            key={paymentMethod.id}
                            paymentMethod={paymentMethod}
                            onSetDefault={handleSetDefault}
                            onDelete={handleDelete}
                            isSettingDefault={isSettingDefault}
                            isDeletingId={isDeleting}
                        />
                    ))}
                </div>
            )}

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Payment Method">
                <Elements stripe={stripePromise}>
                    <AddPaymentMethodForm onSuccess={handleAddSuccess} onCancel={() => setShowAddModal(false)} isLoading={isAttaching} />
                </Elements>
            </Modal>
        </div>
    );
};

export default PaymentMethods;
