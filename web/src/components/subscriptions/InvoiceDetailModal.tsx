import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IRootState, AppDispatch } from '../../store';
import { fetchInvoiceDetail } from '../../store/thunk/subscriptionThunks';
import IconX from '../Icon/IconX';
import IconDownload from '../Icon/IconDownload';
import IconCreditCard from '../Icon/IconCreditCard';
import { clearCurrentInvoice } from '../../store/slices/subscriptionSlice';

interface InvoiceDetailModalProps {
    invoiceId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoiceId, isOpen, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { currentInvoice, isFetchingInvoiceDetail, error } = useSelector((state: IRootState) => state.subscription);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && invoiceId) {
            dispatch(fetchInvoiceDetail(invoiceId));
        }
        return () => {
            dispatch(clearCurrentInvoice());
        };
    }, [isOpen, invoiceId, dispatch]);

    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Invoice ${currentInvoice?.invoiceNumber}</title>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 40px; }
                                .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                                .invoice-title { font-size: 32px; font-weight: bold; color: #333; }
                                .info-section { margin: 20px 0; }
                                .info-label { font-weight: bold; color: #666; }
                                .info-value { color: #333; }
                                .total { font-size: 24px; font-weight: bold; margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                                th { background-color: #f5f5f5; font-weight: bold; }
                            </style>
                        </head>
                        <body>
                            ${printRef.current.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    const formatDate = (isoString: string): string => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        // Define the type for the mapping object explicitly
        const statusClasses: Record<string, string> = {
            paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        };

        // Fallback to 'pending' style if status is unknown
        const badgeClass = statusClasses[status] || statusClasses.pending;

        return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoiceDetail.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <IconX className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isFetchingInvoiceDetail ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            <span className="ml-4 text-lg">{t('invoiceDetail.loading')}</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">{error}</div>
                    ) : currentInvoice ? (
                        <>
                            {/* Printable Content */}
                            <div ref={printRef}>
                                {/* Invoice Header */}
                                <div className="header mb-8">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="invoice-title text-4xl font-bold text-gray-900 dark:text-white mb-2">INVOICE</h1>
                                            <p className="text-gray-600 dark:text-gray-400">{currentInvoice.invoiceNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            {getStatusBadge(currentInvoice.status)}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{formatDate(currentInvoice.date)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer & Transaction Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* Customer Information */}
                                    <div className="info-section">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('invoiceDetail.billedTo')}</h3>
                                        <div className="space-y-2 text-sm">
                                            <p className="font-medium text-gray-900 dark:text-white">{currentInvoice.customerName}</p>
                                            <p className="text-gray-600 dark:text-gray-400">{currentInvoice.customerEmail}</p>
                                        </div>
                                    </div>

                                    {/* Transaction Details */}
                                    <div className="info-section">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('invoiceDetail.transactionDetails')}</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="info-label text-gray-600 dark:text-gray-400">{t('invoiceDetail.transactionId')}:</span>
                                                <span className="info-value font-mono text-gray-900 dark:text-white">{currentInvoice.id.slice(0, 12)}...</span>
                                            </div>
                                            {currentInvoice.orderCode && (
                                                <div className="flex justify-between">
                                                    <span className="info-label text-gray-600 dark:text-gray-400">{t('invoiceDetail.orderCode')}:</span>
                                                    <span className="info-value font-mono text-gray-900 dark:text-white">{currentInvoice.orderCode}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="info-label text-gray-600 dark:text-gray-400">{t('invoiceDetail.paymentMethod')}:</span>
                                                <div className="flex items-center">
                                                    <IconCreditCard className="w-4 h-4 mr-2 text-gray-600" />
                                                    <span className="info-value text-gray-900 dark:text-white">•••• {currentInvoice.cardLast4}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Items Table */}
                                <div className="mb-8">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                                <th className="text-left py-3 text-gray-700 dark:text-gray-300">{t('invoiceDetail.description')}</th>
                                                <th className="text-center py-3 text-gray-700 dark:text-gray-300">{t('invoiceDetail.type')}</th>
                                                <th className="text-right py-3 text-gray-700 dark:text-gray-300">{t('invoiceDetail.amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <td className="py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{currentInvoice.planName}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{currentInvoice.description}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {currentInvoice.transactionType.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-medium text-gray-900 dark:text-white">€{currentInvoice.amount}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total */}
                                <div className="total border-t-2 border-gray-300 dark:border-gray-600 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">{t('invoiceDetail.total')}</span>
                                        <span className="text-3xl font-bold text-primary">
                                            €{currentInvoice.amount} {currentInvoice.currency}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{t('invoiceDetail.thankYou')}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-6 print:hidden">
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <IconDownload className="w-5 h-5 mr-2" />
                                    {t('invoiceDetail.print')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
                                >
                                    {t('invoiceDetail.close')}
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
