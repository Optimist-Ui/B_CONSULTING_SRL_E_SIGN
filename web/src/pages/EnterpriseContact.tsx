import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAppDispatch } from '../store/hooks/useAppDispatch';
import { submitEnterpriseInquiry } from '../store/thunk/contactThunks';
import { useAppSelector } from '../store/hooks/useAppSelector';

const EnterpriseInquirySchema = Yup.object().shape({
    name: Yup.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').required('Full name is required'),
    email: Yup.string().email('Invalid email format').required('Business email is required'),
    company: Yup.string().min(2, 'Company name must be at least 2 characters').max(200, 'Company name cannot exceed 200 characters').required('Company name is required'),
    phone: Yup.string()
        .test('is-valid-phone', 'Invalid phone number', (value) => !value || isValidPhoneNumber(value || ''))
        .nullable(),
    message: Yup.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message cannot exceed 2000 characters').required('Message is required'),
});

const EnterpriseContact = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { inquirySubmitting } = useAppSelector((state) => state.contacts);

    const handleSubmit = async (values: any, { resetForm }: any) => {
        try {
            await dispatch(submitEnterpriseInquiry(values)).unwrap();
            toast.success('Your inquiry has been sent successfully!');
            resetForm();
            navigate('/');
        } catch (error: any) {
            toast.error(error || 'Failed to send inquiry. Please try again.');
        }
    };

    return (
        <section className="py-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 relative overflow-hidden min-h-screen">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-100/20 to-transparent rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/15 to-transparent rounded-full -translate-x-1/3 translate-y-1/3"></div>
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-50/30 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Enterprise
                        <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Custom Solutions</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Get in touch with our sales team for personalized pricing, custom features, and dedicated support tailored to your organization's needs.
                    </p>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl p-6 md:p-8">
                    <Formik
                        initialValues={{
                            name: '',
                            email: '',
                            company: '',
                            phone: '',
                            message: '',
                        }}
                        validationSchema={EnterpriseInquirySchema}
                        onSubmit={handleSubmit}
                    >
                        {({ setFieldValue, values }) => (
                            <Form className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <Field
                                        name="name"
                                        type="text"
                                        id="name"
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                    />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Business Email *
                                    </label>
                                    <Field
                                        name="email"
                                        type="email"
                                        id="email"
                                        placeholder="john.doe@company.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                    />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name *
                                    </label>
                                    <Field
                                        name="company"
                                        type="text"
                                        id="company"
                                        placeholder="Acme Corporation"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                    />
                                    <ErrorMessage name="company" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number (Optional)
                                    </label>
                                    <PhoneInput
                                        name="phone"
                                        international
                                        defaultCountry="US"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                        value={values.phone}
                                        onChange={(value) => setFieldValue('phone', value || '')}
                                    />
                                    <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tell us about your needs *
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="message"
                                        id="message"
                                        rows={5}
                                        placeholder="Describe your requirements, team size, or any specific features you're interested in..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 resize-y"
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <ErrorMessage name="message" component="div" className="text-red-500 text-sm" />
                                        <span className="text-xs text-gray-500">{values.message.length}/2000</span>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4">
                                    <button
                                        type="submit"
                                        disabled={inquirySubmitting}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-500 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {inquirySubmitting ? 'Submitting...' : 'Submit Inquiry'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>

                <div className="text-center mt-12">
                    <p className="text-gray-600">
                        Prefer to call? Reach us at{' '}
                        <a href="tel:+18881234567" className="text-purple-600 hover:underline">
                            +1-888-123-4567
                        </a>
                    </p>
                    <p className="text-gray-600 mt-2">
                        Or email directly:{' '}
                        <a href="mailto:sales@e-sign.com" className="text-purple-600 hover:underline">
                            sales@e-sign.com
                        </a>
                    </p>
                </div>
            </div>

            <style>{`
                .bg-gradient-radial { 
                    background: radial-gradient(circle, var(--tw-gradient-stops)); 
                }
            `}</style>
        </section>
    );
};

export default EnterpriseContact;
