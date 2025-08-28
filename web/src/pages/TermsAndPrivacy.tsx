import React, { useState } from 'react';

const TermsAndPrivacy = () => {
    const [activeTab, setActiveTab] = useState('terms');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">E-sign.eu</h1>
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
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">1. Acceptance of Terms</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        By accessing and using E-sign.eu (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our
                                        service. These terms apply to all users of the service, including initiators, signers, and administrators.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">2. Service Description</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">E-sign.eu provides an electronic signature platform that enables users to:</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>Create and manage signature packages</li>
                                        <li>Assign roles and define signing fields</li>
                                        <li>Send documents for electronic signature</li>
                                        <li>Track document status and completion</li>
                                        <li>Store and manage signed documents securely</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">3. User Responsibilities</h3>
                                    <p className="text-gray-700 leading-relaxed mb-3">As a user of E-sign.eu, you agree to:</p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                        <li>Provide accurate and complete information</li>
                                        <li>Maintain the confidentiality of your account credentials</li>
                                        <li>Only upload documents you have the legal right to process</li>
                                        <li>Comply with all applicable laws and regulations</li>
                                        <li>Not use the service for illegal or unauthorized purposes</li>
                                        <li>Respect the intellectual property rights of others</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">4. Electronic Signatures Legal Validity</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Electronic signatures created through E-sign.eu are legally binding and enforceable under applicable electronic signature laws, including the EU eIDAS
                                        Regulation and national implementations. Users are responsible for ensuring compliance with local laws regarding electronic signatures in their jurisdiction.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">5. Data Security and Storage</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We implement industry-standard security measures to protect your documents and data. All documents are encrypted in transit and at rest. We maintain audit
                                        trails for all signature activities and store completed documents securely in accordance with legal retention requirements.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">6. Account Suspension and Termination</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose security risks. Upon termination, you may
                                        download your documents within 30 days, after which they may be permanently deleted.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">7. Limitation of Liability</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        E-sign.eu shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall
                                        not exceed the amount paid by you for the service in the 12 months preceding the claim.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">8. Changes to Terms</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We may update these terms from time to time. We will notify users of material changes via email or through the platform. Continued use of the service after
                                        changes constitute acceptance of the new terms.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-semibold text-blue-900 mb-4">9. Contact Information</h3>
                                    <p className="text-gray-700 leading-relaxed">For questions about these terms, please contact us at legal@e-sign.eu or through our support portal.</p>
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
                                        For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@e-sign.eu. For EU residents, you may also contact your
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
                    <p>© 2024 E-sign.eu - Professional Electronic Signature Platform</p>
                    <p className="mt-2">
                        For support, contact us at{' '}
                        <a href="mailto:support@e-sign.eu" className="text-blue-900 hover:underline">
                            support@e-sign.eu
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsAndPrivacy;
