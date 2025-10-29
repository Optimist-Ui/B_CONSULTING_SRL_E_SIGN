import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks/useAppDispatch';
import { submitEnterpriseInquiry } from '../store/thunk/contactThunks';
import { useAppSelector } from '../store/hooks/useAppSelector';

// Validation Schema Function
const getEnterpriseInquirySchema = (t: (key: string) => string) =>
    Yup.object().shape({
        name: Yup.string().min(2, t('enterpriseContact.validation.name.min')).max(100, t('enterpriseContact.validation.name.max')).required(t('enterpriseContact.validation.name.required')),
        email: Yup.string().email(t('enterpriseContact.validation.email.invalid')).required(t('enterpriseContact.validation.email.required')),
        company: Yup.string()
            .min(2, t('enterpriseContact.validation.company.min'))
            .max(200, t('enterpriseContact.validation.company.max'))
            .required(t('enterpriseContact.validation.company.required')),
        phone: Yup.string()
            .test('is-valid-phone', t('enterpriseContact.validation.phone.invalid'), (value) => !value || isValidPhoneNumber(value || ''))
            .nullable(),
        message: Yup.string()
            .min(10, t('enterpriseContact.validation.message.min'))
            .max(2000, t('enterpriseContact.validation.message.max'))
            .required(t('enterpriseContact.validation.message.required')),
    });

const EnterpriseContact = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { inquirySubmitting } = useAppSelector((state) => state.contacts);
    const EnterpriseInquirySchema = getEnterpriseInquirySchema(t);

    const handleSubmit = async (values: any, { resetForm }: any) => {
        try {
            await dispatch(submitEnterpriseInquiry(values)).unwrap();
            toast.success(t('enterpriseContact.messages.success') as string);
            resetForm();
            navigate('/');
        } catch (error: any) {
            toast.error(error || t('enterpriseContact.messages.error'));
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
                        {t('enterpriseContact.header.title.main')}
                        <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t('enterpriseContact.header.title.highlight')}</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{t('enterpriseContact.header.description')}</p>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl p-6 md:p-8">
                    <Formik initialValues={{ name: '', email: '', company: '', phone: '', message: '' }} validationSchema={EnterpriseInquirySchema} onSubmit={handleSubmit}>
                        {({ setFieldValue, values }) => (
                            <Form className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('enterpriseContact.form.name.label')} *
                                    </label>
                                    <Field
                                        name="name"
                                        type="text"
                                        id="name"
                                        placeholder={t('enterpriseContact.form.name.placeholder')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                    />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('enterpriseContact.form.email.label')} *
                                    </label>
                                    <Field
                                        name="email"
                                        type="email"
                                        id="email"
                                        placeholder={t('enterpriseContact.form.email.placeholder')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                    />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('enterpriseContact.form.company.label')} *
                                    </label>
                                    <Field
                                        name="company"
                                        type="text"
                                        id="company"
                                        placeholder={t('enterpriseContact.form.company.placeholder')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                                    />
                                    <ErrorMessage name="company" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('enterpriseContact.form.phone.label')}
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
                                        {t('enterpriseContact.form.message.label')} *
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="message"
                                        id="message"
                                        rows={5}
                                        placeholder={t('enterpriseContact.form.message.placeholder')}
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
                                        {inquirySubmitting ? t('enterpriseContact.form.button.submitting') : t('enterpriseContact.form.button.default')}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
                <div className="text-center mt-12">
                    <p className="text-gray-600">
                        {t('enterpriseContact.footer.callPrompt')}{' '}
                        <a href="tel:+18881234567" className="text-purple-600 hover:underline">
                            +1-888-123-4567
                        </a>
                    </p>
                    <p className="text-gray-600 mt-2">
                        {t('enterpriseContact.footer.emailPrompt')}{' '}
                        <a href="mailto:sales@e-sign.com" className="text-purple-600 hover:underline">
                            sales@e-sign.com
                        </a>
                    </p>
                </div>
            </div>
            <style>{`.bg-gradient-radial { background: radial-gradient(circle, var(--tw-gradient-stops)); }`}</style>
        </section>
    );
};

export default EnterpriseContact;
