import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { IRootState, AppDispatch } from '../../store';
import { changePassword } from '../../store/thunk/authThunks';

interface PasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

const getPasswordSchema = (t: (key: string) => string) =>
    Yup.object().shape({
        currentPassword: Yup.string()
            .required(t('profile.passwordForm.validation.currentPassword.required'))
            .min(6, t('profile.passwordForm.validation.min'))
            .max(128, t('profile.passwordForm.validation.max')),
        newPassword: Yup.string()
            .required(t('profile.passwordForm.validation.newPassword.required'))
            .min(6, t('profile.passwordForm.validation.min'))
            .max(128, t('profile.passwordForm.validation.max'))
            .notOneOf([Yup.ref('currentPassword')], t('profile.passwordForm.validation.newPassword.notOneOf')),
        confirmNewPassword: Yup.string()
            .required(t('profile.passwordForm.validation.confirmNewPassword.required'))
            .oneOf([Yup.ref('newPassword')], t('profile.passwordForm.validation.confirmNewPassword.oneOf')),
    });

const PasswordForm = () => {
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();
    const { loading: authLoading } = useSelector((state: IRootState) => state.auth);
    const PasswordSchema = getPasswordSchema(t);

    const handlePasswordSubmit = async (values: PasswordFormValues, { resetForm }: { resetForm: () => void }) => {
        try {
            await dispatch(
                changePassword({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                })
            ).unwrap();
            toast.success(t('profile.passwordForm.messages.success') as string);
            resetForm();
        } catch (err: any) {
            toast.error(err?.message || t('profile.passwordForm.messages.failed'));
        }
    };

    return (
        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
            <Formik initialValues={{ currentPassword: '', newPassword: '', confirmNewPassword: '' }} validationSchema={PasswordSchema} onSubmit={handlePasswordSubmit}>
                {() => (
                    <Form>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="sm:col-span-2">
                                <h6 className="text-lg font-semibold mb-5">{t('profile.passwordForm.title')}</h6>
                            </div>
                            <div>
                                <label>{t('profile.passwordForm.currentPassword.label')}</label>
                                <Field name="currentPassword" type="password" className="form-input" placeholder={t('profile.passwordForm.currentPassword.placeholder')} />
                                <ErrorMessage name="currentPassword" component="div" className="text-danger text-sm mt-1" />
                            </div>
                            <div></div>
                            <div>
                                <label>{t('profile.passwordForm.newPassword.label')}</label>
                                <Field name="newPassword" type="password" className="form-input" placeholder={t('profile.passwordForm.newPassword.placeholder')} />
                                <ErrorMessage name="newPassword" component="div" className="text-danger text-sm mt-1" />
                            </div>
                            <div>
                                <label>{t('profile.passwordForm.confirmNewPassword.label')}</label>
                                <Field name="confirmNewPassword" type="password" className="form-input" placeholder={t('profile.passwordForm.confirmNewPassword.placeholder')} />
                                <ErrorMessage name="confirmNewPassword" component="div" className="text-danger text-sm mt-1" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button type="submit" className="btn btn-primary" disabled={authLoading}>
                                {authLoading ? t('profile.passwordForm.button.loading') : t('profile.passwordForm.button.default')}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default PasswordForm;
