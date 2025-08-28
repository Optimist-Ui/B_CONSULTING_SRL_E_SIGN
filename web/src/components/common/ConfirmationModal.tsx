import React, { useState, Fragment, ComponentType } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title: string;
    message: string;
    confirmText: string;
    isReasonRequired?: boolean;
    loading?: boolean;
    confirmButtonColor?: 'red' | 'blue' | 'green';
    maxReasonLength?: number;
    reasonPlaceholder?: string;
    reasonLabel?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    isReasonRequired = false,
    loading = false,
    confirmButtonColor = 'red',
    maxReasonLength = 500,
    reasonPlaceholder = 'e.g., Document is no longer needed, sent to wrong recipient...',
    reasonLabel = 'Reason (Optional)',
}) => {
    const [reason, setReason] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleClose = () => {
        if (loading) return; // Prevent closing while submitting
        setReason('');
        setValidationError('');
        onClose();
    };

    const handleConfirm = () => {
        // Validation
        if (isReasonRequired && !reason.trim()) {
            setValidationError('A reason is required.');
            return;
        }
        if (reason.length > maxReasonLength) {
            setValidationError(`Reason must be ${maxReasonLength} characters or less.`);
            return;
        }

        setValidationError('');
        onConfirm(reason.trim());
        setReason('');
    };

    // Color variants for confirm button
    const getConfirmButtonClasses = () => {
        const baseClasses =
            'w-full inline-flex justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-semibold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed transition-all duration-200';

        switch (confirmButtonColor) {
            case 'blue':
                return `${baseClasses} bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 disabled:bg-blue-400`;
            case 'green':
                return `${baseClasses} bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 disabled:bg-green-400`;
            case 'red':
            default:
                return `${baseClasses} bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-400`;
        }
    };

    // Icon background color based on button color
    const getIconBgClass = () => {
        switch (confirmButtonColor) {
            case 'blue':
                return 'bg-blue-100';
            case 'green':
                return 'bg-green-100';
            case 'red':
            default:
                return 'bg-red-100';
        }
    };

    // Icon color based on button color
    const getIconColorClass = () => {
        switch (confirmButtonColor) {
            case 'blue':
                return 'text-blue-600';
            case 'green':
                return 'text-green-600';
            case 'red':
            default:
                return 'text-red-600';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-xl transition-all border border-gray-200">
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 disabled:opacity-50"
                                >
                                    <FiXTyped className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-full ${getIconBgClass()} flex items-center justify-center mb-4`}>
                                        <FiAlertTriangleTyped className={`w-8 h-8 ${getIconColorClass()}`} />
                                    </div>
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                        {title}
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">{message}</p>
                                    </div>
                                </div>

                                <div className="mt-6 w-full">
                                    <label htmlFor="confirmationReason" className="block text-sm font-medium text-gray-700 mb-1">
                                        {reasonLabel} {isReasonRequired && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        id="confirmationReason"
                                        rows={4}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 transition-all duration-200 ${
                                            validationError ? 'border-red-500 ring-red-300' : 'border-gray-300 focus:ring-[#1e293b] focus:border-[#1e293b] outline-none'
                                        }`}
                                        placeholder={reasonPlaceholder}
                                        disabled={loading}
                                        maxLength={maxReasonLength}
                                    />
                                    <div className="flex justify-between items-center mt-1 min-h-[1.25rem]">
                                        {validationError && <p className="text-xs text-red-600">{validationError}</p>}
                                        <p className="text-xs text-gray-400 ml-auto">
                                            {reason.length} / {maxReasonLength}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                                    <button type="button" onClick={handleConfirm} disabled={loading || (isReasonRequired && !reason.trim())} className={getConfirmButtonClasses()}>
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FiAlertTriangleTyped className="-ml-1 mr-2 h-5 w-5" />
                                                {confirmText}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={loading}
                                        className="w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ConfirmationModal;
