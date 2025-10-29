// pages/CookiePolicyPage.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch } from '../store/index';
import { setShowPreferences } from '../store/slices/cookieSlice';

const CookiePolicyPage: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();

    const handleManagePreferences = () => {
        dispatch(setShowPreferences(true));
    };

    const cookieTypes = ['essential', 'functional', 'analytics', 'marketing'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <h1 className="text-3xl font-bold text-white mb-6">{t('cookiePolicy.title')}</h1>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 mb-6">{t('cookiePolicy.intro')}</p>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t('cookiePolicy.whatAreCookies.title')}</h2>
                        <p className="text-gray-300 mb-6">{t('cookiePolicy.whatAreCookies.text')}</p>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t('cookiePolicy.types.title')}</h2>

                        <div className="space-y-4 mb-6">
                            {cookieTypes.map((type) => (
                                <div key={type} className="bg-slate-800/50 rounded-lg p-4">
                                    <h3 className="font-semibold text-white mb-2">{t(`cookiePolicy.types.${type}.title`)}</h3>
                                    <p className="text-gray-300 text-sm">{t(`cookiePolicy.types.${type}.text`)}</p>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t('cookiePolicy.managing.title')}</h2>
                        <p className="text-gray-300 mb-6">{t('cookiePolicy.managing.text')}</p>

                        <div className="flex gap-4 mt-8">
                            <button onClick={handleManagePreferences} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                                {t('cookiePolicy.managing.button')}
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t('cookiePolicy.contact.title')}</h2>
                        <p className="text-gray-300 mb-6">{t('cookiePolicy.contact.text')}</p>

                        <p className="text-gray-400 text-sm mt-8">{t('cookiePolicy.lastUpdated', { date: new Date().toLocaleDateString() })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicyPage;
