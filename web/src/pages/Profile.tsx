import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

// UI, State Management, and Thunk Imports
import { IRootState, AppDispatch } from '../store';
import { setPageTitle } from '../store/slices/themeConfigSlice';
import { updateUserProfile, changePassword } from '../store/thunk/authThunks';

// Library Imports
import Select from 'react-select';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Important: Import library styles

// Type Definitions
interface LanguageOption {
    value: string;
    label: string;
}

interface ProfileFormValues {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    language: LanguageOption | null;
    profileImage: File | null;
}

interface PasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

// Data for language dropdown
const languageOptions: LanguageOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'it', label: 'Italiano (Italian)' },
];

const Profile = () => {
    const dispatch: AppDispatch = useDispatch();
    const { user, loading: authLoading } = useSelector((state: IRootState) => state.auth);

    useEffect(() => {
        dispatch(setPageTitle('Account Settings'));
    }, [dispatch]);

    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [imagePreview, setImagePreview] = useState<string>('/assets/images/agent-1.png');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // This is the new effect that constructs the full, correct URL
    useEffect(() => {
        if (user?.profileImage) {
            // Define your backend's base URL. In a real app, use an environment variable.
            const backendUrl = import.meta.env.VITE_BASE_URL;

            // Prepend the backend URL to the relative path from the API response
            setImagePreview(`${backendUrl}${user.profileImage}`);
        } else {
            // Fallback to the default local image if the user has no profile picture
            setImagePreview('/assets/images/agent-1.png');
        }
    }, [user]);

    // --- Formik Schemas ---
    const ProfileSchema = Yup.object().shape({
        firstName: Yup.string().required('First name is required').min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),

        lastName: Yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),

        email: Yup.string().email('Invalid email format').required('Email is required').max(254, 'Email cannot exceed 254 characters'),

        phone: Yup.string()
            .max(25, 'Phone number seems too long')
            .test('is-valid-phone', 'Phone number is not valid', (value) => !value || isValidPhoneNumber(value || ''))
            .nullable(),

        language: Yup.object().nullable().required('Language is required'),
    });

    // --- Password Validation Schema ---
    const PasswordSchema = Yup.object().shape({
        currentPassword: Yup.string().required('Current password is required').min(6, 'Password must be at least 6 characters').max(128, 'Password cannot exceed 128 characters'),

        newPassword: Yup.string()
            .required('New password is required')
            .min(6, 'Password must be at least 6 characters')
            .max(128, 'Password cannot exceed 128 characters')
            .notOneOf([Yup.ref('currentPassword')], 'New password cannot be the same as the current one'),

        confirmNewPassword: Yup.string()
            .required('Please confirm your new password')
            .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
    });

    // --- Event Handlers ---
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
                    email: values.email,
                    phone: values.phone,
                    language: values.language?.value,
                    profileImage: values.profileImage,
                })
            ).unwrap();
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error || 'Failed to update profile.');
        }
    };

    const handlePasswordSubmit = async (values: PasswordFormValues, { resetForm }: { resetForm: () => void }) => {
        try {
            await dispatch(
                changePassword({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                })
            ).unwrap();
            toast.success('Password changed successfully!');
            resetForm();
        } catch (error: any) {
            toast.error(error || 'Failed to change password. Please check your current password.');
        }
    };

    // --- Helper ---
    const findLanguageOption = (langCode?: string): LanguageOption | null => {
        return languageOptions.find((opt) => opt.value === langCode) || null;
    };

    // Show a loading state until the user data is fetched
    if (!user) {
        return <div className="p-6 font-semibold text-lg">Loading...</div>;
    }

    return (
        <div>
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Account Settings</h5>
            <div className="mb-5">
                <div className="border-b border-[#ebedf2] dark:border-[#191e3a]">
                    <ul className="flex font-semibold">
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`p-4 py-3 border-b-2 border-transparent hover:border-primary hover:text-primary ${activeTab === 'profile' ? '!border-primary text-primary' : ''}`}
                            >
                                Profile
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`p-4 py-3 border-b-2 border-transparent hover:border-primary hover:text-primary ${activeTab === 'password' ? '!border-primary text-primary' : ''}`}
                            >
                                Password
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {activeTab === 'profile' && (
                <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
                    <Formik
                        initialValues={{
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            phone: user.phone || '',
                            language: findLanguageOption(user.language),
                            profileImage: null,
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
                                            <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
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
                                            <label htmlFor="firstName">First Name</label>
                                            <Field name="firstName" type="text" id="firstName" className="form-input" />
                                            <ErrorMessage name="firstName" component="div" className="text-danger text-sm mt-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName">Last Name</label>
                                            <Field name="lastName" type="text" id="lastName" className="form-input" />
                                            <ErrorMessage name="lastName" component="div" className="text-danger text-sm mt-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="email">Email</label>
                                            <Field name="email" type="email" id="email" className="form-input" />
                                            <ErrorMessage name="email" component="div" className="text-danger text-sm mt-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="phone">Phone Number</label>
                                            <PhoneInput
                                                name="phone"
                                                international
                                                defaultCountry="BE"
                                                className="form-input"
                                                value={values.phone}
                                                onChange={(value) => setFieldValue('phone', value || '')}
                                            />
                                            <ErrorMessage name="phone" component="div" className="text-danger text-sm mt-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="language">Language</label>
                                            <Select
                                                name="language"
                                                options={languageOptions}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                value={values.language}
                                                onChange={(option: LanguageOption | null) => setFieldValue('language', option)}
                                            />
                                            <ErrorMessage name="language" component="div" className="text-danger text-sm mt-1" />
                                        </div>
                                        <div className="sm:col-span-2 mt-3">
                                            <button type="submit" className="btn btn-primary" disabled={authLoading}>
                                                {authLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}

            {activeTab === 'password' && (
                <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 sm:p-6 bg-white dark:bg-black">
                    <Formik initialValues={{ currentPassword: '', newPassword: '', confirmNewPassword: '' }} validationSchema={PasswordSchema} onSubmit={handlePasswordSubmit}>
                        {() => (
                            <Form>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="sm:col-span-2">
                                        <h6 className="text-lg font-semibold mb-5">Change Password</h6>
                                    </div>
                                    <div>
                                        <label htmlFor="currentPassword">Current Password</label>
                                        <Field name="currentPassword" type="password" id="currentPassword" className="form-input" placeholder="Enter current password" />
                                        <ErrorMessage name="currentPassword" component="div" className="text-danger text-sm mt-1" />
                                    </div>
                                    <div></div>
                                    <div>
                                        <label htmlFor="newPassword">New Password</label>
                                        <Field name="newPassword" type="password" id="newPassword" className="form-input" placeholder="Enter new password" />
                                        <ErrorMessage name="newPassword" component="div" className="text-danger text-sm mt-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmNewPassword">Confirm New Password</label>
                                        <Field name="confirmNewPassword" type="password" id="confirmNewPassword" className="form-input" placeholder="Confirm new password" />
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
            )}
        </div>
    );
};

export default Profile;
