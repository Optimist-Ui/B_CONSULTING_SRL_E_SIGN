import React, { useState, useEffect, ComponentType } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IRootState, AppDispatch } from '../../store/index';
import { logout } from '../../store/slices/authSlice';
import { toggleLocale, toggleRTL } from '../../store/slices/themeConfigSlice';
import { FiLogIn, FiUserPlus, FiX, FiGlobe, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useSubscription } from '../../store/hooks/useSubscription';
import { resetSubscriptionState } from '../../store/slices/subscriptionSlice';

const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiUserPlusTyped = FiUserPlus as ComponentType<{ className?: string }>;
const FiLogInTyped = FiLogIn as ComponentType<{ className?: string }>;
const FiGlobeTyped = FiGlobe as ComponentType<{ className?: string }>;
const FiChevronDownTyped = FiChevronDown as ComponentType<{ className?: string }>;

const HomeNavbar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { isAuthenticated } = useSelector((state: IRootState) => state.auth);
    const { locale, languageList } = useSelector((state: IRootState) => state.themeConfig);

    const { hasActiveSubscription } = useSubscription({
        autoFetchStatus: isAuthenticated,
        fetchOnMount: true,
    });

    useEffect(() => {
        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close language dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.language-dropdown')) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollToSection = (sectionId: string): void => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
        setIsMenuOpen(false);
    };

    const scrollToTop = (): void => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const handleDashboardNavigation = () => {
        if (hasActiveSubscription) {
            navigate('/dashboard');
        } else {
            navigate('/subscriptions');
        }
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setAuthModalOpen(false);
    };

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetSubscriptionState());
        toast.success(t('messages.logoutSuccess') as string);
        setIsMenuOpen(false);
        navigate('/');
    };

    const handleLanguageChange = (langCode: string) => {
        dispatch(toggleLocale(langCode));
        dispatch(toggleRTL(langCode.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
        setIsLangDropdownOpen(false);
    };

    // Get current language details
    const currentLanguage = languageList.find((lang: any) => lang.code === locale) || languageList.find((lang: any) => lang.code === 'en') || languageList[0];

    const renderAuthButtons = () => {
        if (isAuthenticated) {
            return (
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDashboardNavigation}
                        className="bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg text-sm lg:text-base"
                    >
                        {t('navbar.dashboard')}
                    </button>
                    <button onClick={handleLogout} className="hidden md:block text-gray-300 hover:text-white transition-colors">
                        {t('navbar.logout')}
                    </button>
                </div>
            );
        }
        return (
            <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm lg:text-base"
            >
                {t('navbar.signIn')}
            </button>
        );
    };

    const renderMobileAuthButtons = () => {
        if (isAuthenticated) {
            return (
                <>
                    <button onClick={handleDashboardNavigation} className="bg-blue-500 text-white font-medium block px-3 py-3 text-base text-center w-full rounded-md transition-all duration-200">
                        {t('navbar.goToDashboard')}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 mt-1 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                    >
                        {t('navbar.logout')}
                    </button>
                </>
            );
        }
        return (
            <button
                onClick={() => {
                    setAuthModalOpen(true);
                    setIsMenuOpen(false);
                }}
                className="bg-blue-500 text-white font-medium block px-3 py-3 text-base text-center w-full rounded-md transition-all duration-200 mt-2"
            >
                {t('navbar.loginRegister')}
            </button>
        );
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-slate-900/90'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0 cursor-pointer" onClick={scrollToTop}>
                            <img src="/logo-white.png" alt="logo" className="w-36" />
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-8">
                                <button
                                    onClick={() => scrollToTop()}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    {t('navbar.home')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => scrollToSection('pricing')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    {t('navbar.pricing')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => scrollToSection('about')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    {t('navbar.about')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => scrollToSection('faq')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    {t('navbar.faq')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => navigate('/digital-signatures-guide')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    {t('navbar.eidas')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => navigate('/terms-of-use')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    {t('navbar.termsAndPrivacy')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Language Switcher + Auth Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Language Switcher */}
                            <div className="relative language-dropdown">
                                <button
                                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                    className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-gray-300 hover:text-white transition-all duration-300"
                                >
                                    <img src={`/assets/images/flags/${currentLanguage.code.toUpperCase()}.svg`} alt={currentLanguage.name} className="h-4 w-4 rounded-full object-cover" />
                                    <span className="text-sm font-medium">{currentLanguage.name}</span>
                                    <FiChevronDownTyped className={`w-4 h-4 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Language Dropdown */}
                                {isLangDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl backdrop-blur-xl overflow-hidden z-50">
                                        <div className="p-2 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                                            {languageList.map((lang: any) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleLanguageChange(lang.code)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                                        locale === lang.code ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                                                    }`}
                                                >
                                                    <img src={`/assets/images/flags/${lang.code.toUpperCase()}.svg`} alt={lang.name} className="w-5 h-5 rounded-full object-cover" />
                                                    <span className="text-sm font-medium">{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {renderAuthButtons()}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800/50 backdrop-blur-sm rounded-b-lg mt-2">
                            {/* Mobile Language Selector */}
                            <div className="border-b border-slate-700/50 pb-3 mb-3">
                                <div className="flex items-center gap-2 px-3 py-2 text-gray-400 text-sm font-medium">
                                    <FiGlobeTyped className="w-4 h-4" />
                                    <span>Language</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 px-2">
                                    {languageList.slice(0, 6).map((lang: any) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                                locale === lang.code ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <img src={`/assets/images/flags/${lang.code.toUpperCase()}.svg`} alt={lang.name} className="w-4 h-4 rounded-full object-cover" />
                                            <span className="text-xs font-medium">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => scrollToSection('pricing')}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                {t('navbar.pricing')}
                            </button>
                            <button
                                onClick={() => scrollToSection('about')}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                {t('navbar.about')}
                            </button>
                            <button
                                onClick={() => scrollToSection('faq')}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                {t('navbar.faq')}
                            </button>
                            <button
                                onClick={() => {
                                    navigate('/terms-of-use');
                                    setIsMenuOpen(false);
                                }}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                {t('navbar.termsAndPrivacy')}
                            </button>
                            <div className="border-t border-slate-700/50 my-2"></div>
                            {renderMobileAuthButtons()}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Authentication Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div
                        className={`bg-slate-800 rounded-2xl shadow-2xl p-8 lg:p-10 w-full max-w-md transform transition-all duration-300 ${
                            isAuthModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">{t('authModal.title')}</h2>
                            <button onClick={() => setAuthModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <FiXTyped className="w-7 h-7" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-8 text-center">{t('authModal.description')}</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => handleNavigation('/login')}
                                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                            >
                                <FiLogInTyped />
                                {t('authModal.loginButton')}
                            </button>
                            <button
                                onClick={() => handleNavigation('/register')}
                                className="w-full flex items-center justify-center gap-3 bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-slate-600 transition-all duration-300"
                            >
                                <FiUserPlusTyped />
                                {t('authModal.registerButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HomeNavbar;
