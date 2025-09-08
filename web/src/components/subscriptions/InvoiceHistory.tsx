import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../../store';
import { fetchInvoices } from '../../store/thunk/subscriptionThunks';
import IconDownload from '../Icon/IconDownload';
import IconX from '../Icon/IconX';

interface InvoiceHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

// A reusable status badge for invoices
const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    let badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    // Format status: 'paid' -> 'Paid', 'open' -> 'Open', etc.
    const formattedStatus = status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    switch (status) {
        case 'paid':
            badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            break;
        case 'open':
            badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            break;
        case 'void':
        case 'uncollectible':
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            break;
    }

    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>{formattedStatus}</span>;
};

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { invoices, isFetchingInvoices } = useSelector((state: IRootState) => state.subscription);

    useEffect(() => {
        // Fetch invoices only when the modal is opened
        if (isOpen) {
            dispatch(fetchInvoices());
        }
    }, [isOpen, dispatch]);

    // Re-format date for the table view
    const formatInvoiceDate = (isoString: string): string => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center p-4 sm:p-6 md:p-8"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-lg sm:max-w-2xl md:max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white" id="modal-title">
                        Invoice History
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 p-2 transition-colors duration-200"
                        aria-label="Close modal"
                    >
                        <IconX className="h-6 w-6" />
                    </button>
                </div>

                {/* Body with scrollable content */}
                <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                    {isFetchingInvoices ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                            <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading invoices...</span>
                        </div>
                    ) : invoices.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatInvoiceDate(invoice.createdAt)}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {invoice.amount} {invoice.currency.toUpperCase()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                <InvoiceStatusBadge status={invoice.status} />
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a
                                                    href={invoice.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors duration-200"
                                                >
                                                    <IconDownload className="w-4 h-4 mr-2" />
                                                    View Invoice
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">No Invoices Found</h4>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your billing history will appear here once you are billed.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceHistory;
