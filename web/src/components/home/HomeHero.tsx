import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Mousewheel, Autoplay } from 'swiper/modules';
import { TypeAnimation } from 'react-type-animation';
import 'swiper/css';
import 'swiper/css/effect-cards';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HomeHero = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    // Sample document images for the cards with translation keys
    const documentImages = [
        {
            id: 1,
            titleKey: 'hero.documents.contractAgreement',
            image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=500&fit=crop&crop=center',
            type: 'PDF',
        },
        {
            id: 2,
            titleKey: 'hero.documents.invoiceDocument',
            image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=500&fit=crop&crop=center',
            type: 'DOC',
        },
        {
            id: 3,
            titleKey: 'hero.documents.legalAgreement',
            image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=500&fit=crop&crop=center',
            type: 'PDF',
        },
        {
            id: 4,
            titleKey: 'hero.documents.businessProposal',
            image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=500&fit=crop&crop=center',
            type: 'DOC',
        },
        {
            id: 5,
            titleKey: 'hero.documents.termsConditions',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=center',
            type: 'PDF',
        },
    ];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile Layout - Stack vertically on mobile */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Text Content Section */}
                    <div className="text-center lg:text-left space-y-6 order-2 lg:order-1">
                        <div className="overflow-hidden">
                            <h1
                                className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white transition-all duration-1000 transform ${
                                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                                }`}
                            >
                                <div className="min-h-[1.2em]">
                                    <TypeAnimation
                                        key={t('hero.headline.signDocuments')} // Force re-render on language change for typewriter effect
                                        sequence={[
                                            t('hero.headline.signDocuments'),
                                            2000,
                                            t('hero.headline.secureContracts'),
                                            2000,
                                            t('hero.headline.digitalAgreements'),
                                            2000,
                                            t('hero.headline.eSignatures'),
                                            2000,
                                        ]}
                                        wrapper="span"
                                        speed={50}
                                        repeat={Infinity}
                                        cursor={true}
                                        style={{ display: 'inline-block' }}
                                    />
                                </div>
                                <span className="block text-blue-400 mt-2">{t('hero.headline.suffix')}</span>
                            </h1>
                        </div>

                        <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">{t('hero.subheadline')}</p>
                        </div>

                        {/* Feature highlights - Better mobile layout */}
                        <div
                            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 transition-all duration-1000 delay-500 transform ${
                                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            }`}
                        >
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-400">{t('hero.features.encryptionValue')}</div>
                                <div className="text-sm text-gray-300">{t('hero.features.encryption')}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-400">{t('hero.features.uptimeValue')}</div>
                                <div className="text-sm text-gray-300">{t('hero.features.uptime')}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-400">{t('hero.features.bindingValue')}</div>
                                <div className="text-sm text-gray-300">{t('hero.features.binding')}</div>
                            </div>
                        </div>

                        {/* CTA Buttons - Better mobile spacing */}
                        <div
                            className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-1000 delay-700 transform ${
                                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            }`}
                        >
                            <button
                                onClick={() => navigate('/subscriptions')}
                                className="group bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 transform"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {t('hero.cta.startTrial')}
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </button>
                            <button className="group border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all duration-300 hover:scale-105 transform">
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('hero.cta.watchDemo')}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Swiper Cards Section - Better mobile positioning */}
                    <div
                        className={`flex justify-center order-1 lg:order-2 mb-8 lg:mb-0 transition-all duration-1000 delay-300 transform ${
                            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                        }`}
                    >
                        <div className="relative">
                            <Swiper
                                effect={'cards'}
                                grabCursor={true}
                                mousewheel={true}
                                autoplay={{
                                    delay: 2500,
                                    disableOnInteraction: false,
                                }}
                                modules={[EffectCards, Mousewheel, Autoplay]}
                                className="w-72 h-96 sm:w-80 sm:h-[28rem] lg:w-96 lg:h-[32rem]"
                                cardsEffect={{
                                    perSlideOffset: 8,
                                    perSlideRotate: 2,
                                    rotate: true,
                                    slideShadows: true,
                                }}
                            >
                                {documentImages.map((doc) => (
                                    <SwiperSlide key={doc.id}>
                                        <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden group hover:scale-110 transition-all duration-500 ease-out hover:shadow-3xl">
                                            {/* Document preview */}
                                            <div className="h-4/5 bg-gray-100 p-4 sm:p-6 flex flex-col">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{doc.type}</span>
                                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                                            <path d="M14 2v6h6" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Document content simulation */}
                                                <div className="space-y-3 flex-1">
                                                    <div className="h-3 bg-gray-300 rounded w-full"></div>
                                                    <div className="h-3 bg-gray-300 rounded w-4/5"></div>
                                                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-300 rounded w-full"></div>
                                                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                                                    <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                                                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>

                                                    {/* Signature area */}
                                                    <div className="mt-6 pt-4 border-t border-gray-300">
                                                        <div className="text-xs text-gray-500 mb-2">{t('hero.documents.signatureRequired')}</div>
                                                        <div className="h-10 border-2 border-dashed border-blue-300 rounded flex items-center justify-center bg-blue-50/50">
                                                            <span className="text-xs text-blue-600 font-medium">{t('hero.documents.clickToSign')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Document footer */}
                                            <div className="h-1/5 bg-slate-50 p-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 text-sm">{t(doc.titleKey)}</h3>
                                                    <p className="text-xs text-gray-500">{t('hero.documents.readyForSignature')}</p>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Floating elements around the swiper */}
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

export default HomeHero;
