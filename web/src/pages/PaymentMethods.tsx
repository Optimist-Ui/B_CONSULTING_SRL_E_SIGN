// src/pages/PaymentMethods.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

// Redux imports
import { IRootState, AppDispatch } from '../store';
import { setPageTitle } from '../store/slices/themeConfigSlice';
import { fetchPaymentMethods, createPaymentOrder, setDefaultPaymentMethod, deletePaymentMethod } from '../store/thunk/paymentMethodThunks';
import { clearError, PaymentMethod } from '../store/slices/paymentMethodSlice';

// Icon imports
import IconCreditCard from '../components/Icon/IconCreditCard';
import IconTrash from '../components/Icon/IconTrash';
import IconX from '../components/Icon/IconX';
import IconStar from '../components/Icon/IconStar';
import IconPlus from '../components/Icon/IconPlus';
import IconLock from '../components/Icon/IconLock';
import IconLoader from '../components/Icon/IconLoader';

// Type definitions
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

// Card display component
export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ paymentMethod, onSetDefault, onDelete, isSettingDefault, isDeletingId }) => {
    const { t } = useTranslation();

    const getCardIcon = (cardType: string): string => {
        const icons: Record<string, string> = {
            Visa: '💳',
            Mastercard: '💳',
            Amex: '💳',
            'American Express': '💳',
            Discover: '💳',
            Unknown: '💳',
        };
        return icons[cardType] || '💳';
    };

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
                <div className="text-3xl mr-4">{getCardIcon(paymentMethod.cardType)}</div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{paymentMethod.cardType}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-base">•••• •••• •••• {paymentMethod.last4}</p>
                </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('paymentMethods.card.expires')} {paymentMethod.exp_month?.toString().padStart(2, '0')}/{paymentMethod.exp_year}
            </div>

            <div className="flex space-x-3">
                {!paymentMethod.isDefault && (
                    <button
                        onClick={() => onSetDefault(paymentMethod.id)}
                        disabled={isSettingDefault}
                        className="btn btn-outline-primary btn-sm px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSettingDefault ? (
                            <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                {t('paymentMethods.card.buttons.settingDefault')}
                            </span>
                        ) : (
                            t('paymentMethods.card.buttons.setDefault')
                        )}
                    </button>
                )}
                <button
                    onClick={() => onDelete(paymentMethod.id)}
                    disabled={isDeletingId === paymentMethod.id}
                    className="btn btn-outline-danger btn-sm px-4 py-2 rounded-md transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/50 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    const navigate = useNavigate();
    const { user } = useSelector((state: IRootState) => state.auth);
    const { paymentMethods, loading, error, isCreatingOrder, isSettingDefault, isDeleting } = useSelector((state: IRootState) => state.paymentMethods);

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');

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

    useEffect(() => {
        if (user) {
            setUserName(`${user.firstName} ${user.lastName}`);
            setUserEmail(user.email);
        }
    }, [user]);

    const handleAddPaymentMethod = async (): Promise<void> => {
        if (!userName.trim() || !userEmail.trim()) {
            showMessage(t('paymentMethods.addForm.errors.fillAllFields'), 'error');
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
        } catch (error: any) {
            showMessage(error.toString(), 'error');
        }
    };

    const handleSetDefault = async (paymentSourceId: string): Promise<void> => {
        try {
            await dispatch(setDefaultPaymentMethod({ paymentSourceId })).unwrap();
            await dispatch(fetchPaymentMethods());
            showMessage(t('paymentMethods.messages.setDefaultSuccess'));
        } catch (error: any) {
            showMessage(error.toString(), 'error');
        }
    };

    const handleDelete = (paymentSourceId: string): void => {
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
                    await dispatch(deletePaymentMethod({ paymentSourceId })).unwrap();
                    showMessage(t('paymentMethods.messages.deleteSuccess'));
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
                    disabled={isCreatingOrder}
                    className="btn btn-primary px-6 py-3 rounded-md flex items-center transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreatingOrder ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {t('paymentMethods.header.processing')}
                        </>
                    ) : (
                        <>
                            <IconPlus className="w-5 h-5 mr-2" />
                            {t('paymentMethods.header.addButton')}
                        </>
                    )}
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
                        disabled={isCreatingOrder}
                        className="btn btn-primary px-6 py-3 rounded-md flex items-center mx-auto transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddPaymentMethod();
                    }}
                    className="space-y-6"
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
                        <IconLock className="w-4 h-4 mr-2 text-blue-500" />
                        {t('paymentMethods.addForm.secureNote')}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            disabled={isCreatingOrder}
                            className="btn btn-outline-secondary px-6 py-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                        >
                            {t('paymentMethods.addForm.buttons.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isCreatingOrder}
                            className="btn btn-primary px-6 py-2 rounded-md transition-colors duration-200 hover:opacity-90 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isCreatingOrder ? (
                                <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {t('paymentMethods.addForm.buttons.processing')}
                                </span>
                            ) : (
                                t('paymentMethods.addForm.buttons.add')
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PaymentMethods;
