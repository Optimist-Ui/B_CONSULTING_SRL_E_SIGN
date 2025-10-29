import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Redux and Theme Imports
import { setPageTitle } from '../store/slices/themeConfigSlice';
import { AppDispatch } from '../store';

// Icon Imports
import IconMail from '../components/Icon/IconMail';

const PendingVerification = () => {
    const { t } = useTranslation();
    const dispatch: AppDispatch = useDispatch();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('pendingVerification.meta.title')));
        setIsVisible(true);
    }, [dispatch, t]);

    const brandingFeatures = [
        { icon: '🔒', titleKey: 'login.branding.features.encryption.title', descKey: 'login.branding.features.encryption.description' },
        { icon: '⚡', titleKey: 'login.branding.features.uptime.title', descKey: 'login.branding.features.uptime.description' },
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
                                        <h2 className="text-5xl font-bold text-white mb-4">{t('pendingVerification.branding.welcome')}</h2>
                                        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                    </Link>
                                </div>
                                <p className="text-xl text-gray-300 leading-relaxed">{t('pendingVerification.branding.description')}</p>
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

                    {/* Right side - Verification Message */}
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                            <div className="lg:hidden text-center mb-8">
                                <Link to="/">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                </Link>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                                        <IconMail className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-3xl md:text-4xl font-bold text-white">{t('pendingVerification.content.title')}</h1>
                                    <div className="h-1 w-20 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full"></div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                    <p className="text-gray-300 leading-relaxed">{t('pendingVerification.content.message')}</p>
                                </div>
                                <Link
                                    to="/login"
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform flex items-center justify-center gap-2 group"
                                >
                                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                    </svg>
                                    <span>{t('pendingVerification.content.button')}</span>
                                </Link>
                            </div>
                            <div className="mt-12 pt-6 border-t border-white/10 text-center text-sm text-gray-400">{t('pendingVerification.footer.copyright', { year: new Date().getFullYear() })}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingVerification;
