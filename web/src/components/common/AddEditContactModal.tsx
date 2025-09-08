// src/components/common/AddEditContactModal.tsx

import { FC, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { IRootState, AppDispatch } from '../../store';
import { createContact, updateContact, CreateContactArgs } from '../../store/thunk/contactThunks';
import { Contact } from '../../store/slices/contactSlice';
import IconX from '../Icon/IconX';
import IconTrash from '../Icon/IconTrash';

// Type Definitions
interface LanguageOption {
    value: string;
    label: string;
}

const languageOptions: LanguageOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    // Add other languages as needed
];

interface AddEditContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactToEdit?: Contact | null;
    onSaveSuccess: (contact: Contact) => void; // Callback to return the saved contact
}

const ContactSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email format').required('Email is required'),
    phone: Yup.string()
        .test('is-valid-phone', 'Invalid phone number', (value) => !value || isValidPhoneNumber(value || ''))
        .nullable(),
    language: Yup.object().nullable().required('Language is required'),
    title: Yup.string().optional(),
    customFields: Yup.array().of(
        Yup.object().shape({
            key: Yup.string().when('value', {
                is: (val: string) => val && val.length > 0,
                then: (schema) => schema.required('Field name is required'),
                otherwise: (schema) => schema.optional(),
            }),
            value: Yup.string().optional(),
        })
    ),
});

const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    const toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        customClass: { container: 'toast' },
    });
    toast.fire({ icon: type, title: msg, padding: '10px 20px' });
};

const AddEditContactModal: FC<AddEditContactModalProps> = ({ isOpen, onClose, contactToEdit, onSaveSuccess }) => {
    const dispatch: AppDispatch = useDispatch();
    const { loading } = useSelector((state: IRootState) => state.contacts);

    console.log(loading);
    

    const handleSaveContact = async (values: any) => {
        const customFieldsObject = values.customFields.reduce((acc: { [key: string]: string }, field: { key: string; value: string }) => {
            if (field.key && field.value) {
                acc[field.key] = field.value;
            }
            return acc;
        }, {});

        const fullFirstName = values.titlePrefix ? `${values.titlePrefix} ${values.firstName}`.trim() : values.firstName;

        const contactData: CreateContactArgs = {
            firstName: fullFirstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            title: values.title,
            language: values.language?.value,
            customFields: customFieldsObject,
        };

        try {
            if (contactToEdit) {
                const updatedContact = await dispatch(updateContact({ contactId: contactToEdit._id, contactData })).unwrap();
                showMessage('Contact updated successfully.');
                onSaveSuccess(updatedContact);
            } else {
                const newContact = await dispatch(createContact(contactData)).unwrap();
                showMessage('Contact added successfully.');
                onSaveSuccess(newContact); // Use the callback here
            }
            onClose(); // Close the modal
        } catch (error: any) {
            showMessage(error, 'error');
        }
    };

    const findLanguageOption = (langCode?: string) => languageOptions.find((o) => o.value === langCode) || null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-[51]">
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-[black]/60" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center px-4 py-8">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl text-black dark:text-white-dark">
                                <button type="button" onClick={onClose} className="absolute top-4 ltr:right-4 rtl:left-4 outline-none">
                                    <IconX />
                                </button>
                                <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                    {contactToEdit ? 'Edit Contact' : 'Add New Contact'}
                                </div>
                                <div className="p-5">
                                    <Formik
                                        initialValues={{
                                            titlePrefix: '',
                                            firstName: contactToEdit?.firstName || '',
                                            lastName: contactToEdit?.lastName || '',
                                            email: contactToEdit?.email || '',
                                            phone: contactToEdit?.phone || '',
                                            title: contactToEdit?.title || '',
                                            language: findLanguageOption(contactToEdit?.language) || languageOptions[0],
                                            customFields: contactToEdit?.customFields ? Object.entries(contactToEdit.customFields).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }],
                                        }}
                                        validationSchema={ContactSchema}
                                        onSubmit={handleSaveContact}
                                        enableReinitialize
                                    >
                                        {({ setFieldValue, values }) => (
                                            <Form>
                                                {/* Form fields (copied from your Contacts.tsx) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <div>
                                                            <label htmlFor="titlePrefix">Title</label>
                                                            <select
                                                                name="titlePrefix"
                                                                className="form-input"
                                                                value={values.titlePrefix || ''}
                                                                onChange={(e) => setFieldValue('titlePrefix', e.target.value)}
                                                            >
                                                                <option value="">None</option>
                                                                <option value="Mr.">Mr.</option>
                                                                <option value="Mrs.">Mrs.</option>
                                                                <option value="Ms.">Ms.</option>
                                                                <option value="Dr.">Dr.</option>
                                                                <option value="Prof.">Prof.</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <label htmlFor="firstName">First Name</label>
                                                            <Field name="firstName" type="text" id="firstName" placeholder="Enter First Name" className="form-input" />
                                                            <ErrorMessage name="firstName" component="div" className="text-danger mt-1" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="lastName">Last Name</label>
                                                        <Field name="lastName" type="text" id="lastName" placeholder="Enter Last Name" className="form-input" />
                                                        <ErrorMessage name="lastName" component="div" className="text-danger mt-1" />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label htmlFor="email">Email</label>
                                                        <Field name="email" type="email" id="email" placeholder="Enter Email" className="form-input" />
                                                        <ErrorMessage name="email" component="div" className="text-danger mt-1" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="phone">Phone Number</label>
                                                        <PhoneInput
                                                            name="phone"
                                                            international
                                                            defaultCountry="US"
                                                            className="form-input"
                                                            value={values.phone}
                                                            onChange={(value) => setFieldValue('phone', value || '')}
                                                        />
                                                        <ErrorMessage name="phone" component="div" className="text-danger mt-1" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="language">Language</label>
                                                        <Select
                                                            name="language"
                                                            options={languageOptions}
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            value={values.language}
                                                            onChange={(option: any) => setFieldValue('language', option)}
                                                        />
                                                        <ErrorMessage name="language" component="div" className="text-danger mt-1" />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label htmlFor="title">Title/Occupation</label>
                                                        <Field name="title" type="text" id="title" placeholder="Enter Title" className="form-input" />
                                                        <ErrorMessage name="title" component="div" className="text-danger mt-1" />
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800">
                                                    <h6 className="font-semibold mb-3">Additional Information</h6>
                                                    <FieldArray name="customFields">
                                                        {({ push, remove }) => (
                                                            <div className="space-y-4">
                                                                {values.customFields.map((field, index) => (
                                                                    <div key={index} className="flex items-start gap-3">
                                                                        <div className="flex-1">
                                                                            <Field name={`customFields[${index}].key`} type="text" className="form-input" placeholder="Field Name (e.g., Company)" />
                                                                            <ErrorMessage name={`customFields[${index}].key`} component="div" className="text-danger mt-1 text-xs" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <Field name={`customFields[${index}].value`} type="text" className="form-input" placeholder="Value (e.g., Acme Inc.)" />
                                                                        </div>
                                                                        <button type="button" className="btn btn-outline-danger !p-2 mt-1" onClick={() => remove(index)}>
                                                                            <IconTrash />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button type="button" className="btn btn-outline-primary" onClick={() => push({ key: '', value: '' })}>
                                                                    + Add Custom Field
                                                                </button>
                                                            </div>
                                                        )}
                                                    </FieldArray>
                                                </div>

                                                <div className="flex justify-end items-center mt-8">
                                                    <button type="button" className="btn btn-outline-danger" onClick={onClose}>
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={loading}>
                                                        {loading ? 'Saving...' : contactToEdit ? 'Update Contact' : 'Add Contact'}
                                                    </button>
                                                </div>
                                            </Form>
                                        )}
                                    </Formik>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AddEditContactModal;
