import React, { useState, useEffect } from 'react';

const HomeFaq = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const faqData = [
        {
            id: 1,
            question: 'How secure are digital signatures?',
            answer: 'Our platform uses 256-bit SSL encryption and complies with international e-signature laws including eIDAS, UETA, and ESIGN Act. All signatures are legally binding and tamper-evident with detailed audit trails.',
        },
        {
            id: 2,
            question: 'What document formats do you support?',
            answer: 'We support all major document formats including PDF, DOC, DOCX, PPT, PPTX, and images (JPG, PNG). Documents are automatically optimized for signing while maintaining their original formatting.',
        },
        {
            id: 3,
            question: 'Can I track document status in real-time?',
            answer: 'Yes! Get instant notifications when documents are viewed, signed, or completed. Our dashboard provides real-time tracking with detailed timestamps and recipient activity logs.',
        },
        {
            id: 4,
            question: 'Is there a limit on the number of signatures?',
            answer: 'Our free plan includes up to 3 documents per month. Paid plans offer unlimited documents and signatures, with additional features like templates, bulk sending, and advanced integrations.',
        },
        {
            id: 5,
            question: 'How long are signed documents stored?',
            answer: 'All signed documents are securely stored in our cloud infrastructure with 99.9% uptime guarantee. Documents are retained indefinitely with enterprise-grade backup and disaster recovery systems.',
        },
        {
            id: 6,
            question: 'Do you offer API integration?',
            answer: 'Yes! Our RESTful API allows seamless integration with your existing systems. We provide comprehensive documentation, SDKs, and webhook support for real-time updates.',
        },
    ];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const toggleAccordion = (index: number) => {
        setActiveIndex(activeIndex === index ? -1 : index);
    };

    return (
        <section id="faq" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Content Section */}
                    <div className="space-y-8">
                        {/* Section Header */}
                        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                                Frequently Asked
                                <span className="block text-blue-400">Questions</span>
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">Find answers to common questions about our e-signature platform and services.</p>
                        </div>

                        {/* FAQ Accordion */}
                        <div className="space-y-4">
                            {faqData.map((faq, index) => (
                                <div key={faq.id} className={`transition-all duration-700 delay-${index * 100} transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group">
                                        <button onClick={() => toggleAccordion(index)} className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none">
                                            <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">{faq.question}</h3>
                                            <div className={`transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}>
                                                <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="px-6 pb-5">
                                                <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mb-4"></div>
                                                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                            <div className="text-sm text-gray-300">Uptime</div>
                                        </div>
                                        <div className="bg-green-500/20 rounded-lg p-4 text-center border border-green-400/20">
                                            <div className="text-2xl font-bold text-green-400">Legal</div>
                                            <div className="text-sm text-gray-300">Binding</div>
                                        </div>
                                    </div>

                                    {/* Feature list */}
                                    <div className="space-y-3">
                                        {['Bank-level Security', 'Real-time Tracking', 'API Integration', 'Unlimited Storage'].map((feature, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                <span className="text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div className="pt-4 border-t border-white/20">
                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 transform">
                                            Start Free Trial
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
