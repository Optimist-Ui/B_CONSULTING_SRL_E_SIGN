import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TermsAndPrivacy = () => {
    const [activeTab, setActiveTab] = useState('terms');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to={'/'}>
                        <h1 className="text-3xl font-bold text-blue-900 mb-2">I-sign.eu</h1>
                    </Link>
                        <p className="text-gray-600">Professional Electronic Signature Platform</p>
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
                                Terms of Service
                            </button>
                            <button
                                onClick={() => setActiveTab('privacy')}
                                className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 ${
                                    activeTab === 'privacy' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Privacy Policy
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm p-8">
                    {activeTab === 'terms' ? (
                        <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold text-blue-900 mb-6">Terms of Service</h2>
                            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">1. Introduction</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        These Sites and Services Terms and Conditions (the "Terms" or "General Terms") govern your access to and use of the{' '}
                                        <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                            i-signs.eu
                                        </a>{' '}
                                        websites, products, and services (collectively, the "Site" or "Services"). By using our Site or Services, you agree to be bound by these Terms, whether on
                                        behalf of yourself or a business you represent.
                                    </p>
                                    <p className="text-gray-700 leading-relaxed mt-3">
                                        If you do not agree with these Terms, you are not authorized to use the Site or Services and must discontinue use immediately.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">2. Scope of Application</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">These Terms apply to the following categories of users (collectively referred to as "you" or "your"):</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>
                                            <strong>Website Visitors</strong> — Individuals accessing{' '}
                                            <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                i-signs.eu
                                            </a>{' '}
                                            and related websites.
                                        </li>
                                        <li>
                                            <strong>Customers</strong> — Organizations or individuals subscribing to or licensing{' '}
                                            <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                i-signs.eu
                                            </a>{' '}
                                            Services.
                                        </li>
                                        <li>
                                            <strong>Users</strong> — Individuals using{' '}
                                            <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                i-signs.eu
                                            </a>{' '}
                                            Services under a Customer account (including authorized employees or agents).
                                        </li>
                                    </ul>
                                    <p className="text-gray-700 leading-relaxed mt-3">
                                        If you are a Customer and have entered into a separate Service Agreement or Corporate Contract with{' '}
                                        <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                            i-signs.eu
                                        </a>
                                        , those terms will prevail to the extent they conflict with these Terms. These Terms are designed for business and professional use; consumer protections under
                                        applicable law may apply separately.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">3. Compliance with Local Laws</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        If you access the Site or Services from a jurisdiction with specific regulatory requirements or supplemental terms (such as certain EU Member States), those
                                        jurisdiction-specific terms will apply in addition to these Terms. In the event of conflict, the jurisdiction-specific terms will prevail.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">4. Acceptance of Terms</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">By accessing, using, or downloading any part of the Site or Services, you confirm that you:</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>Have read and understood these Terms;</li>
                                        <li>Accept these Terms on your own behalf or on behalf of your organization;</li>
                                        <li>Are authorized to enter into legally binding agreements in your jurisdiction.</li>
                                    </ul>
                                    <p className="text-gray-700 leading-relaxed mt-3">If you do not meet these conditions, you must not use the Site or Services.</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">5. Site Access and Use</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">5.1 Eligibility to Use</h4>
                                            <p className="text-gray-700 leading-relaxed mb-3">
                                                By accessing or using the{' '}
                                                <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                    i-signs.eu
                                                </a>{' '}
                                                Site or Services, you represent and warrant that:
                                            </p>
                                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                                <li>
                                                    You are of legal age (18 years or older, or otherwise the age of majority in your country of residence) and have the legal capacity to enter into
                                                    these Terms on your own behalf or on behalf of the company or organization you represent;
                                                </li>
                                                <li>
                                                    You are authorized to use the Site and Services in compliance with applicable laws and regulations, including EU and local jurisdiction rules on
                                                    electronic signatures and data protection; and
                                                </li>
                                                <li>If you are acting on behalf of a business, you are duly authorized to bind that business to these Terms.</li>
                                            </ul>
                                            <p className="text-gray-700 leading-relaxed mt-3">
                                                You acknowledge that you may not use the Site or Services if you do not meet these eligibility requirements, or if your access has previously been
                                                suspended or terminated by{' '}
                                                <a href="https://i-sign.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline font-medium">
                                                    i-signs.eu
                                                </a>{' '}
                                                for violations of these Terms.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">6. Contact Information</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        For questions about these terms, please contact us at{' '}
                                        <a href="mailto:legal@i-sign.eu" className="text-blue-900 hover:underline font-medium">
                                            legal@i-sign.eu
                                        </a>{' '}
                                        or through our support portal.
                                    </p>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold text-blue-900 mb-6">Privacy Policy</h2>
                            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">1. Information We Collect</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Account Information:</h4>
                                            <p className="text-gray-700 leading-relaxed">Name, email address, company information, and authentication credentials.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Document Data:</h4>
                                            <p className="text-gray-700 leading-relaxed">Documents uploaded for signature, signature data, IP addresses, and timestamps of signature activities.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Usage Information:</h4>
                                            <p className="text-gray-700 leading-relaxed">Log data, browser information, device identifiers, and service usage patterns.</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">2. How We Use Your Information</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>Provide and maintain the electronic signature service</li>
                                        <li>Process and facilitate document signatures</li>
                                        <li>Generate audit trails and compliance reports</li>
                                        <li>Send service-related notifications and updates</li>
                                        <li>Improve our service and develop new features</li>
                                        <li>Prevent fraud and ensure service security</li>
                                        <li>Comply with legal obligations</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">3. Information Sharing</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">
                                        We do not sell, trade, or rent your personal information. We may share information only in the following circumstances:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>With your explicit consent</li>
                                        <li>To facilitate the signature process between designated parties</li>
                                        <li>With service providers who assist in platform operations</li>
                                        <li>When required by law or legal process</li>
                                        <li>To protect our rights, property, or safety</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">4. Data Security</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We implement comprehensive security measures including encryption, access controls, regular security audits, and secure data centers. All data is encrypted both
                                        in transit and at rest using industry-standard encryption protocols. We maintain ISO 27001 and SOC 2 compliance standards.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">5. Data Retention</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We retain your data as long as your account is active and for the period required by applicable laws. Signed documents are typically retained for 7 years for
                                        legal compliance purposes. You may request deletion of your data, subject to legal retention requirements.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">6. Your Rights (GDPR)</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">Under GDPR, you have the right to:</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>Access your personal data</li>
                                        <li>Rectify inaccurate information</li>
                                        <li>Request data deletion (right to be forgotten)</li>
                                        <li>Restrict processing of your data</li>
                                        <li>Data portability</li>
                                        <li>Object to processing</li>
                                        <li>Withdraw consent at any time</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">7. International Data Transfers</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Your data is primarily processed within the European Union. Any international transfers are conducted under appropriate safeguards, including Standard
                                        Contractual Clauses approved by the European Commission.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">8. Cookies and Tracking</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We use essential cookies for service functionality and analytics cookies to improve our service. You can manage cookie preferences through your browser
                                        settings. Our cookie policy provides detailed information about our cookie usage.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">9. Contact Us</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@i-sign.eu. For EU residents, you may also contact your
                                        local data protection authority.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">10. Changes to Privacy Policy</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We will notify you of any material changes to this privacy policy via email or prominent notice on our platform at least 30 days before the changes take effect.
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>© 2024 I-sign.eu - Professional Electronic Signature Platform</p>
                    <p className="mt-2">
                        For support, contact us at{' '}
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
