// pages/CookiePolicyPage.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/index';
import { setShowPreferences } from '../store/slices/cookieSlice';

const CookiePolicyPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const handleManagePreferences = () => {
        dispatch(setShowPreferences(true));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <h1 className="text-3xl font-bold text-white mb-6">Cookie Policy</h1>
                    
                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 mb-6">
                            This Cookie Policy explains how E-Sign ("we", "us", or "our") uses cookies and similar 
                            technologies when you visit our website or use our services.
                        </p>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">What Are Cookies?</h2>
                        <p className="text-gray-300 mb-6">
                            Cookies are small text files that are stored on your device when you visit a website. 
                            They help us provide you with a better experience by remembering your preferences and 
                            enabling certain functionality.
                        </p>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Types of Cookies We Use</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-2">Essential Cookies</h3>
                                <p className="text-gray-300 text-sm">
                                    These cookies are necessary for our website to function properly. They enable 
                                    core functionality such as authentication, security features, and basic navigation.
                                </p>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-2">Functional Cookies</h3>
                                <p className="text-gray-300 text-sm">
                                    These cookies enable enhanced functionality and personalization, such as 
                                    remembering your language preferences and settings.
                                </p>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-2">Analytics Cookies</h3>
                                <p className="text-gray-300 text-sm">
                                    These cookies help us understand how visitors interact with our website by 
                                    collecting and reporting information anonymously.
                                </p>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-2">Marketing Cookies</h3>
                                <p className="text-gray-300 text-sm">
                                    These cookies are used to deliver advertisements that are more relevant to you 
                                    and your interests.
                                </p>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Managing Your Cookie Preferences</h2>
                        <p className="text-gray-300 mb-6">
                            You can control and manage cookies in various ways. You can set your browser to refuse 
                            cookies, or to alert you when cookies are being sent. You can also manage your 
                            preferences using our cookie preference center.
                        </p>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={handleManagePreferences}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                            >
                                Manage Cookie Preferences
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
                        <p className="text-gray-300 mb-6">
                            If you have any questions about this Cookie Policy, please contact us at privacy@esign.com.
                        </p>

                        <p className="text-gray-400 text-sm mt-8">
                            This policy was last updated on {new Date().toLocaleDateString()}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicyPage;