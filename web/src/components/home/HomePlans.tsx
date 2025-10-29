import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPlans } from '../../store/thunk/planThunks';
import { IRootState, AppDispatch } from '../../store';

// A simple loading spinner component for better UX
const Spinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);

const HomePlans = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { plans: rawPlans, loading, error } = useSelector((state: IRootState) => state.plans);

    const [isVisible, setIsVisible] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const sectionRef = useRef(null);

    // Fetch plans from the API when the component mounts
    useEffect(() => {
        dispatch(fetchPlans());
    }, [dispatch]);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );

        const currentRef = sectionRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    // Prepare plan data for rendering by merging API data with static UI enhancements
    const plans = useMemo(() => {
        const planOrder = ['Starter', 'Pro', 'Enterprise'];

        return rawPlans
            .map((plan) => {
                let uiData = {
                    descriptionKey: '',
                    isPopular: false,
                    gradient: 'from-gray-500 to-gray-700',
                    isEnterprise: plan.name === 'Enterprise',
                };
                switch (plan.name) {
                    case 'Starter':
                        uiData.descriptionKey = 'pricing.plans.starter.description';
                        uiData.gradient = 'from-teal-500 to-teal-700';
                        break;
                    case 'Pro':
                        uiData.descriptionKey = 'pricing.plans.pro.description';
                        uiData.isPopular = true;
                        uiData.gradient = 'from-blue-500 to-blue-700';
                        break;
                    case 'Enterprise':
                        uiData.descriptionKey = 'pricing.plans.enterprise.description';
                        uiData.gradient = 'from-purple-500 to-purple-700';
                        break;
                }
                return { ...plan, ...uiData };
            })
            .sort((a, b) => planOrder.indexOf(a.name) - planOrder.indexOf(b.name));
    }, [rawPlans, t]);

    return (
        <section id="pricing" ref={sectionRef} className="py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
            {/* Enhanced background decoration */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/15 to-transparent rounded-full -translate-x-1/3 translate-y-1/3"></div>
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-50/30 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Enhanced Section Header */}
                <div className={`text-center mb-20 transition-all duration-1200 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-full text-sm font-semibold mb-6 shadow-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                        </svg>
                        {t('pricing.tag')}
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        {t('pricing.title.main')}
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('pricing.title.highlight')}</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">{t('pricing.description')}</p>

                    {/* Enhanced Billing Toggle */}
                    <div
                        className={`inline-flex items-center bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-1.5 shadow-lg transition-all duration-1000 delay-500 ease-out transform ${
                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                    >
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-8 py-3 rounded-xl text-base font-semibold transition-all duration-300 ease-out ${
                                !isYearly ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('pricing.billing.monthly')}
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-8 py-3 rounded-xl text-base font-semibold transition-all duration-300 ease-out relative ${
                                isYearly ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('pricing.billing.yearly')}
                            <span className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                {t('pricing.billing.save')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Conditional Rendering for Loading/Error/Success states */}
                {loading ? (
                    <Spinner />
                ) : error ? (
                    <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
                        {plans.map((plan, index) => (
                            <div
                                key={plan._id}
                                className={`group relative transition-all duration-1000 ease-out transform-gpu ${
                                    isVisible ? 'rotateY-0 opacity-100 translate-y-0' : 'rotateY-180 opacity-0 translate-y-8'
                                }`}
                                style={{ transitionDelay: `${index * 300 + 700}ms`, transformStyle: 'preserve-3d' }}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                                        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-xl border-4 border-white">
                                            {t('pricing.plans.popularBadge')}
                                        </div>
                                    </div>
                                )}
                                <div
                                    className={`relative flex flex-col bg-white/90 backdrop-blur-xl border rounded-3xl overflow-hidden h-full transition-all duration-700 ease-out hover:-translate-y-8 hover:shadow-2xl hover:shadow-blue-600/20 group-hover:bg-gradient-to-br group-hover:from-slate-900 group-hover:via-slate-800 group-hover:to-blue-900 ${
                                        plan.isPopular ? 'border-blue-400 shadow-xl shadow-blue-600/10 ring-2 ring-blue-400/20' : 'border-gray-200/50 shadow-lg hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="p-8 pb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white transition-all duration-500">{plan.name}</h3>
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-500 leading-relaxed min-h-[4rem]">{t(plan.descriptionKey)}</p>
                                    </div>

                                    {!plan.isEnterprise && (
                                        <div className="px-8 py-6 bg-gradient-to-r from-gray-50/80 to-blue-50/40 group-hover:from-white/10 group-hover:to-blue-400/10 transition-all duration-500 border-y border-gray-100/50 group-hover:border-white/20">
                                            <div className="flex items-baseline justify-center">
                                                <span className="text-5xl font-bold text-gray-900 group-hover:text-white transition-colors duration-500">
                                                    €{isYearly ? (plan.yearlyPrice / 12).toFixed(0) : plan.monthlyPrice}
                                                </span>
                                                <span className="ml-1 text-xl font-medium text-gray-500 group-hover:text-gray-300">{t('pricing.plans.perMonth')}</span>
                                            </div>
                                            {isYearly && (
                                                <p className="text-center text-sm text-gray-500 group-hover:text-gray-400 mt-1">{t('pricing.plans.billedYearly', { price: plan.yearlyPrice })}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-8 pt-6 flex-grow">
                                        <ul className="space-y-4">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 group-hover:bg-green-400 flex items-center justify-center mr-4 mt-0.5 transition-all duration-300">
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-gray-700 group-hover:text-gray-200 transition-colors duration-500 font-medium leading-relaxed">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-8 pt-4">
                                        {plan.isEnterprise ? (
                                            <button
                                                onClick={() => navigate('/enterprise-contact')}
                                                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-blue-600 hover:to-blue-700 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 transform hover:shadow-lg"
                                            >
                                                {t('pricing.buttons.contactSales')}
                                            </button>
                                        ) : plan.monthlyPrice === 0 ? (
                                            <button
                                                onClick={() => navigate('/subscriptions')}
                                                className="w-full border-2 border-blue-600 text-blue-600 group-hover:border-white group-hover:text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 transform hover:shadow-lg"
                                            >
                                                {t('pricing.buttons.startFree')}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate('/subscriptions')}
                                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 transform shadow-lg ${
                                                    plan.isPopular
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white group-hover:bg-white group-hover:text-blue-600 group-hover:from-white group-hover:to-white'
                                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white group-hover:bg-white group-hover:text-blue-600 group-hover:from-white group-hover:to-white'
                                                }`}
                                            >
                                                {t('pricing.buttons.startTrial')}
                                            </button>
                                        )}
                                        <p className="text-center text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-500 mt-4 font-medium">{t('pricing.footerNotice')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`text-center mt-20 transition-all duration-1200 delay-1200 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 shadow-xl max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('pricing.enterpriseCta.title')}</h3>
                        <p className="text-gray-600 mb-6 text-lg">{t('pricing.enterpriseCta.description')}</p>
                        <button
                            onClick={() => navigate('/enterprise-contact')}
                            className="group bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-blue-600 hover:to-blue-700 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 transform hover:shadow-xl"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                {t('pricing.enterpriseCta.button')}
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .rotateY-0 { transform: rotateY(0deg); }
                .rotateY-180 { transform: rotateY(180deg); }
                .bg-gradient-radial { background: radial-gradient(circle, var(--tw-gradient-stops)); }
            `}</style>
        </section>
    );
};

export default HomePlans;
