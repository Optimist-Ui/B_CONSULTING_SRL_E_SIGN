// SigningDrawer.tsx
import React, { useState, useEffect, ComponentType, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { AppDispatch, IRootState } from '../../../store';
import { setSigningDrawerOpen, setSigningStep, setSigningMethod, setSigningEmail, setSigningPhone, resetSigningState } from '../../../store/slices/participantSlice';
import { sendSignatureOtp, verifySignatureOtp, sendSignatureSmsOtp, verifySignatureSmsOtp } from '../../../store/thunk/signatureThunks';
import { FiMail, FiSmartphone, FiLoader, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Typed Icons
const FiMailTyped = FiMail as ComponentType<{ className?: string }>;
const FiSmartphoneTyped = FiSmartphone as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;
const FiChevronRightTyped = FiChevronRight as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;

const SigningDrawer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { uiState, packageData } = useSelector((state: IRootState) => state.participant);
    const { signatureLoading, signatureError, activeSigningFieldId, signingStep, signingMethod, signingEmail, signingPhone } = uiState;

    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);

    // Get current user's signature method from package data
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

    // Dispatch the appropriate sendOtp thunk based on method
    const handleIdentityConfirm = async () => {
        if (!packageData || !activeSigningFieldId || !signingMethod) {
            toast.error('An error occurred. Cannot identify the document or field.');
            return;
        }

        const identityValue = signingMethod === 'email' ? signingEmail : signingPhone;
        if (!identityValue) {
            toast.error(`Please enter your ${signingMethod === 'email' ? 'email' : 'phone number'}.`);
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
                toast.success('OTP sent to your email!');
            } else if (signingMethod === 'sms') {
                await dispatch(
                    sendSignatureSmsOtp({
                        packageId: packageData._id,
                        fieldId: activeSigningFieldId,
                        phone: signingPhone,
                    })
                ).unwrap();
                toast.success('OTP sent to your phone!');
            }

            setTimer(60);
        } catch (err) {
            console.error('Failed to send OTP:', err);
        }
    };

    // Resend the OTP
    const handleResendOtp = () => {
        const identityValue = signingMethod === 'email' ? signingEmail : signingPhone;
        if (identityValue) {
            handleIdentityConfirm();
        } else {
            toast.warn(`Could not resend OTP. Please go back and confirm your ${signingMethod === 'email' ? 'email' : 'phone number'}.`);
        }
    };

    // Dispatch the appropriate verifyOtp thunk based on method
    const handleCompleteSigning = async () => {
        if (!packageData || !activeSigningFieldId || !signingMethod || otp.length < 6) {
            toast.error('An error occurred. Missing required information.');
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

    const maskedContact = () => {
        if (signingMethod === 'email') {
            return packageData?.currentUser?.contactEmail.replace(/^(.).*?@/, '$1*****@');
        } else if (signingMethod === 'sms') {
            // Assuming phone is stored in currentUser, mask it appropriately
            const phone = packageData?.currentUser?.contactPhone; // You might need to adjust this field
            return phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '';
        }
        return '';
    };

    const goBack = () => {
        if (signingStep === 'identity') {
            if (currentUserSignatureMethod && currentUserSignatureMethod !== 'Both') {
                // If user has a specific method assigned, close drawer instead of going to method selection
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

    // Determine if we should show method selection or go straight to identity
    const shouldShowMethodSelection = () => {
        return !currentUserSignatureMethod || currentUserSignatureMethod === 'Both';
    };

    // Auto-select method if user has specific signature method assigned
    useEffect(() => {
        if (uiState.isSigningDrawerOpen && signingStep === 'method' && currentUserSignatureMethod) {
            if (currentUserSignatureMethod === 'Email OTP') {
                handleMethodSelect('email');
            } else if (currentUserSignatureMethod === 'SMS OTP') {
                handleMethodSelect('sms');
            }
            // If 'Both', let user choose
        }
    }, [uiState.isSigningDrawerOpen, signingStep, currentUserSignatureMethod]);

    // UI text helpers
    const getStepTitle = () => {
        switch (signingStep) {
            case 'method':
                return 'Choose Signing Method';
            case 'identity':
                return `Verify Your ${signingMethod === 'email' ? 'Email' : 'Phone Number'}`;
            case 'otp':
                return 'Enter Verification Code';
            case 'success':
                return 'Document Signed!';
            default:
                return 'Signing Process';
        }
    };

    const getStepDescription = () => {
        switch (signingStep) {
            case 'method':
                return 'Choose a method to securely verify your identity';
            case 'identity':
                return `For security, please enter your ${signingMethod === 'email' ? 'email address' : 'phone number'} below`;
            case 'otp':
                const contact = signingMethod === 'email' ? signingEmail : signingPhone;
                return `We sent a 6-digit code to ${contact}. It expires in ${timer} seconds.`;
            case 'success':
                return 'Your signature has been successfully applied to the document';
            default:
                return '';
        }
    };

    const getIdentityPlaceholder = () => {
        if (signingMethod === 'email') {
            return 'e.g., yourname@example.com';
        } else if (signingMethod === 'sms') {
            return 'e.g., +1234567890';
        }
        return '';
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
                                <div className="h-full flex flex-col bg-white shadow-2xl overflow-hidden">
                                    <div className="px-4 sm:px-6 py-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-semibold text-[#1e293b]">{getStepTitle()}</h2>
                                                <p className="text-sm text-gray-500 mt-1">{getStepDescription()}</p>
                                            </div>
                                            <button onClick={closeDrawer} className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200">
                                                <FiChevronRightTyped className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
                                        {signingStep === 'method' && shouldShowMethodSelection() && (
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => handleMethodSelect('email')}
                                                    className="w-full flex items-center gap-4 text-left p-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-slate-400 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                        <FiMailTyped className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[#1e293b]">One-Time Code via Email</div>
                                                        <div className="text-sm text-gray-500">Secure verification through your email</div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleMethodSelect('sms')}
                                                    className="w-full flex items-center gap-4 text-left p-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-slate-400 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                                        <FiSmartphoneTyped className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[#1e293b]">One-Time Code via SMS</div>
                                                        <div className="text-sm text-gray-500">Secure verification through your phone</div>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                        {signingStep === 'identity' && signingMethod && (
                                            <div className="space-y-6">
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        We will send a verification code to the {signingMethod === 'email' ? 'email address' : 'phone number'} you enter below.
                                                    </p>
                                                    <p className="font-semibold text-[#1e293b]">
                                                        It must match the recipient's {signingMethod === 'email' ? 'email' : 'phone'}: {maskedContact()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#1e293b] mb-2">Your {signingMethod === 'email' ? 'Email Address' : 'Phone Number'}*</label>
                                                    <input
                                                        type={signingMethod === 'email' ? 'email' : 'tel'}
                                                        value={getIdentityValue()}
                                                        onChange={(e) => handleIdentityChange(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
                                                        placeholder={getIdentityPlaceholder()}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {signingStep === 'otp' && (
                                            <div className="space-y-6">
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
                                                    <div className="text-2xl font-bold text-green-600 mb-1">{timer}</div>
                                                    <div className="text-xs text-gray-600">seconds remaining</div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#1e293b] mb-2 text-center">Enter 6-digit verification code</label>
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-center text-2xl tracking-[0.5em] font-mono"
                                                        placeholder="------"
                                                    />
                                                </div>
                                                {timer === 0 && (
                                                    <button
                                                        onClick={handleResendOtp}
                                                        disabled={signatureLoading}
                                                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
                                                    >
                                                        {signatureLoading ? 'Sending...' : 'Resend verification code'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {signingStep === 'success' && (
                                            <div className="flex flex-col items-center justify-center text-center py-8">
                                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                    <FiCheckCircleTyped className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-[#1e293b] mb-3">Document Signed Successfully!</h3>
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                                                    <p className="text-sm text-gray-600">Thank you for completing the signing process via {signingMethod === 'email' ? 'Email OTP' : 'SMS OTP'}.</p>
                                                    <p className="text-xs text-gray-500 mt-2">All parties will be notified when the document is fully completed.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                                        {signingStep === 'identity' && (
                                            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                                                {shouldShowMethodSelection() && (
                                                    <button
                                                        onClick={goBack}
                                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                                                    >
                                                        Back
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleIdentityConfirm}
                                                    disabled={!getIdentityValue() || signatureLoading}
                                                    className="px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                                                >
                                                    {signatureLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : 'Request Code'}
                                                </button>
                                            </div>
                                        )}
                                        {signingStep === 'otp' && (
                                            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                                                <button
                                                    onClick={goBack}
                                                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    onClick={handleCompleteSigning}
                                                    disabled={otp.length < 6 || signatureLoading}
                                                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                                                >
                                                    {signatureLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : 'Complete Signing'}
                                                </button>
                                            </div>
                                        )}
                                        {signingStep === 'success' && (
                                            <button
                                                onClick={closeDrawer}
                                                className="w-full px-4 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                Back to Document
                                            </button>
                                        )}
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
