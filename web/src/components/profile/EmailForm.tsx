import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { AppDispatch } from '../../store';
import { requestEmailChange, verifyEmailChange } from '../../store/thunk/authThunks';

interface EmailFormValues {
    newEmail: string;
}

interface EmailFormProps {
    user: any;
}

const getEmailSchema = (t: (key: string) => string) =>
    Yup.object().shape({
        newEmail: Yup.string()
            .email(t('profile.emailForm.validation.invalid'))
            .required(t('profile.emailForm.validation.required'))
            .max(254)
            .test('not-same', t('profile.emailForm.validation.notSame'), function (value) {
                return value !== this.options.context?.currentEmail;
            }),
    });

const EmailForm = ({ user }: EmailFormProps) => {
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();
    const EmailSchema = getEmailSchema(t);

    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');

    const initialEmailRef = useRef(user.email);

    useEffect(() => {
        if (user.email !== initialEmailRef.current && otpSent) {
            setOtpSent(false);
            setOtp('');
            setCountdown(0);
            setPendingEmail('');
            initialEmailRef.current = user.email;
        }
    }, [user.email, otpSent]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOtp = async (newEmail: string) => {
        if (!newEmail || newEmail === user?.email) {
            toast.error(t('profile.emailForm.messages.invalidNewEmail') as string);
            return;
        }

        setIsSendingOtp(true);
        try {
            await dispatch(requestEmailChange({ newEmail })).unwrap();
            toast.success(t('profile.emailForm.messages.otpSentSuccess') as string);
            setOtpSent(true);
            setPendingEmail(newEmail);
            setCountdown(60);
        } catch (err: any) {
            toast.error(err?.message || t('profile.emailForm.messages.otpSentFailed'));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (newEmail: string) => {
        if (otp.length !== 6) {
            toast.error(t('profile.emailForm.messages.otpLengthError') as string);
            return;
        }

        setIsVerifying(true);
        try {
            await dispatch(verifyEmailChange({ otp, newEmail })).unwrap();
            toast.success(t('profile.emailForm.messages.updateSuccess') as string);
        } catch (err: any) {
            toast.error(err?.message || t('profile.emailForm.messages.invalidOtp'));
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
            await handleVerifyOtp(values.newEmail);
        }
    };

    return (
        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
            <Formik initialValues={{ newEmail: pendingEmail || '' }} validationSchema={EmailSchema} onSubmit={handleEmailSubmit} context={{ currentEmail: user.email }} enableReinitialize={false}>
                {({ values, resetForm }) => (
                    <Form>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <h6 className="text-lg font-semibold mb-2">{t('profile.emailForm.title')}</h6>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('profile.emailForm.description')}</p>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {t('profile.emailForm.currentEmailLabel')} <strong>{user.email}</strong>
                                </p>
                            </div>

                            <div>
                                <label htmlFor="newEmail">{t('profile.emailForm.newEmail.label')}</label>
                                <Field name="newEmail" type="email" className="form-input" placeholder={t('profile.emailForm.newEmail.placeholder')} disabled={otpSent} />
                                <ErrorMessage name="newEmail" component="div" className="text-danger text-sm mt-1" />
                            </div>

                            {otpSent && (
                                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        {t('profile.emailForm.otp.sentToLabel')} <strong>{user.email}</strong>
                                    </p>
                                    <div>
                                        <label htmlFor="otp">{t('profile.emailForm.otp.label')}</label>
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
                                                        handleVerifyOtp(values.newEmail);
                                                    }
                                                }}
                                            />
                                            {countdown === 0 ? (
                                                <button type="button" onClick={() => handleSendOtp(values.newEmail)} className="btn btn-outline-primary btn-sm" disabled={isSendingOtp}>
                                                    {isSendingOtp ? t('profile.emailForm.otp.button.sending') : t('profile.emailForm.otp.button.resend')}
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
                                            {isVerifying ? t('profile.emailForm.otp.button.verifying') : t('profile.emailForm.otp.button.verify')}
                                        </button>
                                        <button type="button" onClick={() => handleCancel(resetForm)} className="btn btn-outline-danger">
                                            {t('profile.emailForm.otp.button.cancel')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!otpSent && (
                                <div className="flex gap-3">
                                    <button type="submit" className="btn btn-primary" disabled={isSendingOtp}>
                                        {isSendingOtp ? t('profile.emailForm.button.sending') : t('profile.emailForm.button.sendCode')}
                                    </button>
                                    <button type="button" onClick={() => resetForm()} className="btn btn-outline-primary">
                                        {t('profile.emailForm.button.clear')}
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
