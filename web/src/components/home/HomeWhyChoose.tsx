import React, { useEffect, useRef, useState } from 'react';

const HomeWhyChoose = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    // Intersection Observer for scroll animations
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
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: 'Industry-Leading Security Standards',
            description: 'Bank-grade encryption and compliance with global e-signature laws',
        },
        {
            id: 2,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Lightning-Fast Document Processing',
            description: 'Complete signature workflows in under 60 seconds with our optimized platform',
        },
        {
            id: 3,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
                    />
                </svg>
            ),
            title: '24/7 Premium Support Excellence',
            description: 'Dedicated expert support team available around the clock for your success',
        },
        {
            id: 4,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                </svg>
            ),
            title: 'Seamless Enterprise Integration',
            description: 'Connect with 500+ business tools and workflows you already use',
        },
    ];

    return (
        <section id="about" ref={sectionRef} className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400/10 rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 left-10 w-24 h-24 bg-purple-400/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-blue-500/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>

                {/* Decorative SVG Icons */}
                <div className="absolute top-16 left-16 text-blue-400/20">
                    <svg className="w-20 h-20 animate-spin-slow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-16 right-16 text-purple-400/20">
                    <svg className="w-16 h-16 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column - Visual Elements */}
                    <div className={`relative transition-all duration-1200 ease-out transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                        <div className="relative">
                            {/* Main Visual Container */}
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-blue-400/30">
                                        <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
                                        <div className="text-sm text-gray-300">Uptime</div>
                                    </div>
                                    <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-green-400/30">
                                        <div className="text-3xl font-bold text-green-400 mb-2">10M+</div>
                                        <div className="text-sm text-gray-300">Documents</div>
                                    </div>
                                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-purple-400/30">
                                        <div className="text-3xl font-bold text-purple-400 mb-2">150+</div>
                                        <div className="text-sm text-gray-300">Countries</div>
                                    </div>
                                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-orange-400/30">
                                        <div className="text-3xl font-bold text-orange-400 mb-2">24/7</div>
                                        <div className="text-sm text-gray-300">Support</div>
                                    </div>
                                </div>

                                {/* Trust Badges */}
                                <div className="flex justify-center items-center space-x-6">
                                    <div className="flex items-center bg-white/10 rounded-full px-4 py-2 border border-white/20">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">SOC 2 Certified</span>
                                    </div>
                                    <div className="flex items-center bg-white/10 rounded-full px-4 py-2 border border-white/20">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">ISO Compliant</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div
                                className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg animate-float"
                                style={{ animationDelay: '1s' }}
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Content */}
                    <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                        {/* Title Section */}
                        <div className={`mb-12 transition-all duration-1000 delay-300 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold mb-6 border border-blue-400/30">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                    />
                                </svg>
                                Why Choose Us
                            </div>

                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                                Trusted E-Signature
                                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Solution Provider</span>
                            </h2>

                            <h5 className="text-xl md:text-2xl text-blue-300 font-semibold mb-6 leading-relaxed">
                                Your complete digital signature platform designed for security, speed, and seamless integration
                            </h5>

                            <p className="text-lg text-gray-300 leading-relaxed">
                                We've revolutionized document signing with cutting-edge technology, unmatched security, and user-friendly design. Join millions who trust our platform for their most
                                important business agreements and legal documents.
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-6 mb-10">
                            {features.map((feature, index) => (
                                <div
                                    key={feature.id}
                                    className={`flex items-start group transition-all duration-700 delay-${500 + index * 100} ease-out transform ${
                                        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                                    }`}
                                >
                                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <div className="text-white">{feature.icon}</div>
                                    </div>
                                    <div className="flex-1">
                                        <h6 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">{feature.title}</h6>
                                        <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <div className={`transition-all duration-1000 delay-900 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <button className="group bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-500 hover:scale-105 transform hover:shadow-2xl hover:shadow-blue-600/30">
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                    Talk With Expert
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </section>
    );
};

export default HomeWhyChoose;
