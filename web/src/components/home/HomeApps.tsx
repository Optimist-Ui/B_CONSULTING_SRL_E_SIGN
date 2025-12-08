import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const HomeApps = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const features = [
        {
            id: 1,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            titleKey: 'apps.features.signAnywhere.title',
            descriptionKey: 'apps.features.signAnywhere.description',
        },
        {
            id: 2,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            titleKey: 'apps.features.emailSmsReminders.title',
            descriptionKey: 'apps.features.emailSmsReminders.description',
        },
        {
            id: 3,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            titleKey: 'apps.features.reassignment.title',
            descriptionKey: 'apps.features.reassignment.description',
        },
        {
            id: 4,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                </svg>
            ),
            titleKey: 'apps.features.otpVerification.title',
            descriptionKey: 'apps.features.otpVerification.description',
        },
    ];

    return (
        <section ref={sectionRef} className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/15 to-transparent rounded-full -translate-x-1/3 translate-y-1/3"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-full text-sm font-semibold mb-6 shadow-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {t('apps.tag')}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {t('apps.title.main')}
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('apps.title.highlight')}</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{t('apps.description')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                    {/* Mobile Phone Mockup */}
                    <div className={`flex justify-center transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                        <div className="relative">
                            {/* Phone Frame */}
                            <div className="relative w-72 h-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[3rem] p-3 shadow-2xl">
                                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                                    {/* Status Bar */}
                                    <div className="bg-slate-900 h-8 flex items-center justify-between px-6 text-white text-xs">
                                        <span>9:41</span>
                                        <div className="flex gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                            </svg>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* App Screen Content */}
                                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 h-full p-6">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-white font-bold text-lg">i-Sign EU</h3>
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Document Cards */}
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((item) => (
                                                <div key={item} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                                                <path d="M14 2v6h6" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="h-2 bg-white/30 rounded w-3/4 mb-2"></div>
                                                            <div className="h-1.5 bg-white/20 rounded w-1/2"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-white/60">PDF • {item}MB</span>
                                                        <span className="text-green-400 font-medium">Ready</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg">Sign Document</button>
                                    </div>
                                </div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/20 rounded-full animate-bounce"></div>
                            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce delay-300"></div>
                        </div>
                    </div>

                    {/* Features & Download Links */}
                    <div className={`transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {features.map((feature, index) => (
                                <div
                                    key={feature.id}
                                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">{feature.icon}</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-sm mb-1">{t(feature.titleKey)}</h4>
                                            <p className="text-gray-600 text-xs">{t(feature.descriptionKey)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Download Buttons */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('apps.download.title')}</h3>

                            {/* Google Play Button */}
                            <a
                                href="https://play.google.com/store/apps/details?id=com.isign.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-4 bg-black hover:bg-gray-900 text-white p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                </svg>
                                <div className="flex-1 text-left">
                                    <div className="text-xs text-gray-300">{t('apps.download.getItOn')}</div>
                                    <div className="text-lg font-bold">Google Play</div>
                                </div>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>

                            {/* App Store Button */}
                            <a
                                href="https://apps.apple.com/us/app/i-sign-eu/id6755054613"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-4 bg-black hover:bg-gray-900 text-white p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                                </svg>
                                <div className="flex-1 text-left">
                                    <div className="text-xs text-gray-300">{t('apps.download.downloadOn')}</div>
                                    <div className="text-lg font-bold">App Store</div>
                                </div>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>

                    </div>
                </div>

                {/* Bottom Stats */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.8★</div>
                        <div className="text-sm text-gray-600">{t('apps.stats.rating')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">100K+</div>
                        <div className="text-sm text-gray-600">{t('apps.stats.downloads')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">50+</div>
                        <div className="text-sm text-gray-600">{t('apps.stats.countries')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">24/7</div>
                        <div className="text-sm text-gray-600">{t('apps.stats.support')}</div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                .animate-bounce {
                    animation: bounce 3s ease-in-out infinite;
                }
                .delay-300 {
                    animation-delay: 0.3s;
                }
            `}</style>
        </section>
    );
};

export default HomeApps;
