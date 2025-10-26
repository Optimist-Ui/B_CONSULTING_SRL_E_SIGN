import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import { IRootState, AppDispatch } from '../../store';
import { requestEmailChange, verifyEmailChange } from '../../store/thunk/authThunks';

interface EmailFormValues {
    newEmail: string;
}

interface EmailFormProps {
    user: any;
}

const EmailSchema = Yup.object().shape({
    newEmail: Yup.string()
        .email('Invalid email')
        .required('New email is required')
        .max(254)
        .test('not-same', 'New email must be different from current email', function (value) {
            return value !== this.options.context?.currentEmail;
        }),
});

const EmailForm = ({ user }: EmailFormProps) => {
    const dispatch: AppDispatch = useDispatch();

    // DON'T select loading from Redux - it causes re-renders
    // const { loading: authLoading } = useSelector((state: IRootState) => state.auth);

    // Use local loading states instead
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');

    // Store the initial user email to detect when it actually changes
    const initialEmailRef = useRef(user.email);

    // Detect successful email change and reset form
    useEffect(() => {
        if (user.email !== initialEmailRef.current && otpSent) {
            // Email has changed successfully, reset everything
            console.log('Email changed successfully, resetting form');
            setOtpSent(false);
            setOtp('');
            setCountdown(0);
            setPendingEmail('');
            initialEmailRef.current = user.email;
        }
    }, [user.email, otpSent]);

    // Countdown effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOtp = async (newEmail: string) => {
        if (!newEmail || newEmail === user?.email) {
            toast.error('Please enter a valid new email');
            return;
        }

        setIsSendingOtp(true);
        try {
            await dispatch(requestEmailChange({ newEmail })).unwrap();
            toast.success('OTP sent to your current email!');
            setOtpSent(true);
            setPendingEmail(newEmail);
            setCountdown(60);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to send OTP');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (newEmail: string, resetForm: () => void) => {
        if (otp.length !== 6) {
            toast.error('Enter 6-digit OTP');
            return;
        }

        setIsVerifying(true);
        try {
            await dispatch(verifyEmailChange({ otp, newEmail })).unwrap();
            toast.success('Email updated successfully!');

            // Don't reset here - let the useEffect handle it when user.email changes
        } catch (err: any) {
            toast.error(err?.message || 'Invalid OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCancel = (resetForm: () => void) => {
        setOtpSent(false);
        setOtp('');
        setCountdown(0);
        setPendingEmail('');
        resetForm();
    };

    const handleEmailSubmit = async (values: EmailFormValues, { resetForm }: { resetForm: () => void }) => {
        if (!otpSent) {
            await handleSendOtp(values.newEmail);
        } else {
            await handleVerifyOtp(values.newEmail, resetForm);
        }
    };

    return (
        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
            <Formik initialValues={{ newEmail: pendingEmail || '' }} validationSchema={EmailSchema} onSubmit={handleEmailSubmit} context={{ currentEmail: user.email }} enableReinitialize={false}>
                {({ values, resetForm }) => (
                    <Form>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <h6 className="text-lg font-semibold mb-2">Change Email Address</h6>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">We'll send a verification code to your current email to confirm the change.</p>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    Current Email: <strong>{user.email}</strong>
                                </p>
                            </div>

                            <div>
                                <label htmlFor="newEmail">New Email Address</label>
                                <Field name="newEmail" type="email" className="form-input" placeholder="Enter your new email address" disabled={otpSent} />
                                <ErrorMessage name="newEmail" component="div" className="text-danger text-sm mt-1" />
                            </div>

                            {otpSent && (
                                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Verification code sent to: <strong>{user.email}</strong>
                                    </p>

                                    <div>
                                        <label htmlFor="otp">Enter 6-digit Verification Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="form-input text-center font-mono tracking-widest flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && otp.length === 6) {
                                                        handleVerifyOtp(values.newEmail, resetForm);
                                                    }
                                                }}
                                            />
                                            {countdown === 0 ? (
                                                <button type="button" onClick={() => handleSendOtp(values.newEmail)} className="btn btn-outline-primary btn-sm" disabled={isSendingOtp}>
                                                    {isSendingOtp ? 'Sending...' : 'Resend'}
                                                </button>
                                            ) : (
                                                <button type="button" className="btn btn-outline-primary btn-sm" disabled>
                                                    {countdown}s
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button type="submit" className="btn btn-success flex-1" disabled={isVerifying || otp.length !== 6}>
                                            {isVerifying ? 'Verifying...' : 'Verify & Update Email'}
                                        </button>
                                        <button type="button" onClick={() => handleCancel(resetForm)} className="btn btn-outline-danger">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!otpSent && (
                                <div className="flex gap-3">
                                    <button type="submit" className="btn btn-primary" disabled={isSendingOtp}>
                                        {isSendingOtp ? 'Sending...' : 'Send Verification Code'}
                                    </button>
                                    <button type="button" onClick={() => resetForm()} className="btn btn-outline-primary">
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default EmailForm;
