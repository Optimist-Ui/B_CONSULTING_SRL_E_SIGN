import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Field, Form, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';

// Redux Imports
import { IRootState, AppDispatch } from '../store';
import { setPageTitle } from '../store/slices/themeConfigSlice';
import { fetchContacts, createContact, updateContact, deleteContact, CreateContactArgs } from '../store/thunk/contactThunks';
import { Contact } from '../store/slices/contactSlice';

// Library Imports
import Select from 'react-select';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Component & Icon Imports
import IconUserPlus from '../components/Icon/IconUserPlus';
import IconSearch from '../components/Icon/IconSearch';
import IconX from '../components/Icon/IconX';
import IconInbox from '../components/Icon/IconInbox';
import IconTrash from '../components/Icon/IconTrash';

// Type Definitions
interface LanguageOption {
    value: string;
    label: string;
}

const languageOptions: LanguageOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'it', label: 'Italiano (Italian)' },
];

const Contacts = () => {
    const dispatch: AppDispatch = useDispatch();
    const { contacts, loading } = useSelector((state: IRootState) => state.contacts);

    const [addContactModal, setAddContactModal] = useState(false);
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Contacts'));
        dispatch(fetchContacts({ search }));
    }, [dispatch, search]);

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

    const openModal = (contact: Contact | null = null) => {
        setEditContact(contact);
        setAddContactModal(true);
    };

    const handleSaveContact = async (values: any) => {
        const customFieldsObject = values.customFields.reduce((acc: { [key: string]: string }, field: { key: string; value: string }) => {
            if (field.key && field.value) {
                acc[field.key] = field.value;
            }
            return acc;
        }, {});

        const contactData: CreateContactArgs = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            title: values.title,
            language: values.language?.value,
            customFields: customFieldsObject,
        };

        try {
            if (editContact) {
                await dispatch(updateContact({ contactId: editContact._id, contactData })).unwrap();
                showMessage('Contact updated successfully.');
            } else {
                await dispatch(createContact(contactData)).unwrap();
                showMessage('Contact added successfully.');
            }
            setAddContactModal(false);
        } catch (error: any) {
            showMessage(error, 'error');
        }
    };

    const handleDeleteContact = (contactId: string) => {
        Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteContact(contactId)).unwrap();
                    showMessage('Contact has been deleted.');
                } catch (error: any) {
                    showMessage(error, 'error');
                }
            }
        });
    };

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

    const findLanguageOption = (langCode?: string) => languageOptions.find((o) => o.value === langCode) || null;

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Contacts</h2>
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    <button type="button" className="btn btn-primary" onClick={() => openModal()}>
                        <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                        Add Contact
                    </button>
                    <div className="relative">
                        <input type="text" placeholder="Search Contacts" className="form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="button" className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2">
                            <IconSearch className="mx-auto" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-5 panel p-0 border-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Custom Info</th>
                                <th className="!text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="text-center p-10">
                                        <div className="animate-spin border-4 border-transparent border-l-primary rounded-full w-10 h-10 inline-block align-middle m-auto mb-2"></div>
                                        <div>Loading...</div>
                                    </td>
                                </tr>
                            )}
                            {!loading && contacts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-10">
                                        <div className="flex flex-col items-center">
                                            <div className="text-primary bg-primary/10 rounded-full p-4 mb-4">
                                                <IconInbox className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">No Contacts Yet</h3>
                                            <p className="text-white-dark mb-6">Start by adding your first contact.</p>
                                            <button type="button" className="btn btn-primary" onClick={() => openModal()}>
                                                <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                                                Add Contact
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {contacts.map((contact) => (
                                <tr key={contact._id}>
                                    <td>
                                        <div className="flex items-center w-max">
                                            <div className="grid place-content-center h-8 w-8 ltr:mr-2 rtl:ml-2 rounded-full bg-primary text-white text-sm font-semibold">
                                                {contact.firstName[0]}
                                                {contact.lastName[0]}
                                            </div>
                                            <div>
                                                {contact.firstName} {contact.lastName}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{contact.email}</td>
                                    <td className="whitespace-nowrap">{contact.phone || 'N/A'}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {contact.customFields &&
                                                Object.entries(contact.customFields).map(([key, value]) => (
                                                    <span key={key} className="badge bg-primary/10 text-primary dark:bg-primary/20">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-4 items-center justify-center">
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openModal(contact)}>
                                                Edit
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteContact(contact._id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Transition appear show={addContactModal} as={Fragment}>
                <Dialog as="div" open={addContactModal} onClose={() => setAddContactModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
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
                                    <button type="button" onClick={() => setAddContactModal(false)} className="absolute top-4 ltr:right-4 rtl:left-4 outline-none">
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {editContact ? 'Edit Contact' : 'Add Contact'}
                                    </div>
                                    <div className="p-5">
                                        <Formik
                                            initialValues={{
                                                firstName: editContact?.firstName || '',
                                                lastName: editContact?.lastName || '',
                                                email: editContact?.email || '',
                                                phone: editContact?.phone || '',
                                                title: editContact?.title || '',
                                                language: findLanguageOption(editContact?.language) || languageOptions[0],
                                                customFields: editContact?.customFields ? Object.entries(editContact.customFields).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }],
                                            }}
                                            validationSchema={ContactSchema}
                                            onSubmit={handleSaveContact}
                                            enableReinitialize
                                        >
                                            {({ setFieldValue, values }) => (
                                                <Form>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div>
                                                            <label htmlFor="firstName">First Name</label>
                                                            <Field name="firstName" type="text" id="firstName" placeholder="Enter First Name" className="form-input" />
                                                            <ErrorMessage name="firstName" component="div" className="text-danger mt-1" />
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
                                                                                <Field
                                                                                    name={`customFields[${index}].key`}
                                                                                    type="text"
                                                                                    className="form-input"
                                                                                    placeholder="Field Name (e.g., Company)"
                                                                                />
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
                                                        <button type="button" className="btn btn-outline-danger" onClick={() => setAddContactModal(false)}>
                                                            Cancel
                                                        </button>
                                                        <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={loading}>
                                                            {loading ? 'Saving...' : editContact ? 'Update' : 'Add'}
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
        </div>
    );
};

export default Contacts;
