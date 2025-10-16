import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeFeatures = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    const navigate = useNavigate();

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
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
            title: 'Legally Binding',
            description: 'All signatures are legally valid and compliant with international e-signature laws including eIDAS and UETA.',
            color: 'from-green-400 to-green-600',
        },
        {
            id: 2,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            title: 'Bank-Level Security',
            description: 'Advanced 256-bit SSL encryption, multi-factor authentication, and secure cloud storage protect your documents.',
            color: 'from-blue-400 to-blue-600',
        },
        {
            id: 3,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Lightning Fast',
            description: 'Complete document signing in under 60 seconds. No downloads, no printing, no delays.',
            color: 'from-yellow-400 to-orange-500',
        },
        {
            id: 4,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            title: 'Mobile Optimized',
            description: 'Sign documents seamlessly on any device - desktop, tablet, or smartphone with our responsive design.',
            color: 'from-purple-400 to-purple-600',
        },
        {
            id: 5,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
            title: 'Multi-Party Signing',
            description: 'Collect signatures from multiple parties with automated reminders and real-time status tracking.',
            color: 'from-indigo-400 to-indigo-600',
        },
        {
            id: 6,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            title: 'Detailed Audit Trail',
            description: 'Complete audit trail with timestamps, IP addresses, and certificate of completion for full transparency.',
            color: 'from-teal-400 to-teal-600',
        },
    ];

    const benefits = [
        {
            stat: '10x',
            label: 'Faster than paper',
            description: 'Complete workflows in minutes, not days',
        },
        {
            stat: '99.9%',
            label: 'Uptime guarantee',
            description: 'Always available when you need it',
        },
        {
            stat: '256-bit',
            label: 'SSL encryption',
            description: 'Enterprise-grade security',
        },
        {
            stat: '24/7',
            label: 'Expert support',
            description: 'Help whenever you need it',
        },
    ];

    return (
        <section ref={sectionRef} className="py-20 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50/30"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full -translate-x-48 -translate-y-48"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/20 rounded-full translate-x-48 translate-y-48"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Powerful Features
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Everything You Need for
                        <span className="block text-blue-600">Digital Signatures</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Our comprehensive platform provides all the tools and security features you need to streamline your document signing process.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id}
                            className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100 ${
                                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            }`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                            }}
                        >
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>{feature.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Benefits Stats */}
                <div
                    className={`bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-8 md:p-12 transition-all duration-1000 transform ${
                        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                >
                    <div className="text-center mb-10">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by Thousands</h3>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">Join businesses worldwide who have streamlined their document processes with our platform.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className={`text-center group transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                                style={{
                                    transitionDelay: `${(index + 6) * 100}ms`,
                                }}
                            >
                                <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">{benefit.stat}</div>
                                <div className="text-lg font-semibold text-white mb-2">{benefit.label}</div>
                                <div className="text-gray-300 text-sm">{benefit.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className={`text-center mt-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex flex-col sm:flex-row gap-4">
                        <button onClick={() => navigate('/subscriptions')} className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 transform">
                            <span className="flex items-center justify-center gap-2">
                                Start Free Trial
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </button>
                        <button className="group border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 hover:scale-105 transform">
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Learn More
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeFeatures;
