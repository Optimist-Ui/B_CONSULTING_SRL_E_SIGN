import { useState, useRef, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Select from 'react-select';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { IRootState, AppDispatch } from '../../store';
import { updateUserProfile } from '../../store/thunk/authThunks';
import { languageOptions, LanguageOption } from './types';

interface ProfileFormValues {
    firstName: string;
    lastName: string;
    phone: string;
    language: LanguageOption | null;
    profileImage: File | null;
    email: string;
}

interface ProfileFormProps {
    user: any;
    onDeleteAccount: () => void;
}

const ProfileSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required').min(2).max(50),
    lastName: Yup.string().required('Last name is required').min(2).max(50),
    phone: Yup.string()
        .max(25, 'Phone number too long')
        .test('is-valid-phone', 'Invalid phone', (value) => !value || isValidPhoneNumber(value))
        .nullable(),
    language: Yup.object().nullable().required('Language is required'),
});

const ProfileForm = ({ user, onDeleteAccount }: ProfileFormProps) => {
    const dispatch: AppDispatch = useDispatch();
    const { loading: authLoading } = useSelector((state: IRootState) => state.auth);
    
    const [imagePreview, setImagePreview] = useState<string>('/assets/images/agent-1.png');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize image preview when user changes
    useState(() => {
        if (user?.profileImageUrl) {
            setImagePreview(user.profileImageUrl);
        } else if (user?.profileImage) {
            const backendUrl = import.meta.env.VITE_BASE_URL;
            setImagePreview(`${backendUrl}${user.profileImage}`);
        } else {
            setImagePreview('/assets/images/agent-1.png');
        }
    });

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setFieldValue('profileImage', file);
        }
    };

    const handleProfileSubmit = async (values: ProfileFormValues) => {
        try {
            await dispatch(
                updateUserProfile({
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phone: values.phone,
                    language: values.language?.value,
                    profileImage: values.profileImage,
                    email: user.email,
                })
            ).unwrap();
            toast.success('Profile updated!');
        } catch (err: any) {
            toast.error(err?.message || 'Update failed');
        }
    };

    const findLanguageOption = (lang?: string) => languageOptions.find((o) => o.value === lang) || null;

    return (
        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
            <Formik
                initialValues={{
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone || '',
                    language: findLanguageOption(user.language),
                    profileImage: null,
                    email: user.email,
                }}
                validationSchema={ProfileSchema}
                onSubmit={handleProfileSubmit}
                enableReinitialize
            >
                {({ setFieldValue, values }) => (
                    <Form>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1 text-center md:text-left">
                                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto md:mx-0">
                                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleImageChange(e, setFieldValue)} />
                                <div className="mt-4 flex justify-center md:justify-start gap-2">
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                                        Upload
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => {
                                            setImagePreview('/assets/images/user-profile.jpeg');
                                            setFieldValue('profileImage', null);
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label>First Name</label>
                                    <Field name="firstName" type="text" className="form-input" />
                                    <ErrorMessage name="firstName" component="div" className="text-danger text-sm mt-1" />
                                </div>
                                <div>
                                    <label>Last Name</label>
                                    <Field name="lastName" type="text" className="form-input" />
                                    <ErrorMessage name="lastName" component="div" className="text-danger text-sm mt-1" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label>Current Email</label>
                                    <Field name="email" type="email" className="form-input bg-gray-100 dark:bg-gray-800" value={user.email} disabled />
                                    <p className="text-xs text-gray-500 mt-1">
                                        To change your email, go to the <span className="text-primary">Email tab</span>
                                    </p>
                                </div>

                                <div>
                                    <label>Phone Number</label>
                                    <PhoneInput international defaultCountry="BE" className="form-input" value={values.phone} onChange={(v) => setFieldValue('phone', v || '')} />
                                    <ErrorMessage name="phone" component="div" className="text-danger text-sm mt-1" />
                                </div>
                                <div>
                                    <label>Language</label>
                                    <Select
                                        options={languageOptions}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        value={values.language}
                                        onChange={(opt: LanguageOption | null) => setFieldValue('language', opt)}
                                    />
                                    <ErrorMessage name="language" component="div" className="text-danger text-sm mt-1" />
                                </div>

                                <div className="sm:col-span-2 mt-3 flex flex-col sm:flex-row gap-3">
                                    <button type="submit" className="btn btn-primary" disabled={authLoading}>
                                        {authLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" className="btn btn-outline-danger" onClick={onDeleteAccount}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default ProfileForm;