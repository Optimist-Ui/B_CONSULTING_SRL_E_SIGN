import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import { IRootState, AppDispatch } from '../../store';
import { changePassword } from '../../store/thunk/authThunks';

interface PasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

const PasswordSchema = Yup.object().shape({
    currentPassword: Yup.string().required().min(6).max(128),
    newPassword: Yup.string()
        .required()
        .min(6)
        .max(128)
        .notOneOf([Yup.ref('currentPassword')], 'New password cannot be the same'),
    confirmNewPassword: Yup.string()
        .required()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const PasswordForm = () => {
    const dispatch: AppDispatch = useDispatch();
    const { loading: authLoading } = useSelector((state: IRootState) => state.auth);

    const handlePasswordSubmit = async (values: PasswordFormValues, { resetForm }: { resetForm: () => void }) => {
        try {
            await dispatch(
                changePassword({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                })
            ).unwrap();
            toast.success('Password changed!');
            resetForm();
        } catch (err: any) {
            toast.error(err?.message || 'Failed');
        }
    };

    return (
        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
            <Formik 
                initialValues={{ currentPassword: '', newPassword: '', confirmNewPassword: '' }} 
                validationSchema={PasswordSchema} 
                onSubmit={handlePasswordSubmit}
            >
                {() => (
                    <Form>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="sm:col-span-2">
                                <h6 className="text-lg font-semibold mb-5">Change Password</h6>
                            </div>
                            <div>
                                <label>Current Password</label>
                                <Field name="currentPassword" type="password" className="form-input" placeholder="Current" />
                                <ErrorMessage name="currentPassword" component="div" className="text-danger text-sm mt-1" />
                            </div>
                            <div></div>
                            <div>
                                <label>New Password</label>
                                <Field name="newPassword" type="password" className="form-input" placeholder="New" />
                                <ErrorMessage name="newPassword" component="div" className="text-danger text-sm mt-1" />
                            </div>
                            <div>
                                <label>Confirm New Password</label>
                                <Field name="confirmNewPassword" type="password" className="form-input" placeholder="Confirm" />
                                <ErrorMessage name="confirmNewPassword" component="div" className="text-danger text-sm mt-1" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button type="submit" className="btn btn-primary" disabled={authLoading}>
                                {authLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default PasswordForm;