// src/pages/PaymentCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

// Redux imports
import { AppDispatch } from '../store';
import { fetchPaymentMethods } from '../store/thunk/paymentMethodThunks';

// Icon imports
import IconChecks from '../components/Icon/IconChecks';
import IconX from '../components/Icon/IconX';

type PaymentStatus = 'processing' | 'success' | 'failed' | 'cancelled';

const PaymentCallback: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<PaymentStatus>('processing');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        handlePaymentCallback();
    }, []);

    const handlePaymentCallback = async () => {
        try {
            const orderCode = searchParams.get('s');
            const transactionId = searchParams.get('t');
            const statusParam = searchParams.get('status');

            // 1. Handle Cancellation
            if (statusParam === 'cancelled' || statusParam === 'cancel') {
                setStatus('cancelled');
                setMessage(t('paymentCallback.cancelled.message'));
                setTimeout(() => navigate('/payment-methods'), 3000);
                return;
            }

            // 2. Handle Success
            if (orderCode || transactionId) {
                // Wait for webhook
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Refresh data
                await dispatch(fetchPaymentMethods()).unwrap();

                // Update UI State
                setStatus('success');
                setMessage(t('paymentCallback.success.message'));

                // ❌ REMOVED: Swal.fire() here to avoid duplicate success messages.
                // The UI component rendered below is sufficient.

                // Redirect
                setTimeout(() => navigate('/payment-methods'), 2000);
            } else {
                // 3. Handle Failure (Missing params)
                setStatus('failed');
                setMessage(t('paymentCallback.failed.message'));
                setTimeout(() => navigate('/payment-methods'), 3000);
            }
        } catch (error: any) {
            console.error('Payment callback error:', error);
            setStatus('failed');
            // Ensure fallback message is translated or generic
            setMessage(error.message || t('paymentCallback.failed.message'));
            setTimeout(() => navigate('/payment-methods'), 3000);
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <div className="text-center">
                        <div className="mx-auto mb-8">
                            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-primary mx-auto"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('paymentCallback.processing.title')}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('paymentCallback.processing.message')}</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center">
                        <div className="mx-auto mb-8 w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <IconChecks className="w-16 h-16 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('paymentCallback.success.title')}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">{message || t('paymentCallback.success.text')}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('paymentCallback.success.redirecting')}</div>
                    </div>
                );

            case 'failed':
                return (
                    <div className="text-center">
                        <div className="mx-auto mb-8 w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <IconX className="w-16 h-16 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('paymentCallback.failed.title')}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">{message || t('paymentCallback.failed.text')}</p>
                        <button onClick={() => navigate('/payment-methods')} className="btn btn-primary px-6 py-3 rounded-md transition-colors duration-200 hover:opacity-90">
                            {t('paymentCallback.failed.backButton')}
                        </button>
                    </div>
                );

            case 'cancelled':
                return (
                    <div className="text-center">
                        <div className="mx-auto mb-8 w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                            <IconX className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('paymentCallback.cancelled.title')}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">{message || t('paymentCallback.cancelled.text')}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('paymentCallback.cancelled.redirecting')}</div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12">{renderContent()}</div>
        </div>
    );
};

export default PaymentCallback;
