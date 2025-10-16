import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DigitalSignaturesGuidePage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'ses', label: 'Simple (SES)', icon: '✍️' },
        { id: 'aes', label: 'Advanced (AES)', icon: '🔐' },
        { id: 'qes', label: 'Qualified (QES)', icon: '🏆' },
        { id: 'faqs', label: 'FAQs', icon: '❓' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
            <div className="max-w-6xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <Link 
                        to="/#faq" 
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to FAQs
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Understanding Digital Signatures
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        A comprehensive guide to electronic signatures and their legal framework under eIDAS
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-fit px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
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
                                    <h2 className="text-2xl font-bold text-white mb-4">What is a Digital Signature?</h2>
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        A digital signature is a specific form of electronic signature that uses advanced cryptographic 
                                        methods to securely link a signer to a document. It provides the highest level of assurance 
                                        regarding the authenticity of the signer and the integrity of the signed document.
                                    </p>
                                    <p className="text-gray-300 leading-relaxed">
                                        Digital signatures are based on{' '}
                                        <a href="https://en.wikipedia.org/wiki/Public_key_infrastructure" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                            Public Key Infrastructure (PKI)
                                        </a>
                                        , an internationally recognized standard that ensures documents cannot be altered once signed 
                                        and that the signer's identity can be reliably verified. This makes digital signatures 
                                        particularly important for transactions requiring strong legal certainty.
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">Electronic vs Digital Signatures</h3>
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        <strong className="text-white">Electronic signatures (e-signatures)</strong> are a broad 
                                        category of methods used to indicate a person's intent to sign a document in digital form. 
                                        They are widely adopted because they are simple to use, quick to implement, and legally 
                                        recognized under the EU eIDAS Regulation (No. 910/2014). Common use cases include employment 
                                        contracts, purchase orders, invoices, and customer agreements.
                                    </p>
                                    <p className="text-gray-300 leading-relaxed">
                                        <strong className="text-white">Digital signatures</strong>, on the other hand, are a specific 
                                        type of electronic signature that use advanced cryptographic technology to provide stronger 
                                        security and authentication. They are particularly important in highly regulated industries 
                                        and are explicitly defined under eIDAS.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">Three Types Under eIDAS</h3>
                                    <p className="text-gray-300 leading-relaxed mb-6">
                                        Under the EU eIDAS Regulation, electronic signatures are categorized into three levels, 
                                        from least to most stringent:
                                    </p>
                                    
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-400/20">
                                            <div className="text-4xl mb-3">✍️</div>
                                            <h4 className="font-bold text-white mb-2">Simple (SES)</h4>
                                            <p className="text-sm text-gray-300">
                                                Basic forms of e-signatures, suitable for low-risk documents.
                                            </p>
                                        </div>
                                        <div className="bg-green-500/20 rounded-lg p-6 border border-green-400/20">
                                            <div className="text-4xl mb-3">🔐</div>
                                            <h4 className="font-bold text-white mb-2">Advanced (AES)</h4>
                                            <p className="text-sm text-gray-300">
                                                Higher security, uniquely linked to the signer with verified identity.
                                            </p>
                                        </div>
                                        <div className="bg-purple-500/20 rounded-lg p-6 border border-purple-400/20">
                                            <div className="text-4xl mb-3">🏆</div>
                                            <h4 className="font-bold text-white mb-2">Qualified (QES)</h4>
                                            <p className="text-sm text-gray-300">
                                                Most secure, legally equivalent to handwritten signatures.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-6 mt-8">
                                    <p className="text-gray-300 text-sm italic">
                                        💡 <strong>New to digital signatures?</strong> While digital signatures may appear complex 
                                        at first, they become much clearer once the key elements are understood. Explore each tab 
                                        above to learn when to use each type of signature.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SES Tab */}
                        {activeTab === 'ses' && (
                            <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">✍️</span>
                                        <h2 className="text-2xl font-bold text-white">Simple Electronic Signature (SES)</h2>
                                    </div>
                                    <p className="text-lg text-blue-400 mb-6">For everyday transactions</p>
                                    
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        A Simple Electronic Signature (SES) is the most basic type of electronic signature under 
                                        the eIDAS Regulation. It does not require advanced methods of signer authentication or 
                                        identity verification.
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
                                    <p className="text-gray-300 mb-4">In practice, an SES may involve something as straightforward as:</p>
                                    <ul className="space-y-2 text-gray-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            Entering a PIN or access code
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            Clicking "I accept" or ticking a checkbox
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            Providing a signature through an email-linked signing process
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">Common Use Cases</h3>
                                    <p className="text-gray-300 mb-4">
                                        This type of signature is often sufficient for low-risk, day-to-day transactions, such as:
                                    </p>
                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
                                            <p className="text-gray-300 text-sm">Sales and procurement agreements</p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
                                            <p className="text-gray-300 text-sm">Acceptance of terms and conditions</p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
                                            <p className="text-gray-300 text-sm">Simple forms and declarations</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-yellow-900/30 border border-yellow-400/30 rounded-lg p-6">
                                    <p className="text-gray-300 text-sm">
                                        ⚠️ <strong>Important:</strong> While SES offers speed and convenience, it provides the 
                                        lowest level of assurance regarding the signer's identity and document integrity. For 
                                        higher-risk or regulated transactions, stronger forms of signature such as Advanced (AES) 
                                        or Qualified (QES) may be required.
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <a 
                                        href="#" 
                                        className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Learn more about standard e-signature implementation →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* AES Tab */}
                        {activeTab === 'aes' && (
                            <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">🔐</span>
                                        <h2 className="text-2xl font-bold text-white">Advanced Electronic Signature (AES)</h2>
                                    </div>
                                    <p className="text-lg text-green-400 mb-6">For high-value transactions</p>
                                    
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        An Advanced Electronic Signature (AES) offers a higher level of security than a Simple 
                                        Electronic Signature. It requires additional authentication steps to ensure that the 
                                        signer's identity is verified and that the signature is uniquely linked to them.
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">eIDAS Requirements</h3>
                                    <p className="text-gray-300 mb-4">To qualify as AES under eIDAS, the signature must meet the following criteria:</p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-green-400 text-sm">✓</span>
                                            </div>
                                            <p className="text-gray-300">It is uniquely linked to the signer</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-green-400 text-sm">✓</span>
                                            </div>
                                            <p className="text-gray-300">It is capable of identifying the signer</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-green-400 text-sm">✓</span>
                                            </div>
                                            <p className="text-gray-300">
                                                It is created using electronic signature creation data that the signer can maintain 
                                                under their sole control
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-green-400 text-sm">✓</span>
                                            </div>
                                            <p className="text-gray-300">
                                                It is linked to the signed data in such a way that any subsequent change to the 
                                                data is detectable
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">Authentication Methods</h3>
                                    <p className="text-gray-300 mb-4">In practice, AES may involve:</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                                            <h4 className="font-semibold text-white mb-2">Identity Verification</h4>
                                            <p className="text-gray-300 text-sm">Government-issued ID verification</p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                                            <h4 className="font-semibold text-white mb-2">Biometric Checks</h4>
                                            <p className="text-gray-300 text-sm">Facial recognition or fingerprint scanning</p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                                            <h4 className="font-semibold text-white mb-2">Digital Certificates</h4>
                                            <p className="text-gray-300 text-sm">Unique certificate generated for the transaction</p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                                            <h4 className="font-semibold text-white mb-2">One-Time Passcode</h4>
                                            <p className="text-gray-300 text-sm">Unique OTP sent to verified device</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-green-900/30 border border-green-400/30 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">Key Benefits</h3>
                                    <ul className="space-y-2 text-gray-300">
                                        <li className="flex items-start">
                                            <span className="text-green-400 mr-2">✓</span>
                                            Reliable identification of the signer
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-400 mr-2">✓</span>
                                            A unique link between the signature and the signed document
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-400 mr-2">✓</span>
                                            Tamper-evident technology detects any changes
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">Example Use Case</h3>
                                    <div className="bg-slate-800/50 rounded-lg p-6">
                                        <p className="text-gray-300">
                                            High-value or sensitive business transactions, such as <strong className="text-white">
                                            employment contracts</strong> or <strong className="text-white">supplier agreements</strong>, 
                                            where the organization needs stronger assurance of the signer's identity and the 
                                            document's integrity.
                                        </p>
                                    </div>
                                </section>

                                <div className="pt-6">
                                    <a 
                                        href="#" 
                                        className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Learn more about e-signature verification methods →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* QES Tab */}
                        {activeTab === 'qes' && (
                            <div className="space-y-6">
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">🏆</span>
                                        <h2 className="text-2xl font-bold text-white">Qualified Electronic Signature (QES)</h2>
                                    </div>
                                    <p className="text-lg text-purple-400 mb-6">For highly regulated transactions</p>
                                    
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        A Qualified Electronic Signature (QES) is the most secure and trusted form of electronic 
                                        signature defined under the EU eIDAS Regulation. It requires a face-to-face or equivalent 
                                        identity verification process carried out by a Qualified Trust Service Provider (QTSP), 
                                        either in the EU or the UK.
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">Technical Foundation</h3>
                                    <p className="text-gray-300 mb-4">
                                        QES relies on a <strong className="text-white">Qualified Signature Creation Device (QSCD)</strong> and 
                                        a qualified certificate issued by a recognized provider. This process ensures that:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-purple-400 text-sm">★</span>
                                            </div>
                                            <p className="text-gray-300">
                                                The signer's identity has been verified to the highest legal standard
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-purple-400 text-sm">★</span>
                                            </div>
                                            <p className="text-gray-300">
                                                The signature is uniquely linked to the signer and the signed document
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-purple-400 text-sm">★</span>
                                            </div>
                                            <p className="text-gray-300">
                                                A complete and tamper-proof audit trail is created
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-purple-900/30 border border-purple-400/30 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">Legal Equivalence</h3>
                                    <p className="text-gray-300 mb-3">
                                        Because of these assurances, a QES is considered the <strong className="text-white">
                                        legal equivalent of a handwritten signature</strong> across all EU Member States.
                                    </p>
                                    <p className="text-gray-300 text-sm">
                                        In fact, legal experts often argue that a QES can be more reliable than a traditional 
                                        signature witnessed in an unsupervised setting, since the digital process ensures stronger 
                                        identity verification and document integrity.
                                    </p>
                                </div>

                                <section>
                                    <h3 className="text-xl font-semibold text-white mb-4">Common Use Cases</h3>
                                    <p className="text-gray-300 mb-4">
                                        QES is generally required for highly regulated or sensitive transactions, such as:
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/20 flex items-center gap-3">
                                            <span className="text-2xl">🏦</span>
                                            <p className="text-gray-300">Financial services agreements</p>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/20 flex items-center gap-3">
                                            <span className="text-2xl">⚖️</span>
                                            <p className="text-gray-300">Notarial acts</p>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/20 flex items-center gap-3">
                                            <span className="text-2xl">🏛️</span>
                                            <p className="text-gray-300">Public sector filings</p>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/20 flex items-center gap-3">
                                            <span className="text-2xl">🌍</span>
                                            <p className="text-gray-300">Cross-border legal contracts</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* FAQs Tab */}
                        {activeTab === 'faqs' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">
                                        How does a Qualified Electronic Signature (QES) work with e-signs.eu?
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        A QES requires strong identity authentication before a digital certificate can be issued. 
                                        It provides the highest level of trust through face-to-face, or equivalent, ID verification. 
                                        During the signing process, customers are asked to electronically confirm their identity. 
                                        Once verified, a digital certificate proving their identity is automatically attached to the 
                                        signature behind the scenes.
                                    </p>
                                    <p className="text-gray-300 leading-relaxed mt-3">
                                        e-signs.eu offers multiple options for QES with integrated ID verification. Digital 
                                        certificates are issued by recognized Certificate Authorities (Trust Service Providers), 
                                        and e-signs.eu accepts qualified certificates issued by providers listed on the official 
                                        EU Trust List.
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">
                                        How does an Advanced Electronic Signature (AES) work with e-signs.eu?
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        An AES with e-signs.eu involves additional steps to authenticate the signer. This may 
                                        include presenting a valid government-issued document to confirm identity, combined with 
                                        a one-time access code after the signing process. AES signatures require a PKI-based 
                                        digital certificate, which is generated and attached to the document as part of the transaction.
                                    </p>
                                    <p className="text-gray-300 leading-relaxed mt-3">
                                        e-signs.eu provides flexible ID verification options to meet both Advanced and Qualified 
                                        levels of electronic signatures under eIDAS.
                                    </p>
                                </section>

                                <section className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">
                                        How does a Simple Electronic Signature (SES) work with e-signs.eu?
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        SES is the most commonly used and broadly accepted type of e-signature worldwide. With 
                                        e-signs.eu, SES can replace handwritten signatures in most low-risk cases. It is 
                                        particularly suitable for:
                                    </p>
                                    <ul className="mt-3 space-y-2 text-gray-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            Internal documents
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            Business-to-consumer agreements
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            Transactions with existing partners
                                        </li>
                                    </ul>
                                    <p className="text-gray-300 leading-relaxed mt-3">
                                        SES is quick, efficient, and requires few steps. However, if stronger signer 
                                        authentication is needed, an AES or QES may be required instead.
                                    </p>
                                </section>

                                <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-6 mt-8">
                                    <p className="text-gray-300 text-sm">
                                        <strong className="text-white">Still have questions?</strong> Visit our{' '}
                                        <Link to="/#faq" className="text-blue-400 hover:text-blue-300 underline">
                                            main FAQ page
                                        </Link>
                                        {' '}or contact our support team for personalized assistance.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Legal Disclaimer */}
                    <div className="mt-12 pt-6 border-t border-white/20">
                        <div className="bg-slate-800/50 rounded-lg p-6">
                            <p className="text-gray-400 text-sm italic">
                                ⚖️ <strong>Disclaimer:</strong> The content above is for general informational purposes 
                                only and is not intended as legal advice. For guidance on your specific situation, please 
                                consult a qualified legal professional.
                            </p>
                        </div>
                        <p className="text-gray-400 text-sm mt-4 text-center">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalSignaturesGuidePage;