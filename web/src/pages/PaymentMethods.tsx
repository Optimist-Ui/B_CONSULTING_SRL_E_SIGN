import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

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
import IconLock from '../components/Icon/IconLock';

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
    const { t } = useTranslation();
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
            setCardError(t('paymentMethods.addForm.errors.cardElementNotFound'));
            setIsProcessing(false);
            return;
        }

        try {
            const { error, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement });
            if (error) {
                setCardError(error.message || t('paymentMethods.addForm.errors.cardProcessingError'));
                setIsProcessing(false);
                return;
            }
            await dispatch(attachPaymentMethod({ paymentMethodId: paymentMethod.id })).unwrap();
            onSuccess();
        } catch (error: any) {
            setCardError(error.toString() || t('paymentMethods.addForm.errors.addMethodFailed'));
        } finally {
            setIsProcessing(false);
        }
    };

    const cardElementOptions = {
        style: { base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' }, backgroundColor: 'transparent' }, invalid: { color: '#ef4444', iconColor: '#ef4444' } },
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentMethods.addForm.cardInfoLabel')}</label>
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
                {t('paymentMethods.addForm.secureNote')}
            </div>
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isProcessing || isLoading}
                    className="btn btn-outline-secondary px-6 py-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300"
                >
                    {t('paymentMethods.addForm.buttons.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing || isLoading}
                    className="btn btn-primary px-6 py-2 rounded-md transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500"
                >
                    {isProcessing ? t('paymentMethods.addForm.buttons.adding') : t('paymentMethods.addForm.buttons.add')}
                </button>
            </div>
        </form>
    );
};

// Card display component
export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ paymentMethod, onSetDefault, onDelete, isSettingDefault, isDeletingId }) => {
    const { t } = useTranslation();
    const getCardIcon = (brand: string): string => ({ visa: '💳', mastercard: '💳', amex: '💳', discover: '💳' }[brand] || '💳');
    const formatCardBrand = (brand: string): string =>
        ({ visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover' }[brand] || brand.charAt(0).toUpperCase() + brand.slice(1));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
            {paymentMethod.isDefault && (
                <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <IconStar className="w-4 h-4 mr-1" />
                        {t('paymentMethods.card.defaultBadge')}
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
                {t('paymentMethods.card.expires')} {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
            </div>
            <div className="flex space-x-3">
                {!paymentMethod.isDefault && (
                    <button
                        onClick={() => onSetDefault(paymentMethod.id)}
                        disabled={isSettingDefault}
                        className="btn btn-outline-primary btn-sm px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 focus:ring-2 focus:ring-blue-500"
                    >
                        {isSettingDefault ? t('paymentMethods.card.buttons.settingDefault') : t('paymentMethods.card.buttons.setDefault')}
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
                            {t('paymentMethods.card.buttons.removing')}
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <IconTrash className="w-4 h-4 mr-2" />
                            {t('paymentMethods.card.buttons.remove')}
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
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { paymentMethods, loading, error, isAttaching, isSettingDefault, isDeleting } = useSelector((state: IRootState) => state.paymentMethods);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);

    useEffect(() => {
        dispatch(setPageTitle(t('paymentMethods.pageTitle')));
        dispatch(fetchPaymentMethods());
    }, [dispatch, t]);

    useEffect(() => {
        if (error) {
            showMessage(error, 'error');
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleAddSuccess = async (): Promise<void> => {
        setShowAddModal(false);
        await dispatch(fetchPaymentMethods());
        showMessage(t('paymentMethods.messages.addSuccess'));
    };

    const handleSetDefault = async (paymentMethodId: string): Promise<void> => {
        try {
            await dispatch(setDefaultPaymentMethod({ paymentMethodId })).unwrap();
            await dispatch(fetchPaymentMethods());
            showMessage(t('paymentMethods.messages.setDefaultSuccess'));
        } catch (error: any) {
            showMessage(error.toString(), 'error');
        }
    };

    const handleDelete = (paymentMethodId: string): void => {
        Swal.fire({
            icon: 'warning',
            title: t('paymentMethods.deleteConfirm.title'),
            text: t('paymentMethods.deleteConfirm.text'),
            showCancelButton: true,
            confirmButtonText: t('paymentMethods.deleteConfirm.confirmButton'),
            cancelButtonText: t('paymentMethods.deleteConfirm.cancelButton'),
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deletePaymentMethod({ paymentMethodId })).unwrap();
                    showMessage(t('paymentMethods.messages.deleteSuccess'));
                } catch (error: any) {
                    showMessage(error.toString(), 'error');
                }
            }
        });
    };

    const showMessage = (msg: string, type: 'success' | 'error' = 'success'): void => {
        const toast = Swal.mixin({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000, customClass: { container: 'toast' } });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    if (loading && paymentMethods.length === 0) {
        return (
            <div className="flex items-center justify-center py-32 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">{t('paymentMethods.loading')}</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('paymentMethods.header.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">{t('paymentMethods.header.description')}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary px-6 py-3 rounded-md flex items-center transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500"
                >
                    <IconPlus className="w-5 h-5 mr-2" />
                    {t('paymentMethods.header.addButton')}
                </button>
            </div>

            {paymentMethods.length === 0 ? (
                <div className="text-center py-32 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="mx-auto h-32 w-32 text-gray-400 mb-8">
                        <IconCreditCard className="h-full w-full" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{t('paymentMethods.emptyState.title')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">{t('paymentMethods.emptyState.description')}</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary px-6 py-3 rounded-md flex items-center mx-auto transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500"
                    >
                        <IconPlus className="w-5 h-5 mr-2" />
                        {t('paymentMethods.emptyState.addButton')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {paymentMethods.map((pm) => (
                        <PaymentMethodCard key={pm.id} paymentMethod={pm} onSetDefault={handleSetDefault} onDelete={handleDelete} isSettingDefault={isSettingDefault} isDeletingId={isDeleting} />
                    ))}
                </div>
            )}

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('paymentMethods.addModalTitle')}>
                <Elements stripe={stripePromise}>
                    <AddPaymentMethodForm onSuccess={handleAddSuccess} onCancel={() => setShowAddModal(false)} isLoading={isAttaching} />
                </Elements>
            </Modal>
        </div>
    );
};

export default PaymentMethods;
