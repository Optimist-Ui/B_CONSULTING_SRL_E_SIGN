import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { useEffect, useState, ComponentType } from 'react';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

// Redux Imports for Authentication
import { signupUser } from '../store/thunk/authThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconUser from '../components/Icon/IconUser';
import IconMail from '../components/Icon/IconMail';
import IconEye from '../components/Icon/IconEye';
import { FaEyeSlash } from 'react-icons/fa';
const FaEyeSlashTyped = FaEyeSlash as ComponentType<{ className?: string }>;

// Validation Schema Function
const getValidationSchema = (t: (key: string) => string) =>
    Yup.object().shape({
        firstName: Yup.string()
            .min(2, t('register.validation.firstName.min'))
            .max(50, t('register.validation.firstName.max'))
            .matches(/^[a-zA-Z\s'-]+$/, t('register.validation.firstName.matches'))
            .required(t('register.validation.firstName.required')),
        lastName: Yup.string()
            .min(2, t('register.validation.lastName.min'))
            .max(50, t('register.validation.lastName.max'))
            .matches(/^[a-zA-Z\s'-]+$/, t('register.validation.lastName.matches'))
            .required(t('register.validation.lastName.required')),
        email: Yup.string().email(t('register.validation.email.invalid')).max(100, t('register.validation.email.max')).required(t('register.validation.email.required')),
        password: Yup.string().min(6, t('register.validation.password.min')).max(128, t('register.validation.password.max')).required(t('register.validation.password.required')),
    });

const Register = () => {
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();

    // Selectors for Redux state
    const { loading } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Component state
    const [flag, setFlag] = useState(locale);
    const [showPassword, setShowPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Initial form values
    const initialValues = { firstName: '', lastName: '', email: '', password: '' };

    useEffect(() => {
        dispatch(setPageTitle(t('register.meta.title')));
        setIsVisible(true);
    }, [dispatch, t]);

    // Handlers
    const setLocale = (newFlag: string) => {
        setFlag(newFlag);
        i18next.changeLanguage(newFlag);
        dispatch(toggleRTL(newFlag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
        try {
            const resultAction = await dispatch(signupUser(values)).unwrap();
            toast.success(resultAction.message || (t('register.messages.success') as string));
            navigate('/pending-verification');
        } catch (error: any) {
            toast.error(error || t('register.messages.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const brandingFeatures = [
        { icon: '🚀', titleKey: 'register.branding.features.setup.title', descKey: 'register.branding.features.setup.description' },
        { icon: '🔐', titleKey: 'register.branding.features.secure.title', descKey: 'register.branding.features.secure.description' },
        { icon: '💼', titleKey: 'register.branding.features.business.title', descKey: 'register.branding.features.business.description' },
    ];

    const validationSchema = getValidationSchema(t);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
            </div>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '500ms' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '700ms' }}></div>
            <div className="relative w-full max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div className={`hidden lg:block transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
                            <div className="space-y-8">
                                <div>
                                    <Link to="/" className="block">
                                        <h2 className="text-5xl font-bold text-white mb-4">{t('register.branding.welcome')}</h2>
                                        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                    </Link>
                                </div>
                                <p className="text-xl text-gray-300 leading-relaxed">{t('register.branding.description')}</p>
                                <div className="space-y-4 pt-8">
                                    {brandingFeatures.map((feature, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 transform"
                                        >
                                            <div className="text-3xl">{feature.icon}</div>
                                            <div>
                                                <h3 className="text-white font-semibold">{t(feature.titleKey)}</h3>
                                                <p className="text-gray-400 text-sm">{t(feature.descKey)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('register.form.header.title')}</h2>
                                    <p className="text-gray-300">{t('register.form.header.description')}</p>
                                </div>
                                <div className="dropdown ms-auto w-max">
                                    <Dropdown
                                        offset={[0, 8]}
                                        placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                        btnClassName="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-all duration-300"
                                        button={
                                            <>
                                                <div>
                                                    <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="flag" className="h-5 w-5 rounded-full object-cover" />
                                                </div>
                                                <div className="text-sm font-medium uppercase">{flag}</div>
                                                <span className="shrink-0">
                                                    <IconCaretDown />
                                                </span>
                                            </>
                                        }
                                    >
                                        <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                            {languageList.map((item: any) => (
                                                <li key={item.code}>
                                                    <button
                                                        type="button"
                                                        className={`flex w-full hover:text-primary rounded-lg p-2 ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                        onClick={() => setLocale(item.code)}
                                                    >
                                                        <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                        <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="lg:hidden text-center mb-8">
                                <Link to="/">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                </Link>
                            </div>
                            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                                {({ errors, touched, isSubmitting }) => (
                                    <Form className="space-y-5">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="text-white font-medium block">
                                                {t('register.form.firstName.label')}
                                            </label>
                                            <div className="relative group">
                                                <Field
                                                    id="firstName"
                                                    name="firstName"
                                                    type="text"
                                                    placeholder={t('register.form.firstName.placeholder')}
                                                    maxLength={50}
                                                    className={`w-full bg-white/10 border ${
                                                        errors.firstName && touched.firstName ? 'border-red-400' : 'border-white/20'
                                                    } rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                                                        errors.firstName && touched.firstName ? 'focus:ring-red-400' : 'focus:ring-blue-400'
                                                    } focus:border-transparent transition-all duration-300`}
                                                />
                                                <span
                                                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                                                        errors.firstName && touched.firstName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-400'
                                                    } transition-colors duration-300`}
                                                >
                                                    <IconUser fill={true} />
                                                </span>
                                            </div>
                                            <ErrorMessage name="firstName" component="p" className="text-red-400 text-sm mt-1 flex items-center gap-1" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="text-white font-medium block">
                                                {t('register.form.lastName.label')}
                                            </label>
                                            <div className="relative group">
                                                <Field
                                                    id="lastName"
                                                    name="lastName"
                                                    type="text"
                                                    placeholder={t('register.form.lastName.placeholder')}
                                                    maxLength={50}
                                                    className={`w-full bg-white/10 border ${
                                                        errors.lastName && touched.lastName ? 'border-red-400' : 'border-white/20'
                                                    } rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                                                        errors.lastName && touched.lastName ? 'focus:ring-red-400' : 'focus:ring-blue-400'
                                                    } focus:border-transparent transition-all duration-300`}
                                                />
                                                <span
                                                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                                                        errors.lastName && touched.lastName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-400'
                                                    } transition-colors duration-300`}
                                                >
                                                    <IconUser fill={true} />
                                                </span>
                                            </div>
                                            <ErrorMessage name="lastName" component="p" className="text-red-400 text-sm mt-1 flex items-center gap-1" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-white font-medium block">
                                                {t('register.form.email.label')}
                                            </label>
                                            <div className="relative group">
                                                <Field
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder={t('register.form.email.placeholder')}
                                                    maxLength={100}
                                                    className={`w-full bg-white/10 border ${
                                                        errors.email && touched.email ? 'border-red-400' : 'border-white/20'
                                                    } rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                                                        errors.email && touched.email ? 'focus:ring-red-400' : 'focus:ring-blue-400'
                                                    } focus:border-transparent transition-all duration-300`}
                                                />
                                                <span
                                                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                                                        errors.email && touched.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-400'
                                                    } transition-colors duration-300`}
                                                >
                                                    <IconMail fill={true} />
                                                </span>
                                            </div>
                                            <ErrorMessage name="email" component="p" className="text-red-400 text-sm mt-1 flex items-center gap-1" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="password" className="text-white font-medium block">
                                                {t('register.form.password.label')}
                                            </label>
                                            <div className="relative group">
                                                <Field
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder={t('register.form.password.placeholder')}
                                                    maxLength={128}
                                                    className={`w-full bg-white/10 border ${
                                                        errors.password && touched.password ? 'border-red-400' : 'border-white/20'
                                                    } rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                                                        errors.password && touched.password ? 'focus:ring-red-400' : 'focus:ring-blue-400'
                                                    } focus:border-transparent transition-all duration-300`}
                                                />
                                                <span
                                                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                                                        errors.password && touched.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-400'
                                                    } transition-colors duration-300`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                        />
                                                    </svg>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                                                >
                                                    {showPassword ? <FaEyeSlashTyped className="w-5 h-5" /> : <IconEye />}
                                                </button>
                                            </div>
                                            <ErrorMessage name="password" component="p" className="text-red-400 text-sm mt-1 flex items-center gap-1" />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || isSubmitting}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
                                        >
                                            {loading || isSubmitting ? (
                                                <>
                                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                                                    <span>{t('register.form.button.loading')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{t('register.form.button.default')}</span>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </Form>
                                )}
                            </Formik>
                            <div className="mt-8 text-center">
                                <p className="text-gray-300">
                                    {t('register.form.signin.prompt')}{' '}
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300">
                                        {t('register.form.signin.link')}
                                    </Link>
                                </p>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">{t('register.footer.copyright', { year: new Date().getFullYear() })}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
