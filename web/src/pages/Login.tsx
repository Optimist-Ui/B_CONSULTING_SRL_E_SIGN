import React, { useEffect, useState, ChangeEvent, FormEvent, ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IRootState, AppDispatch } from '../store';
import { toast } from 'react-toastify';

// Redux Imports
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { loginUser } from '../store/thunk/authThunks';
import { fetchSubscriptionStatus } from '../store/thunk/subscriptionThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconMail from '../components/Icon/IconMail';
import IconEye from '../components/Icon/IconEye';
import { FaEyeSlash } from 'react-icons/fa';
const FaEyeSlashTyped = FaEyeSlash as ComponentType<{ className?: string }>;

// Constants for localStorage keys
const REMEMBER_ME_KEY = 'rememberMe';
const SAVED_EMAIL_KEY = 'savedEmail';
const SAVED_PASSWORD_KEY = 'savedPassword';

const Login = () => {
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();

    // Select state from Redux store
    const { loading } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Component state
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [flag, setFlag] = useState(locale);
    const [showPassword, setShowPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('login.meta.title')));
        setIsVisible(true);

        // Load saved credentials on mount
        const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        if (savedRememberMe) {
            const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY) || '';
            const savedPassword = localStorage.getItem(SAVED_PASSWORD_KEY) || '';
            setFormData({ email: savedEmail, password: savedPassword });
            setRememberMe(true);
        }
    }, [dispatch, t]);

    // Handlers
    const setLocale = (newFlag: string) => {
        setFlag(newFlag);
        i18next.changeLanguage(newFlag);
        dispatch(toggleRTL(newFlag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleRememberMeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRememberMe(e.target.checked);
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(loginUser(formData)).unwrap();

            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem(REMEMBER_ME_KEY, 'true');
                localStorage.setItem(SAVED_EMAIL_KEY, formData.email);
                localStorage.setItem(SAVED_PASSWORD_KEY, formData.password);
            } else {
                // Clear saved credentials if remember me is unchecked
                localStorage.removeItem(REMEMBER_ME_KEY);
                localStorage.removeItem(SAVED_EMAIL_KEY);
                localStorage.removeItem(SAVED_PASSWORD_KEY);
            }

            const statusResult = await dispatch(fetchSubscriptionStatus()).unwrap();
            toast.success(t('login.messages.success') as string);

            if (statusResult.hasActiveSubscription) {
                navigate('/dashboard');
            } else {
                navigate('/subscriptions');
            }
        } catch (error: any) {
            toast.error(error || t('login.messages.error'));
        }
    };

    const brandingFeatures = [
        { icon: '🔒', titleKey: 'login.branding.features.encryption.title', descKey: 'login.branding.features.encryption.description' },
        { icon: '⚡', titleKey: 'login.branding.features.uptime.title', descKey: 'login.branding.features.uptime.description' },
        { icon: '✓', titleKey: 'login.branding.features.binding.title', descKey: 'login.branding.features.binding.description' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
            </div>

            {/* Floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '500ms' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '700ms' }}></div>

            <div className="relative w-full max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left side - Branding */}
                    <div className={`hidden lg:block transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
                            <div className="space-y-8">
                                <div>
                                    <Link to="/" className="block">
                                        <h2 className="text-5xl font-bold text-white mb-4">{t('login.branding.welcome')}</h2>
                                        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                    </Link>
                                </div>
                                <p className="text-xl text-gray-300 leading-relaxed">{t('login.branding.description')}</p>
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

                    {/* Right side - Login Form */}
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('login.form.header.title')}</h2>
                                    <p className="text-gray-300">{t('login.form.header.description')}</p>
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

                            <form onSubmit={submitForm} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-white font-medium block">
                                        {t('login.form.email.label')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder={t('login.form.email.placeholder')}
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-white font-medium block">
                                        {t('login.form.password.label')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={t('login.form.password.placeholder')}
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
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
                                </div>

                                {/* Remember Me and Forgot Password Row */}
                                <div className="flex items-center justify-between">
                                    <label htmlFor="rememberMe" className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input id="rememberMe" type="checkbox" checked={rememberMe} onChange={handleRememberMeChange} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-white/10 border border-white/20 rounded-full peer transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-cyan-600 peer-checked:border-transparent group-hover:border-blue-400/50"></div>
                                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-lg"></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">{t('login.form.rememberMe')}</span>
                                    </label>
                                    <Link to="/reset-password" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300 hover:underline">
                                        {t('login.form.forgotPassword')}
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                                            <span>{t('login.form.button.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('login.form.button.default')}</span>
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/20"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-slate-800 text-gray-400">{t('login.form.divider')}</span>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-gray-300">
                                    {t('login.form.signup.prompt')}{' '}
                                    <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300">
                                        {t('login.form.signup.link')}
                                    </Link>
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">{t('login.footer.copyright', { year: new Date().getFullYear() })}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
