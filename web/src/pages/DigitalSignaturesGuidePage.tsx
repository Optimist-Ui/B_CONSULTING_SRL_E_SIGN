import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DigitalSignaturesGuidePage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', labelKey: 'eidasGuide.tabs.overview', icon: '📋' },
        { id: 'ses', labelKey: 'eidasGuide.tabs.ses', icon: '✍️' },
        { id: 'aes', labelKey: 'eidasGuide.tabs.aes', icon: '🔐' },
        { id: 'qes', labelKey: 'eidasGuide.tabs.qes', icon: '🏆' },
        { id: 'faqs', labelKey: 'eidasGuide.tabs.faqs', icon: '❓' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
            <div className="max-w-6xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <Link to="/#faq" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('eidasGuide.header.backLink')}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('eidasGuide.header.title')}</h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('eidasGuide.header.subtitle')}</p>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-fit px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {t(tab.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <div className="prose prose-invert max-w-none">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">{t('eidasGuide.content.overview.title')}</h2>
                                    <p className="text-gray-300 leading-relaxed mb-4">{t('eidasGuide.content.overview.p1')}</p>
                                    <p className="text-gray-300 leading-relaxed">
                                        {t('eidasGuide.content.overview.p2_prefix')}{' '}
                                        <a
                                            href="https://en.wikipedia.org/wiki/Public_key_infrastructure"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline"
                                        >
                                            {t('eidasGuide.content.overview.p2_link')}
                                        </a>
                                        , {t('eidasGuide.content.overview.p2_suffix')}
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.overview.comparison.title')}</h3>
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        <strong className="text-white">{t('eidasGuide.content.overview.comparison.p1_strong')}</strong> {t('eidasGuide.content.overview.comparison.p1_text')}
                                    </p>
                                    <p className="text-gray-300 leading-relaxed">
                                        <strong className="text-white">{t('eidasGuide.content.overview.comparison.p2_strong')}</strong>, {t('eidasGuide.content.overview.comparison.p2_text')}
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.overview.types.title')}</h3>
                                    <p className="text-gray-300 leading-relaxed mb-6">{t('eidasGuide.content.overview.types.description')}</p>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-400/20">
                                            <div className="text-4xl mb-3">✍️</div>
                                            <h4 className="font-bold text-white mb-2">{t('eidasGuide.content.overview.types.ses.title')}</h4>
                                            <p className="text-sm text-gray-300">{t('eidasGuide.content.overview.types.ses.description')}</p>
                                        </div>
                                        <div className="bg-green-500/20 rounded-lg p-6 border border-green-400/20">
                                            <div className="text-4xl mb-3">🔐</div>
                                            <h4 className="font-bold text-white mb-2">{t('eidasGuide.content.overview.types.aes.title')}</h4>
                                            <p className="text-sm text-gray-300">{t('eidasGuide.content.overview.types.aes.description')}</p>
                                        </div>
                                        <div className="bg-purple-500/20 rounded-lg p-6 border border-purple-400/20">
                                            <div className="text-4xl mb-3">🏆</div>
                                            <h4 className="font-bold text-white mb-2">{t('eidasGuide.content.overview.types.qes.title')}</h4>
                                            <p className="text-sm text-gray-300">{t('eidasGuide.content.overview.types.qes.description')}</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-6 mt-8">
                                    <p className="text-gray-300 text-sm italic">
                                        💡 <strong className="font-semibold">{t('eidasGuide.content.overview.tip.strong')}</strong> {t('eidasGuide.content.overview.tip.text')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ses' && (
                            <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">✍️</span>
                                        <h2 className="text-2xl font-bold text-white">{t('eidasGuide.content.ses.title')}</h2>
                                    </div>
                                    <p className="text-lg text-blue-400 mb-6">{t('eidasGuide.content.ses.subtitle')}</p>
                                    <p className="text-gray-300 leading-relaxed mb-4">{t('eidasGuide.content.ses.p1')}</p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.ses.howItWorks.title')}</h3>
                                    <p className="text-gray-300 mb-4">{t('eidasGuide.content.ses.howItWorks.p1')}</p>
                                    <ul className="space-y-2 text-gray-300">
                                        {[1, 2, 3].map((i) => (
                                            <li key={i} className="flex items-start">
                                                <span className="text-blue-400 mr-2">•</span>
                                                {t(`eidasGuide.content.ses.howItWorks.li${i}`)}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.ses.useCases.title')}</h3>
                                    <p className="text-gray-300 mb-4">{t('eidasGuide.content.ses.useCases.p1')}</p>
                                    <div className="grid md:grid-cols-3 gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
                                                <p className="text-gray-300 text-sm">{t(`eidasGuide.content.ses.useCases.item${i}`)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="bg-yellow-900/30 border border-yellow-400/30 rounded-lg p-6">
                                    <p className="text-gray-300 text-sm">
                                        ⚠️ <strong className="font-semibold">{t('eidasGuide.content.ses.warning.strong')}</strong> {t('eidasGuide.content.ses.warning.text')}
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                                        {t('eidasGuide.content.ses.learnMoreLink')}
                                    </a>
                                </div>
                            </div>
                        )}

                        {activeTab === 'aes' && (
                            <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">🔐</span>
                                        <h2 className="text-2xl font-bold text-white">{t('eidasGuide.content.aes.title')}</h2>
                                    </div>
                                    <p className="text-lg text-green-400 mb-6">{t('eidasGuide.content.aes.subtitle')}</p>
                                    <p className="text-gray-300 leading-relaxed mb-4">{t('eidasGuide.content.aes.p1')}</p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.aes.requirements.title')}</h3>
                                    <p className="text-gray-300 mb-4">{t('eidasGuide.content.aes.requirements.p1')}</p>
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <span className="text-green-400 text-sm">✓</span>
                                                </div>
                                                <p className="text-gray-300">{t(`eidasGuide.content.aes.requirements.li${i}`)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.aes.authMethods.title')}</h3>
                                    <p className="text-gray-300 mb-4">{t('eidasGuide.content.aes.authMethods.p1')}</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                                                <h4 className="font-semibold text-white mb-2">{t(`eidasGuide.content.aes.authMethods.item${i}.title`)}</h4>
                                                <p className="text-gray-300 text-sm">{t(`eidasGuide.content.aes.authMethods.item${i}.description`)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-green-900/30 border border-green-400/30 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">{t('eidasGuide.content.aes.benefits.title')}</h3>
                                    <ul className="space-y-2 text-gray-300">
                                        {[1, 2, 3].map((i) => (
                                            <li key={i} className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                {t(`eidasGuide.content.aes.benefits.li${i}`)}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.aes.example.title')}</h3>
                                    <div className="bg-slate-800/50 rounded-lg p-6">
                                        <p className="text-gray-300">
                                            {t('eidasGuide.content.aes.example.p1_prefix')} <strong className="text-white">{t('eidasGuide.content.aes.example.p1_strong1')}</strong>{' '}
                                            {t('eidasGuide.content.aes.example.p1_connector')} <strong className="text-white">{t('eidasGuide.content.aes.example.p1_strong2')}</strong>,{' '}
                                            {t('eidasGuide.content.aes.example.p1_suffix')}
                                        </p>
                                    </div>
                                </section>

                                <div className="pt-6">
                                    <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                                        {t('eidasGuide.content.aes.learnMoreLink')}
                                    </a>
                                </div>
                            </div>
                        )}

                        {activeTab === 'qes' && (
                            <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">🏆</span>
                                        <h2 className="text-2xl font-bold text-white">{t('eidasGuide.content.qes.title')}</h2>
                                    </div>
                                    <p className="text-lg text-purple-400 mb-6">{t('eidasGuide.content.qes.subtitle')}</p>
                                    <p className="text-gray-300 leading-relaxed mb-4">{t('eidasGuide.content.qes.p1')}</p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.qes.foundation.title')}</h3>
                                    <p className="text-gray-300 mb-4">
                                        {t('eidasGuide.content.qes.foundation.p1_prefix')} <strong className="text-white">{t('eidasGuide.content.qes.foundation.p1_strong')}</strong>{' '}
                                        {t('eidasGuide.content.qes.foundation.p1_suffix')}
                                    </p>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <span className="text-purple-400 text-sm">★</span>
                                                </div>
                                                <p className="text-gray-300">{t(`eidasGuide.content.qes.foundation.li${i}`)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="bg-purple-900/30 border border-purple-400/30 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">{t('eidasGuide.content.qes.equivalence.title')}</h3>
                                    <p className="text-gray-300 mb-3">
                                        {t('eidasGuide.content.qes.equivalence.p1_prefix')} <strong className="text-white">{t('eidasGuide.content.qes.equivalence.p1_strong')}</strong>{' '}
                                        {t('eidasGuide.content.qes.equivalence.p1_suffix')}
                                    </p>
                                    <p className="text-gray-300 text-sm">{t('eidasGuide.content.qes.equivalence.p2')}</p>
                                </div>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">{t('eidasGuide.content.qes.useCases.title')}</h3>
                                    <p className="text-gray-300 mb-4">{t('eidasGuide.content.qes.useCases.p1')}</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/20 flex items-center gap-3">
                                                <span className="text-2xl">{t(`eidasGuide.content.qes.useCases.item${i}.icon`)}</span>
                                                <p className="text-gray-300">{t(`eidasGuide.content.qes.useCases.item${i}.text`)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'faqs' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white mb-6">{t('eidasGuide.content.faqs.title')}</h2>
                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">{t('eidasGuide.content.faqs.q1.title')}</h3>
                                    <p className="text-gray-300 leading-relaxed">{t('eidasGuide.content.faqs.q1.p1')}</p>
                                    <p className="text-gray-300 leading-relaxed mt-3">{t('eidasGuide.content.faqs.q1.p2')}</p>
                                </section>
                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">{t('eidasGuide.content.faqs.q2.title')}</h3>
                                    <p className="text-gray-300 leading-relaxed">{t('eidasGuide.content.faqs.q2.p1')}</p>
                                    <p className="text-gray-300 leading-relaxed mt-3">{t('eidasGuide.content.faqs.q2.p2')}</p>
                                </section>
                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">{t('eidasGuide.content.faqs.q3.title')}</h3>
                                    <p className="text-gray-300 leading-relaxed">{t('eidasGuide.content.faqs.q3.p1')}</p>
                                    <ul className="mt-3 space-y-2 text-gray-300">
                                        {[1, 2, 3].map((i) => (
                                            <li key={i} className="flex items-start">
                                                <span className="text-blue-400 mr-2">•</span>
                                                {t(`eidasGuide.content.faqs.q3.li${i}`)}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-gray-300 leading-relaxed mt-3">{t('eidasGuide.content.faqs.q3.p2')}</p>
                                </section>
                                <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-6 mt-8">
                                    <p className="text-gray-300 text-sm">
                                        <strong className="text-white">{t('eidasGuide.content.faqs.contact.strong')}</strong> {t('eidasGuide.content.faqs.contact.text_prefix')}{' '}
                                        <Link to="/#faq" className="text-blue-400 hover:text-blue-300 underline">
                                            {t('eidasGuide.content.faqs.contact.link')}
                                        </Link>{' '}
                                        {t('eidasGuide.content.faqs.contact.text_suffix')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 pt-6 border-t border-white/20">
                        <div className="bg-slate-800/50 rounded-lg p-6">
                            <p className="text-gray-400 text-sm italic">
                                ⚖️ <strong className="font-semibold">{t('eidasGuide.disclaimer.title')}</strong> {t('eidasGuide.disclaimer.text')}
                            </p>
                        </div>
                        <p className="text-gray-400 text-sm mt-4 text-center">{t('eidasGuide.lastUpdated', { date: new Date().toLocaleDateString() })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalSignaturesGuidePage;
