import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeAboutSection = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
     const navigate = useNavigate();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: 'Secure by Design',
            description: 'eIDAS, GDPR, and ISO 27001 compliant',
        },
        {
            id: 2,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Fast & Simple',
            description: 'Sign in seconds with no downloads',
        },
        {
            id: 3,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                </svg>
            ),
            title: 'Integrated Workflows',
            description: 'Connect with 500+ business tools',
        },
        {
            id: 4,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                </svg>
            ),
            title: 'Smart Automation',
            description: 'Automated reminders and audit trails',
        },
    ];

    const sustainabilityFeatures = [
        { icon: '🌱', title: 'CO₂ Reduction', description: 'Cutting paper waste' },
        { icon: '🌍', title: 'Green Operations', description: 'Renewable energy data centers' },
        { icon: '🌳', title: 'Reforestation', description: 'Global tree-planting' },
        { icon: '🔄', title: 'Sustainable Innovation', description: 'Tech for the environment' },
    ];

    return (
        <section id="about" ref={sectionRef} className="relative py-12 md:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-5 right-5 w-20 h-20 md:w-32 md:h-32 bg-blue-400/10 rounded-full animate-pulse"></div>
                <div className="absolute bottom-10 left-5 w-16 h-16 md:w-24 md:h-24 bg-purple-400/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="hidden md:block absolute top-1/2 right-1/4 w-12 h-12 bg-green-500/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className={`text-center mb-12 md:mb-14 transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 text-blue-400 rounded-full text-xs md:text-sm font-semibold mb-4 border border-blue-400/30">
                        <span>✨ About E-Sign.eu</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Reinventing Trust in the
                        <span className="block bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent">Digital Era</span>
                    </h1>

                    <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-6">
                        Signing a document should be <span className="text-blue-400 font-semibold">effortless</span>, <span className="text-green-400 font-semibold">secure</span>, and{' '}
                        <span className="text-purple-400 font-semibold">sustainable</span>.
                    </p>

                    <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 backdrop-blur-sm rounded-lg md:rounded-2xl p-4 md:p-6 max-w-3xl mx-auto border border-blue-400/20">
                        <p className="text-sm md:text-base text-gray-200 leading-relaxed italic">"Every digital signature is a step toward a cleaner, faster, and more connected world."</p>
                    </div>
                </div>

                {/* Mission & Vision Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-12">
                    {/* Mission */}
                    <div
                        className={`bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-6 border border-blue-400/30 transition-all duration-1000 delay-300 ease-out transform ${
                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-white">Our Mission</h2>
                        </div>
                        <p className="text-sm md:text-base text-gray-300 leading-relaxed">Make digital trust accessible to everyone, enabling secure, efficient, and sustainable business workflows.</p>
                    </div>

                    {/* Vision */}
                    <div
                        className={`bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-6 border border-green-400/30 transition-all duration-1000 delay-400 ease-out transform ${
                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-white">Our Vision</h2>
                        </div>
                        <p className="text-sm md:text-base text-gray-300 leading-relaxed">A world without paper where agreements flow as easily as ideas, powered by sustainable innovation.</p>
                    </div>
                </div>

                {/* Sustainability Commitment */}
                <div className={`mb-12 transition-all duration-1000 delay-500 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Committed to a<span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Carbon-Neutral Future</span>
                        </h2>
                        <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">Every document signed contributes to a sustainable ecosystem</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {sustainabilityFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className={`bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 border border-green-400/30 hover:border-green-400/60 transition-all duration-300 hover:scale-105 text-center`}
                            >
                                <div className="text-2xl md:text-3xl mb-2">{feature.icon}</div>
                                <h3 className="text-xs md:text-sm font-bold text-white mb-1">{feature.title}</h3>
                                <p className="text-xs text-gray-300">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why Choose Us Features */}
                <div className={`mb-10 transition-all duration-1000 delay-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Why Choose E-Sign.eu</h2>
                        <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">Experience seamless signing without limits</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`flex items-start group transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                                style={{ transitionDelay: `${800 + index * 100}ms` }}
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-white text-sm">{feature.icon}</div>
                                </div>
                                <div className="flex-1">
                                    <h6 className="text-sm md:text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{feature.title}</h6>
                                    <p className="text-xs md:text-sm text-gray-300">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className={`text-center transition-all duration-1000 delay-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-sm rounded-lg md:rounded-2xl p-6 md:p-8 border border-blue-400/30">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Join the <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Digital Trust Revolution</span>
                        </h2>
                        <p className="text-sm md:text-base text-gray-300 mb-6 max-w-xl mx-auto">Be part of the sustainable future</p>
                        <button onClick={() => navigate('/subscriptions')} className="group bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/30">
                            <span className="flex items-center justify-center gap-2">
                                <span>Subscribe Now</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </section>
    );
};

export default HomeAboutSection;
