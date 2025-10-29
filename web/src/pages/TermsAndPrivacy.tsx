import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TermsAndPrivacy = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('terms');
    const lastUpdatedDate = new Date().toLocaleDateString();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to={'/'}>
                        <h1 className="text-3xl font-bold text-blue-900 mb-2">I-sign.eu</h1>
                    </Link>
                    <p className="text-gray-600">{t('termsAndPrivacy.header.subtitle')}</p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('terms')}
                                className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 ${
                                    activeTab === 'terms' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('termsAndPrivacy.tabs.terms')}
                            </button>
                            <button
                                onClick={() => setActiveTab('privacy')}
                                className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 ${
                                    activeTab === 'privacy' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('termsAndPrivacy.tabs.privacy')}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm p-8">
                    {activeTab === 'terms' ? (
                        <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold text-blue-900 mb-6">{t('termsAndPrivacy.terms.title')}</h2>
                            <p className="text-gray-600 mb-6">{t('termsAndPrivacy.lastUpdated', { date: lastUpdatedDate })}</p>

                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.terms.introduction.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {t('termsAndPrivacy.terms.introduction.p1_prefix')}{' '}
                                        <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                            i-signs.eu
                                        </a>{' '}
                                        {t('termsAndPrivacy.terms.introduction.p1_suffix')}
                                    </p>
                                    <p className="text-gray-700 leading-relaxed mt-3">{t('termsAndPrivacy.terms.introduction.p2')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.terms.scope.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">{t('termsAndPrivacy.terms.scope.p1')}</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>
                                            <strong>{t('termsAndPrivacy.terms.scope.li1_strong')}</strong> — {t('termsAndPrivacy.terms.scope.li1_text')}{' '}
                                            <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                i-signs.eu
                                            </a>{' '}
                                            {t('termsAndPrivacy.terms.scope.li1_suffix')}
                                        </li>
                                        <li>
                                            <strong>{t('termsAndPrivacy.terms.scope.li2_strong')}</strong> — {t('termsAndPrivacy.terms.scope.li2_text')}{' '}
                                            <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                i-signs.eu
                                            </a>{' '}
                                            {t('termsAndPrivacy.terms.scope.li2_suffix')}
                                        </li>
                                        <li>
                                            <strong>{t('termsAndPrivacy.terms.scope.li3_strong')}</strong> — {t('termsAndPrivacy.terms.scope.li3_text')}{' '}
                                            <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                i-signs.eu
                                            </a>{' '}
                                            {t('termsAndPrivacy.terms.scope.li3_suffix')}
                                        </li>
                                    </ul>
                                    <p className="text-gray-700 leading-relaxed mt-3">
                                        {t('termsAndPrivacy.terms.scope.p2_prefix')}{' '}
                                        <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                            i-signs.eu
                                        </a>
                                        , {t('termsAndPrivacy.terms.scope.p2_suffix')}
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.terms.compliance.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.terms.compliance.p1')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.terms.acceptance.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">{t('termsAndPrivacy.terms.acceptance.p1')}</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>{t('termsAndPrivacy.terms.acceptance.li1')}</li>
                                        <li>{t('termsAndPrivacy.terms.acceptance.li2')}</li>
                                        <li>{t('termsAndPrivacy.terms.acceptance.li3')}</li>
                                    </ul>
                                    <p className="text-gray-700 leading-relaxed mt-3">{t('termsAndPrivacy.terms.acceptance.p2')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.terms.access.title')}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">{t('termsAndPrivacy.terms.access.eligibility.title')}</h4>
                                            <p className="text-gray-700 leading-relaxed mb-3">
                                                {t('termsAndPrivacy.terms.access.eligibility.p1_prefix')}{' '}
                                                <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                    i-signs.eu
                                                </a>{' '}
                                                {t('termsAndPrivacy.terms.access.eligibility.p1_suffix')}
                                            </p>
                                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                                <li>{t('termsAndPrivacy.terms.access.eligibility.li1')}</li>
                                                <li>{t('termsAndPrivacy.terms.access.eligibility.li2')}</li>
                                                <li>{t('termsAndPrivacy.terms.access.eligibility.li3')}</li>
                                            </ul>
                                            <p className="text-gray-700 leading-relaxed mt-3">
                                                {t('termsAndPrivacy.terms.access.eligibility.p2_prefix')}{' '}
                                                <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                    i-signs.eu
                                                </a>{' '}
                                                {t('termsAndPrivacy.terms.access.eligibility.p2_suffix')}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.terms.contact.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {t('termsAndPrivacy.terms.contact.p1_prefix')}{' '}
                                        <a href="mailto:legal@i-sign.eu" className="text-blue-900 hover:underline font-medium">
                                            legal@i-sign.eu
                                        </a>{' '}
                                        {t('termsAndPrivacy.terms.contact.p1_suffix')}
                                    </p>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold text-blue-900 mb-6">{t('termsAndPrivacy.privacy.title')}</h2>
                            <p className="text-gray-600 mb-6">{t('termsAndPrivacy.lastUpdated', { date: lastUpdatedDate })}</p>

                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.collection.title')}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">{t('termsAndPrivacy.privacy.collection.item1.title')}</h4>
                                            <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.collection.item1.text')}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">{t('termsAndPrivacy.privacy.collection.item2.title')}</h4>
                                            <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.collection.item2.text')}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">{t('termsAndPrivacy.privacy.collection.item3.title')}</h4>
                                            <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.collection.item3.text')}</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.use.title')}</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                            <li key={i}>{t(`termsAndPrivacy.privacy.use.li${i}`)}</li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.sharing.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">{t('termsAndPrivacy.privacy.sharing.p1')}</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <li key={i}>{t(`termsAndPrivacy.privacy.sharing.li${i}`)}</li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.security.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.security.p1')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.retention.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.retention.p1')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.rights.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">{t('termsAndPrivacy.privacy.rights.p1')}</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                            <li key={i}>{t(`termsAndPrivacy.privacy.rights.li${i}`)}</li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.transfers.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.transfers.p1')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.cookies.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.cookies.p1')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.contact.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.contact.p1')}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{t('termsAndPrivacy.privacy.changes.title')}</h3>
                                    <p className="text-gray-700 leading-relaxed">{t('termsAndPrivacy.privacy.changes.p1')}</p>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>{t('termsAndPrivacy.footer.copyright')}</p>
                    <p className="mt-2">
                        {t('termsAndPrivacy.footer.support_prefix')}{' '}
                        <a href="mailto:support@i-sign.eu" className="text-blue-900 hover:underline">
                            support@i-sign.eu
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsAndPrivacy;
