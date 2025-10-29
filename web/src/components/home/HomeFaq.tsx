import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const HomeFaq = () => {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const faqData = Array.from({ length: 17 }, (_, i) => ({
        id: i + 1,
        questionKey: `faq.questions.q${i + 1}.question`,
        answerKey: `faq.questions.q${i + 1}.answer`,
    }));

    const visualFeatures = ['faq.visual.features.security', 'faq.visual.features.tracking', 'faq.visual.features.api', 'faq.visual.features.storage'];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const toggleAccordion = (index: number) => {
        setActiveIndex(activeIndex === index ? -1 : index);
    };

    const handleToggleShow = () => {
        setShowAll(!showAll);
        // Reset active index when collapsing to avoid showing a hidden FAQ's answer
        if (showAll) {
            setActiveIndex(0);
        }
    };

    const displayedFaqs = showAll ? faqData : faqData.slice(0, 4);

    return (
        <section id="faq" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Content Section */}
                    <div className="space-y-8">
                        {/* Section Header */}
                        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                                {t('faq.title.main')}
                                <span className="block text-blue-400">{t('faq.title.highlight')}</span>
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">{t('faq.description')}</p>
                        </div>

                        {/* FAQ Accordion */}
                        <div className="space-y-4">
                            {displayedFaqs.map((faq, index) => (
                                <div key={faq.id} className={`transition-all duration-700 delay-${index * 100} transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group">
                                        <button
                                            onClick={() => toggleAccordion(index)}
                                            className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none"
                                            aria-expanded={activeIndex === index}
                                            aria-controls={`faq-answer-${faq.id}`}
                                        >
                                            <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">{t(faq.questionKey)}</h3>
                                            <div className={`transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}>
                                                <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        <div
                                            id={`faq-answer-${faq.id}`}
                                            className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="px-6 pb-5">
                                                <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mb-4"></div>
                                                <p className="text-gray-300 leading-relaxed">{t(faq.answerKey)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-3 justify-center mt-6">
                                <button
                                    onClick={handleToggleShow}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {showAll ? t('faq.buttons.showLess') : t('faq.buttons.showMore')}
                                </button>
                                <a
                                    href="/digital-signatures-guide"
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/25 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-2"
                                >
                                    <span>{t('faq.buttons.learnMore')}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Visual Section */}
                    <div className={`lg:sticky lg:top-24 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
                        <div className="relative">
                            {/* Main visual container */}
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                                <div className="space-y-6">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-500/20 rounded-lg p-4 text-center border border-blue-400/20">
                                            <div className="text-2xl font-bold text-blue-400">99.9%</div>
                                            <div className="text-sm text-gray-300">{t('faq.visual.uptimeLabel')}</div>
                                        </div>
                                        <div className="bg-green-500/20 rounded-lg p-4 text-center border border-green-400/20">
                                            <div className="text-2xl font-bold text-green-400">{t('faq.visual.bindingValue')}</div>
                                            <div className="text-sm text-gray-300">{t('faq.visual.bindingLabel')}</div>
                                        </div>
                                    </div>

                                    {/* Feature list */}
                                    <div className="space-y-3">
                                        {visualFeatures.map((featureKey, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                <span className="text-gray-300">{t(featureKey)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div className="pt-4 border-t border-white/20">
                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 transform">
                                            {t('faq.visual.cta')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 rounded-full animate-bounce delay-300"></div>
                            <div className="absolute -bottom-6 -left-6 w-6 h-6 bg-purple-500/20 rounded-full animate-bounce delay-500"></div>
                            <div className="absolute top-1/2 -right-8 w-4 h-4 bg-green-500/20 rounded-full animate-bounce delay-700"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeFaq;
