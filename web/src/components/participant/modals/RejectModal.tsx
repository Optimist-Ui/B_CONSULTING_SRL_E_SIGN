import React, { useState, Fragment, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
import { FiXCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import { AppDispatch, IRootState } from '../../../store';
import { setRejectModalOpen, setRejectionReason } from '../../../store/slices/participantSlice';
import { rejectPackage } from '../../../store/thunk/participantThunks';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;

const RejectModal: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { packageData, uiState, loading } = useSelector((state: IRootState) => state.participant);
    const { rejectionReason, isRejectModalOpen } = uiState;
    const [validationError, setValidationError] = useState('');

    const handleClose = () => {
        if (loading) return; // Prevent closing while submitting
        dispatch(setRejectModalOpen(false));
    };

    const handleSubmitRejection = async () => {
        // Basic client-side validation
        if (!rejectionReason.trim()) {
            setValidationError(t('rejectModal.validation.emptyReason'));
            return;
        }
        if (rejectionReason.length > 500) {
            setValidationError(t('rejectModal.validation.reasonTooLong'));
            return;
        }

        if (!packageData || !packageData.currentUser) {
            toast.error(t('rejectModal.errors.missingData') as string);
            return;
        }

        setValidationError(''); // Clear previous errors

        // Dispatch the thunk with all necessary data
        try {
            await dispatch(
                rejectPackage({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                    reason: rejectionReason.trim(),
                })
            ).unwrap();
            // Success is handled by the extra reducer (closes modal, shows toast)
        } catch (error) {
            // Error is handled by the extra reducer (shows toast)
            console.error('Failed to reject package:', error);
        }
    };

    return (
        <Transition appear show={isRejectModalOpen} as={Fragment}>
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
                                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
                                    title={t('rejectModal.close')}
                                >
                                    <FiXTyped className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                        <FiAlertTriangleTyped className="w-8 h-8 text-red-600" />
                                    </div>
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                        {t('rejectModal.title')}
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">{t('rejectModal.description')}</p>
                                    </div>
                                </div>

                                <div className="mt-6 w-full">
                                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('rejectModal.reasonLabel')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="rejectionReason"
                                        rows={4}
                                        value={rejectionReason}
                                        onChange={(e) => dispatch(setRejectionReason(e.target.value))}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 transition-all duration-200 ${
                                            validationError ? 'border-red-500 ring-red-300' : 'border-gray-300 focus:ring-[#1e293b] focus:border-[#1e293b]'
                                        }`}
                                        placeholder={t('rejectModal.reasonPlaceholder')}
                                        disabled={loading}
                                    />
                                    <div className="flex justify-between items-center mt-1 min-h-[1.25rem]">
                                        {validationError && <p className="text-xs text-red-600">{validationError}</p>}
                                        <p className="text-xs text-gray-400 ml-auto">{t('rejectModal.characterCount', { count: rejectionReason.length })}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSubmitRejection}
                                        disabled={loading || !rejectionReason.trim()}
                                        className="w-full inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:bg-red-400 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                                {t('rejectModal.submitting')}
                                            </>
                                        ) : (
                                            <>
                                                <FiXCircleTyped className="-ml-1 mr-2 h-5 w-5" />
                                                {t('rejectModal.submit')}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={loading}
                                        className="w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                                    >
                                        {t('rejectModal.cancel')}
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

export default RejectModal;
