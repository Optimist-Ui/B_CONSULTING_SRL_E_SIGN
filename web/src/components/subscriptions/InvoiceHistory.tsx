// src/components/subscriptions/InvoiceHistory.tsx - UPDATED WITH VIEW DETAILS

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IRootState, AppDispatch } from '../../store';
import { fetchInvoices } from '../../store/thunk/subscriptionThunks';
import IconX from '../Icon/IconX';
import IconCreditCard from '../Icon/IconCreditCard';
import IconEye from '../Icon/IconEye'; // ✅ NEW: Eye icon for "View Details"
import InvoiceDetailModal from './InvoiceDetailModal'; // ✅ NEW: Import the detail modal

interface InvoiceHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const { t } = useTranslation();
    let badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

    switch (status) {
        case 'paid':
            badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            break;
        case 'failed':
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            break;
        case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            break;
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>
            {t(`invoiceHistory.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
        </span>
    );
};

const TransactionTypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const { t } = useTranslation();
    const typeColors: Record<string, string> = {
        new_subscription: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        renewal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        trial_conversion: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        plan_change: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        payment: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${typeColors[type] || typeColors.payment}`}>{t(`invoiceHistory.types.${type}`, type.replace('_', ' '))}</span>
    );
};

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { invoices, isFetchingInvoices } = useSelector((state: IRootState) => state.subscription);

    // ✅ NEW: State for detail modal
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) dispatch(fetchInvoices());
    }, [isOpen, dispatch]);

    const formatInvoiceDate = (isoString: string): string => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString(t('invoiceHistory.locale', 'en-US'), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // ✅ NEW: Handle viewing invoice details
    const handleViewDetails = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedInvoiceId(null);
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center p-4 sm:p-6 md:p-8"
                aria-labelledby="modal-title"
                role="dialog"
                aria-modal="true"
            >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-lg sm:max-w-2xl md:max-w-6xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white" id="modal-title">
                            {t('invoiceHistory.title')}
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 p-2 transition-colors duration-200"
                            aria-label={t('invoiceHistory.closeLabel')}
                        >
                            <IconX className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                        {isFetchingInvoices ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                                <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">{t('invoiceHistory.loading')}</span>
                            </div>
                        ) : invoices.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.date')}
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.description')}
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.type')}
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.amount')}
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.status')}
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.card')}
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {t('invoiceHistory.table.headers.action')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatInvoiceDate(invoice.date)}</td>
                                                <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{invoice.description}</td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                    <TransactionTypeBadge type={invoice.transactionType} />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">€{invoice.amount}</td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                    <InvoiceStatusBadge status={invoice.status} />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <IconCreditCard className="w-4 h-4 mr-1" />
                                                        •••• {invoice.cardLast4}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {/* ✅ UPDATED: View Details Button */}
                                                    <button
                                                        onClick={() => handleViewDetails(invoice.id)}
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors duration-200"
                                                    >
                                                        <IconEye className="w-4 h-4 mr-2" />
                                                        {t('invoiceHistory.table.viewAction')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                                    <IconCreditCard className="h-full w-full" />
                                </div>
                                <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{t('invoiceHistory.empty.title')}</h4>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('invoiceHistory.empty.description')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ NEW: Invoice Detail Modal */}
            <InvoiceDetailModal invoiceId={selectedInvoiceId} isOpen={isDetailModalOpen} onClose={handleCloseDetailModal} />
        </>
    );
};

export default InvoiceHistory;
