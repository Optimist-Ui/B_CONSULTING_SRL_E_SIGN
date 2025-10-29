import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { useEffect, useState, FormEvent } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Redux Imports
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { requestPasswordReset } from '../store/thunk/authThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconMail from '../components/Icon/IconMail';

const ForgetPassword = () => {
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();

    // Select state from the Redux store
    const { loading } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Component state
    const [email, setEmail] = useState('');
    const [flag, setFlag] = useState(locale);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('forgotPassword.meta.title')));
        setIsVisible(true);
    }, [dispatch, t]);

    const setLocale = (newFlag: string) => {
        setFlag(newFlag);
        i18next.changeLanguage(newFlag);
        dispatch(toggleRTL(newFlag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(requestPasswordReset(email)).unwrap();
            toast.success(t('forgotPassword.messages.success') as string);
            setEmail('');
        } catch (error: any) {
            toast.error(error || t('forgotPassword.messages.error'));
        }
    };

    const brandingFeatures = [
        { icon: '🔐', titleKey: 'forgotPassword.branding.features.secure.title', descKey: 'forgotPassword.branding.features.secure.description' },
        { icon: '📧', titleKey: 'forgotPassword.branding.features.verification.title', descKey: 'forgotPassword.branding.features.verification.description' },
    ];

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
                                        <h2 className="text-5xl font-bold text-white mb-4">{t('forgotPassword.branding.welcome')}</h2>
                                        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                    </Link>
                                </div>
                                <p className="text-xl text-gray-300 leading-relaxed">{t('forgotPassword.branding.description')}</p>
                                <div className="space-y-2">
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
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('forgotPassword.form.header.title')}</h2>
                                    <p className="text-gray-300">{t('forgotPassword.form.header.description')}</p>
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
                                        {t('forgotPassword.form.email.label')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder={t('forgotPassword.form.email.placeholder')}
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                                            <span>{t('forgotPassword.form.button.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('forgotPassword.form.button.default')}</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                <div className="mt-6 text-center">
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300 inline-flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        {t('forgotPassword.form.backToLogin')}
                                    </Link>
                                </div>
                            </form>
                            <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">{t('forgotPassword.footer.copyright', { year: new Date().getFullYear() })}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword;
