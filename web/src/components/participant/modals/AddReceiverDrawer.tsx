import React, { ComponentType, Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { AppDispatch, IRootState } from '../../../store';
import {
    setAddReceiverDrawerOpen,
    setAddReceiverStep,
    setSelectedAddReceiverContact,
    updateReassignFormField, // Reusing form field logic
} from '../../../store/slices/participantSlice';
import {
    fetchReassignmentContacts, // Reusing thunk for fetching contacts
    createContactForReassignment, // Reusing thunk for creating contacts
    addReceiverByParticipant, // The new thunk for this feature
} from '../../../store/thunk/participantThunks';
import { FiX, FiCheckCircle, FiChevronRight, FiUserPlus, FiSearch, FiArrowLeft, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-number-input';
import { E164Number } from 'libphonenumber-js/core';
import 'react-phone-number-input/style.css';
import { ReassignmentContact } from '../../../store/slices/participantSlice';

// Typed Icons
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiChevronRightTyped = FiChevronRight as ComponentType<{ className?: string }>;
const FiUserPlusTyped = FiUserPlus as ComponentType<{ className?: string }>;
const FiSearchTyped = FiSearch as ComponentType<{ className?: string }>;
const FiArrowLeftTyped = FiArrowLeft as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;

const AddReceiverDrawer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { packageData } = useSelector((state: IRootState) => state.participant);
    const {
        isAddReceiverDrawerOpen,
        addReceiverStep,
        addReceiverLoading,
        addReceiverError,
        reassignmentContacts, // Reusing contact list from state
        selectedAddReceiverContact,
        reassignFormData, // Reusing form state
    } = useSelector((state: IRootState) => state.participant.uiState);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isAddReceiverDrawerOpen && addReceiverStep === 'select' && packageData) {
            dispatch(fetchReassignmentContacts({ packageId: packageData._id, participantId: packageData.currentUser.id }));
        }
    }, [isAddReceiverDrawerOpen, addReceiverStep, packageData, dispatch]);

    const closeDrawer = () => dispatch(setAddReceiverDrawerOpen(false));

    const handleFieldChange = (field: keyof typeof reassignFormData, value: string) => {
        dispatch(updateReassignFormField({ field, value }));
    };

    // When a contact is selected, immediately try to add them and go to the success/failure step.
    const handleSelectContact = (contact: ReassignmentContact) => {
        dispatch(setSelectedAddReceiverContact(contact));
        handlePerformAddReceiver(contact._id);
    };

    const handleCreateContact = async () => {
        const { email, firstName, lastName } = reassignFormData;
        if (!email.trim() || !firstName.trim() || !lastName.trim()) {
            return toast.error('Please provide first name, last name, and email.');
        }
        if (!packageData) return;

        try {
            const resultAction = await dispatch(
                createContactForReassignment({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                    contactData: reassignFormData,
                })
            );

            // If the thunk is fulfilled, get the new contact and add them as a receiver
            if (createContactForReassignment.fulfilled.match(resultAction)) {
                const newContact = resultAction.payload.data.contact;
                dispatch(setSelectedAddReceiverContact(newContact));
                handlePerformAddReceiver(newContact._id); // Directly add the newly created contact
            }
        } catch (err) {
            // Error is handled by the rejected case in the thunk
            console.error('Failed to create and add contact:', err);
        }
    };

    const handlePerformAddReceiver = async (contactId: string) => {
        if (!packageData) return;
        try {
            await dispatch(
                addReceiverByParticipant({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                    newContactId: contactId,
                })
            ).unwrap();
        } catch (err) {
            // Error toast is already shown by the extraReducer
        }
    };

    const filteredContacts = reassignmentContacts.filter(
        (c) => c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStepTitle = () => {
        switch (addReceiverStep) {
            case 'select':
                return 'Select Contact to Add';
            case 'add':
                return 'Add New Contact';
            case 'success':
                return 'Receiver Added Successfully';
            case 'failure':
                return 'Action Failed';
            default:
                return 'Add Receiver';
        }
    };

    const getStepDescription = () => {
        switch (addReceiverStep) {
            case 'select':
                return 'Choose an existing contact to add as a receiver.';
            case 'add':
                return 'Enter the details for a new contact.';
            case 'success':
                return 'The contact has been notified and added to the document.';
            case 'failure':
                return addReceiverError || 'An unexpected error occurred.';
            default:
                return 'Add a new read-only participant to this document.';
        }
    };

    const renderSelectStep = () => (
        <div className="space-y-6">
            <div className="relative">
                <FiSearchTyped className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                />
            </div>
            <div className="flex-1 overflow-y-auto -mr-6 pr-4 space-y-4">
                {addReceiverLoading && addReceiverStep === 'select' ? (
                    <div className="flex items-center justify-center py-10">
                        <FiLoaderTyped className="animate-spin w-6 h-6 text-[#1e293b]" />
                    </div>
                ) : filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                        <button
                            key={contact._id}
                            onClick={() => handleSelectContact(contact)}
                            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <div className="text-left">
                                <p className="font-semibold text-[#1e293b]">
                                    {contact.firstName} {contact.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{contact.email}</p>
                            </div>
                            <FiChevronRightTyped className="w-5 h-5 text-gray-500" />
                        </button>
                    ))
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-600">No available contacts found.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAddStep = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-2">New Receiver's Email*</label>
                <input type="email" value={reassignFormData.email} onChange={(e) => handleFieldChange('email', e.target.value)} className="form-input w-full" placeholder="name@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[#1e293b] mb-2">First Name*</label>
                    <input type="text" value={reassignFormData.firstName} onChange={(e) => handleFieldChange('firstName', e.target.value)} className="form-input w-full" placeholder="First name" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#1e293b] mb-2">Last Name*</label>
                    <input type="text" value={reassignFormData.lastName} onChange={(e) => handleFieldChange('lastName', e.target.value)} className="form-input w-full" placeholder="Last name" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-2">Phone Number</label>
                <PhoneInput
                    placeholder="Enter phone number"
                    value={reassignFormData.phone as E164Number}
                    onChange={(value) => handleFieldChange('phone', value || '')}
                    defaultCountry="US"
                    international
                    className="form-input"
                />
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <FiCheckCircleTyped className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-[#1e293b] mb-3">Receiver Added!</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 w-full">
                <p className="text-sm text-gray-600">
                    <strong>
                        {selectedAddReceiverContact?.firstName} {selectedAddReceiverContact?.lastName}
                    </strong>{' '}
                    has been added and notified.
                </p>
            </div>
        </div>
    );

    return (
        <Transition show={isAddReceiverDrawerOpen} as={Fragment}>
            <div className="fixed inset-0 overflow-hidden z-50">
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={closeDrawer} />
                </Transition.Child>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <section className="absolute inset-y-0 right-0 max-w-full flex pointer-events-auto">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-in-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in-out duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <div className="w-screen max-w-md sm:max-w-lg h-full flex flex-col bg-white shadow-2xl">
                                <div className="p-6 border-b">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold text-[#1e293b]">{getStepTitle()}</h2>
                                            <p className="text-sm text-gray-500 mt-1">{getStepDescription()}</p>
                                        </div>
                                        <button onClick={closeDrawer} className="p-2 -mr-2 rounded-lg hover:bg-gray-100">
                                            <FiXTyped />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto">
                                    {addReceiverStep === 'select' && renderSelectStep()}
                                    {addReceiverStep === 'add' && renderAddStep()}
                                    {(addReceiverStep === 'success' || addReceiverStep === 'failure') && renderSuccessStep()}
                                </div>

                                <div className="p-6 border-t bg-gray-50">
                                    {addReceiverStep === 'select' && (
                                        <button onClick={() => dispatch(setAddReceiverStep('add'))} className="btn btn-primary w-full">
                                            <FiUserPlusTyped className="mr-2" /> Add New Contact
                                        </button>
                                    )}
                                    {addReceiverStep === 'add' && (
                                        <div className="flex gap-3 justify-end">
                                            <button onClick={() => dispatch(setAddReceiverStep('select'))} className="btn btn-secondary">
                                                <FiArrowLeftTyped className="mr-2" /> Back
                                            </button>
                                            <button onClick={handleCreateContact} disabled={addReceiverLoading} className="btn btn-primary">
                                                {addReceiverLoading ? <FiLoaderTyped className="animate-spin" /> : 'Create and Add'}
                                            </button>
                                        </div>
                                    )}
                                    {(addReceiverStep === 'success' || addReceiverStep === 'failure') && (
                                        <button onClick={closeDrawer} className="btn btn-primary w-full">
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Transition.Child>
                    </section>
                </div>
            </div>
        </Transition>
    );
};

export default AddReceiverDrawer;
