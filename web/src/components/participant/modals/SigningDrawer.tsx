// SigningDrawer.tsx - Updated Version with Enter Key Support and i18n Translations
import React, { useState, useEffect, ComponentType, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { AppDispatch, IRootState } from '../../../store';
import { setSigningDrawerOpen, setSigningStep, setSigningMethod, setSigningEmail, setSigningPhone, resetSigningState } from '../../../store/slices/participantSlice';
import { sendSignatureOtp, verifySignatureOtp, sendSignatureSmsOtp, verifySignatureSmsOtp } from '../../../store/thunk/signatureThunks';
import { FiMail, FiSmartphone, FiLoader, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Typed Icons
const FiMailTyped = FiMail as ComponentType<{ className?: string }>;
const FiSmartphoneTyped = FiSmartphone as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;
const FiChevronRightTyped = FiChevronRight as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;

const SigningDrawer: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { uiState, packageData } = useSelector((state: IRootState) => state.participant);
    const { signatureLoading, signatureError, activeSigningFieldId, signingStep, signingMethod, signingEmail, signingPhone } = uiState;

    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);

    const currentUserSignatureMethod = packageData?.currentUser?.signatureMethod;

    // Reset local state when drawer closes or flow restarts
    useEffect(() => {
        if (!uiState.isSigningDrawerOpen || signingStep === 'method') {
            setOtp('');
            dispatch(resetSigningState());
        }
    }, [uiState.isSigningDrawerOpen, signingStep, dispatch]);

    // Timer countdown logic
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (signingStep === 'otp' && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [signingStep, timer]);

    // Display API errors in a toast
    useEffect(() => {
        if (signatureError) {
            toast.error(signatureError);
        }
    }, [signatureError]);

    const handleMethodSelect = (method: 'email' | 'sms') => {
        dispatch(setSigningMethod(method));
        dispatch(setSigningStep('identity'));
    };

    const handleIdentityChange = (value: string) => {
        if (signingMethod === 'email') {
            dispatch(setSigningEmail(value));
        } else if (signingMethod === 'sms') {
            dispatch(setSigningPhone(value));
        }
    };

    const handleIdentityConfirm = async () => {
        if (!packageData || !activeSigningFieldId || !signingMethod) {
            toast.error(t('signingDrawer.errors.missingData') as string);
            return;
        }

        const identityValue = signingMethod === 'email' ? signingEmail : signingPhone;
        if (!identityValue) {
            toast.error(t('signingDrawer.errors.missingIdentity', { method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone') }) as string);
            return;
        }

        try {
            if (signingMethod === 'email') {
                await dispatch(
                    sendSignatureOtp({
                        packageId: packageData._id,
                        fieldId: activeSigningFieldId,
                        email: signingEmail,
                    })
                ).unwrap();
                toast.success(t('signingDrawer.otpSent.email') as string);
            } else if (signingMethod === 'sms') {
                await dispatch(
                    sendSignatureSmsOtp({
                        packageId: packageData._id,
                        fieldId: activeSigningFieldId,
                        phone: signingPhone,
                    })
                ).unwrap();
                toast.success(t('signingDrawer.otpSent.sms') as string);
            }
            setTimer(60);
        } catch (err) {
            console.error('Failed to send OTP:', err);
        }
    };

    const handleResendOtp = () => {
        const identityValue = signingMethod === 'email' ? signingEmail : signingPhone;
        if (identityValue) {
            handleIdentityConfirm();
        } else {
            toast.warn(t('signingDrawer.errors.resendOtp', { method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone') }) as string);
        }
    };

    const handleCompleteSigning = async () => {
        if (!packageData || !activeSigningFieldId || !signingMethod || otp.length < 6) {
            toast.error(t('signingDrawer.errors.invalidOtp') as string);
            return;
        }

        try {
            if (signingMethod === 'email') {
                await dispatch(
                    verifySignatureOtp({
                        packageId: packageData._id,
                        fieldId: activeSigningFieldId,
                        otp,
                    })
                ).unwrap();
            } else if (signingMethod === 'sms') {
                await dispatch(
                    verifySignatureSmsOtp({
                        packageId: packageData._id,
                        fieldId: activeSigningFieldId,
                        otp,
                    })
                ).unwrap();
            }
        } catch (err) {
            console.error('Failed to verify OTP:', err);
        }
    };

    // Handle Enter key submission for identity step
    const handleIdentityKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !signatureLoading) {
            e.preventDefault();
            const identityValue = getIdentityValue();
            if (identityValue) {
                handleIdentityConfirm();
            }
        }
    };

    // Handle Enter key submission for OTP step
    const handleOtpKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !signatureLoading && otp.length === 6) {
            e.preventDefault();
            handleCompleteSigning();
        }
    };

    const maskedContact = () => {
        if (signingMethod === 'email') {
            return packageData?.currentUser?.contactEmail.replace(/^(.).*?@/, '$1*****@');
        } else if (signingMethod === 'sms') {
            const phone = packageData?.currentUser?.contactPhone;
            return phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '';
        }
        return '';
    };

    const goBack = () => {
        if (signingStep === 'identity') {
            if (currentUserSignatureMethod && currentUserSignatureMethod !== 'Both') {
                dispatch(setSigningDrawerOpen(false));
            } else {
                dispatch(setSigningStep('method'));
            }
        }
        if (signingStep === 'otp') dispatch(setSigningStep('identity'));
    };

    const closeDrawer = () => {
        dispatch(setSigningDrawerOpen(false));
    };

    const shouldShowMethodSelection = () => {
        const activeField = packageData?.fields.find((f) => f.id === activeSigningFieldId);
        const currentUserAssignment = activeField?.assignedUsers.find((user) => user.contactId === packageData?.currentUser?.contactId);
        const allowed = currentUserAssignment?.signatureMethods ?? [];
        return allowed.length > 1;
    };

    useEffect(() => {
        if (!uiState.isSigningDrawerOpen || signingStep !== 'method') return;

        // Get signature methods from the active signing field's assigned users
        const activeField = packageData?.fields.find((f) => f.id === activeSigningFieldId);
        const currentUserAssignment = activeField?.assignedUsers.find((user) => user.contactId === packageData?.currentUser?.contactId);
        const allowed = currentUserAssignment?.signatureMethods ?? [];

        if (allowed.length === 1) {
            const method = allowed[0].toLowerCase().includes('email') ? 'email' : 'sms';
            handleMethodSelect(method);
        }
    }, [uiState.isSigningDrawerOpen, signingStep, activeSigningFieldId, packageData]);

    const getStepTitle = () => {
        switch (signingStep) {
            case 'method':
                return t('signingDrawer.steps.method.title');
            case 'identity':
                return t('signingDrawer.steps.identity.title', { method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone') });
            case 'otp':
                return t('signingDrawer.steps.otp.title');
            case 'success':
                return t('signingDrawer.steps.success.title');
            default:
                return t('signingDrawer.steps.default.title');
        }
    };

    const getStepDescription = () => {
        switch (signingStep) {
            case 'method':
                return t('signingDrawer.steps.method.description');
            case 'identity':
                return t('signingDrawer.steps.identity.description', { method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone') });
            case 'otp': {
                const contact = signingMethod === 'email' ? signingEmail : signingPhone;
                return t('signingDrawer.steps.otp.description', { contact, timer });
            }
            case 'success':
                return t('signingDrawer.steps.success.description');
            default:
                return t('signingDrawer.steps.default.description');
        }
    };

    const getIdentityPlaceholder = () => {
        return signingMethod === 'email' ? t('signingDrawer.steps.identity.emailPlaceholder') : t('signingDrawer.steps.identity.phonePlaceholder');
    };

    const getIdentityValue = () => {
        return signingMethod === 'email' ? signingEmail : signingPhone;
    };

    return (
        <Transition show={uiState.isSigningDrawerOpen} as={Fragment}>
            <div className="fixed inset-0 overflow-hidden z-50">
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={closeDrawer} />
                </Transition.Child>

                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <section className="absolute inset-y-0 right-0 max-w-full flex pointer-events-auto">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-in-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in-out duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <div className="w-screen max-w-md sm:max-w-lg">
                                {/* Full height white background container */}
                                <div className="h-full flex flex-col bg-white shadow-2xl">
                                    {/* Fixed Header */}
                                    <div className="px-4 sm:px-6 py-6 border-b border-gray-200 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-semibold text-[#1e293b]">{getStepTitle()}</h2>
                                                <p className="text-sm text-gray-500 mt-1">{getStepDescription()}</p>
                                            </div>
                                            <button
                                                onClick={closeDrawer}
                                                className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200"
                                                title={t('signingDrawer.close')}
                                            >
                                                <FiChevronRightTyped className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content Area - Takes remaining space */}
                                    <div className="flex-1 overflow-y-auto">
                                        {/* Content positioned at top-to-center with max-width for better UX */}
                                        <div className="px-4 sm:px-6 py-6 max-w-xl mx-auto">
                                            {/* METHOD SELECTION STEP */}
                                            {signingStep === 'method' && shouldShowMethodSelection() && (
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={() => handleMethodSelect('email')}
                                                        className="w-full flex items-center gap-4 text-left p-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-slate-400 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <FiMailTyped className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-[#1e293b]">{t('signingDrawer.steps.method.emailOption')}</div>
                                                            <div className="text-sm text-gray-500">{t('signingDrawer.steps.method.emailDescription')}</div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleMethodSelect('sms')}
                                                        className="w-full flex items-center gap-4 text-left p-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-slate-400 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <FiSmartphoneTyped className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-[#1e293b]">{t('signingDrawer.steps.method.smsOption')}</div>
                                                            <div className="text-sm text-gray-500">{t('signingDrawer.steps.method.smsDescription')}</div>
                                                        </div>
                                                    </button>
                                                </div>
                                            )}

                                            {/* IDENTITY VERIFICATION STEP */}
                                            {signingStep === 'identity' && signingMethod && (
                                                <div className="space-y-6" onKeyPress={handleIdentityKeyPress}>
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                                        <p className="text-xs text-gray-500 mb-1">
                                                            {t('signingDrawer.steps.identity.info', { method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone') })}
                                                        </p>
                                                        <p className="font-semibold text-[#1e293b]">
                                                            {t('signingDrawer.steps.identity.matchInfo', {
                                                                method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone'),
                                                                contact: maskedContact(),
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#1e293b] mb-2">
                                                            {t('signingDrawer.steps.identity.label', { method: signingMethod === 'email' ? t('signingDrawer.email') : t('signingDrawer.phone') })}*
                                                        </label>
                                                        <input
                                                            type={signingMethod === 'email' ? 'email' : 'tel'}
                                                            value={getIdentityValue()}
                                                            onChange={(e) => handleIdentityChange(e.target.value)}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
                                                            placeholder={getIdentityPlaceholder()}
                                                        />
                                                    </div>

                                                    {/* Action Buttons - Inline with content */}
                                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                        {shouldShowMethodSelection() && (
                                                            <button
                                                                onClick={goBack}
                                                                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                                                            >
                                                                {t('signingDrawer.steps.identity.backButton')}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={handleIdentityConfirm}
                                                            disabled={!getIdentityValue() || signatureLoading}
                                                            className="flex-1 px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                                                        >
                                                            {signatureLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : t('signingDrawer.steps.identity.requestButton')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* OTP VERIFICATION STEP */}
                                            {signingStep === 'otp' && (
                                                <div className="space-y-6" onKeyPress={handleOtpKeyPress}>
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
                                                        <div className="text-2xl font-bold text-green-600 mb-1">{timer}</div>
                                                        <div className="text-xs text-gray-600">{t('signingDrawer.steps.otp.timerLabel')}</div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#1e293b] mb-2 text-center">{t('signingDrawer.steps.otp.inputLabel')}</label>
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-center text-2xl tracking-[0.5em] font-mono"
                                                            placeholder={t('signingDrawer.steps.otp.inputPlaceholder')}
                                                        />
                                                    </div>
                                                    {timer === 0 && (
                                                        <button
                                                            onClick={handleResendOtp}
                                                            disabled={signatureLoading}
                                                            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
                                                        >
                                                            {signatureLoading ? t('signingDrawer.steps.otp.resending') : t('signingDrawer.steps.otp.resendButton')}
                                                        </button>
                                                    )}

                                                    {/* Action Buttons - Inline with content */}
                                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                        <button
                                                            onClick={goBack}
                                                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                                                        >
                                                            {t('signingDrawer.steps.otp.backButton')}
                                                        </button>
                                                        <button
                                                            onClick={handleCompleteSigning}
                                                            disabled={otp.length < 6 || signatureLoading}
                                                            className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                                                        >
                                                            {signatureLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : t('signingDrawer.steps.otp.completeButton')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SUCCESS STEP */}
                                            {signingStep === 'success' && (
                                                <div className="flex flex-col items-center justify-center text-center">
                                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                        <FiCheckCircleTyped className="w-10 h-10" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-[#1e293b] mb-3">{t('signingDrawer.steps.success.title')}</h3>
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                                                        <p className="text-sm text-gray-600">
                                                            {t('signingDrawer.steps.success.message', { method: signingMethod === 'email' ? t('signingDrawer.emailOtp') : t('signingDrawer.smsOtp') })}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-2">{t('signingDrawer.steps.success.notification')}</p>
                                                    </div>

                                                    {/* Action Button - Inline with content */}
                                                    <button
                                                        onClick={closeDrawer}
                                                        className="w-full px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        {t('signingDrawer.steps.success.backButton')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Transition.Child>
                    </section>
                </div>
            </div>
        </Transition>
    );
};

export default SigningDrawer;
