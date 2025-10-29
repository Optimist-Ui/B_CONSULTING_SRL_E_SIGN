import React from 'react';
import { useTranslation } from 'react-i18next';

const HomeFooter = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    const scrollToSection = (sectionId: string): void => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    const scrollToTop = (): void => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <footer className="bg-slate-900 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-12 lg:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {/* Company Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center space-x-2 mb-6">
                                {/* <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                        <path d="M14 2v6h6" />
                                        <path d="M16 13H8" />
                                        <path d="M16 17H8" />
                                        <path d="M10 9H8" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold text-white">
                                    E<span className="text-blue-400">Sign</span>
                                </span> */}
                                <img src="/logo-white.png" alt="logo" className="w-44" />
                            </div>
                            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">{t('footer.description')}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{t('footer.certification')}</span>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-white font-semibold mb-6">{t('footer.quickLinks.title')}</h3>
                            <ul className="space-y-4">
                                <li>
                                    <button onClick={() => scrollToTop()} className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.quickLinks.home')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.quickLinks.about')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('pricing')} className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.quickLinks.pricing')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('faq')} className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.quickLinks.faq')}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Legal & Support */}
                        <div>
                            <h3 className="text-white font-semibold mb-6">{t('footer.legal.title')}</h3>
                            <ul className="space-y-4">
                                <li>
                                    <a href="terms-of-use" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.legal.privacy')}
                                    </a>
                                </li>
                                <li>
                                    <a href="terms-of-use" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.legal.terms')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.legal.security')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.legal.help')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                        {t('footer.legal.contact')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="py-6 border-t border-slate-800">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Copyright */}
                        <div className="text-gray-500 text-sm">{t('footer.copyright', { year: currentYear })}</div>

                        {/* Social Links & Contact */}
                        <div className="flex items-center space-x-6">
                            {/* Contact Info */}
                            <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>support@isign.com</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                    <span>32492537752</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Contact Info */}
                    <div className="sm:hidden mt-4 pt-4 border-t border-slate-800">
                        <div className="flex flex-col space-y-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>support@isign.com</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                <span>32492537752</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;
