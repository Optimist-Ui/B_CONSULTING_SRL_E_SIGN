import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HomeFeatures = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    const navigate = useNavigate();

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
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            titleKey: 'features.list.legallyBinding.title',
            descriptionKey: 'features.list.legallyBinding.description',
            color: 'from-green-400 to-green-600',
        },
        {
            id: 2,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            titleKey: 'features.list.bankSecurity.title',
            descriptionKey: 'features.list.bankSecurity.description',
            color: 'from-blue-400 to-blue-600',
        },
        {
            id: 3,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            titleKey: 'features.list.lightningFast.title',
            descriptionKey: 'features.list.lightningFast.description',
            color: 'from-yellow-400 to-orange-500',
        },
        {
            id: 4,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            titleKey: 'features.list.mobileOptimized.title',
            descriptionKey: 'features.list.mobileOptimized.description',
            color: 'from-purple-400 to-purple-600',
        },
        {
            id: 5,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
            titleKey: 'features.list.multiPartySigning.title',
            descriptionKey: 'features.list.multiPartySigning.description',
            color: 'from-indigo-400 to-indigo-600',
        },
        {
            id: 6,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            titleKey: 'features.list.auditTrail.title',
            descriptionKey: 'features.list.auditTrail.description',
            color: 'from-teal-400 to-teal-600',
        },
    ];

    const benefits = [
        {
            stat: '10x',
            labelKey: 'features.benefits.faster.label',
            descriptionKey: 'features.benefits.faster.description',
        },
        {
            stat: '99.9%',
            labelKey: 'features.benefits.uptime.label',
            descriptionKey: 'features.benefits.uptime.description',
        },
        {
            stat: '256-bit',
            labelKey: 'features.benefits.encryption.label',
            descriptionKey: 'features.benefits.encryption.description',
        },
        {
            stat: '24/7',
            labelKey: 'features.benefits.support.label',
            descriptionKey: 'features.benefits.support.description',
        },
    ];

    return (
        <section ref={sectionRef} className="py-20 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50/30"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full -translate-x-48 -translate-y-48"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/20 rounded-full translate-x-48 translate-y-48"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('features.tag')}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {t('features.title.main')}
                        <span className="block text-blue-600">{t('features.title.highlight')}</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('features.description')}</p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id}
                            className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100 ${
                                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            }`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                            }}
                        >
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>{feature.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{t(feature.titleKey)}</h3>
                            <p className="text-gray-600 leading-relaxed">{t(feature.descriptionKey)}</p>
                        </div>
                    ))}
                </div>

                {/* Benefits Stats */}
                <div
                    className={`bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-8 md:p-12 transition-all duration-1000 transform ${
                        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                >
                    <div className="text-center mb-10">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('features.benefits.title')}</h3>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t('features.benefits.description')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className={`text-center group transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                                style={{
                                    transitionDelay: `${(index + 6) * 100}ms`,
                                }}
                            >
                                <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">{benefit.stat}</div>
                                <div className="text-lg font-semibold text-white mb-2">{t(benefit.labelKey)}</div>
                                <div className="text-gray-300 text-sm">{t(benefit.descriptionKey)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className={`text-center mt-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/subscriptions')}
                            className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 transform"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {t('features.cta.startTrial')}
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </button>
                        <button className="group border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 hover:scale-105 transform">
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {t('features.cta.learnMore')}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeFeatures;
