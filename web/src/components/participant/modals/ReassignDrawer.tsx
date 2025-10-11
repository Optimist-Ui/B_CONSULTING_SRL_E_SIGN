import React, { ComponentType, Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { AppDispatch, IRootState } from '../../../store';
import { setReassignDrawerOpen, updateReassignFormField, setReassignStep, setSelectedReassignContact, setReassignmentReason } from '../../../store/slices/participantSlice';
import { fetchReassignmentContacts, createContactForReassignment, performReassignment } from '../../../store/thunk/participantThunks';
import { FiX, FiCheckCircle, FiChevronRight, FiUserPlus, FiSearch, FiArrowLeft, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { E164Number } from 'libphonenumber-js/core';

// Typed Icons
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiChevronRightTyped = FiChevronRight as ComponentType<{ className?: string }>;
const FiUserPlusTyped = FiUserPlus as ComponentType<{ className?: string }>;
const FiSearchTyped = FiSearch as ComponentType<{ className?: string }>;
const FiArrowLeftTyped = FiArrowLeft as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;

const ReassignDrawer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { packageData } = useSelector((state: IRootState) => state.participant);
    const { isReassignDrawerOpen, reassignStep, reassignFormData, reassignmentContacts, selectedReassignContact, reassignmentLoading, reassignmentError } = useSelector(
        (state: IRootState) => state.participant.uiState
    );

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isReassignDrawerOpen && reassignStep === 'select' && packageData) {
            dispatch(fetchReassignmentContacts({ packageId: packageData._id, participantId: packageData.currentUser.id }));
        }
    }, [isReassignDrawerOpen, reassignStep, packageData, dispatch]);

    useEffect(() => {
        if (reassignmentError) {
            toast.error(reassignmentError);
        }
    }, [reassignmentError]);

    const closeDrawer = () => dispatch(setReassignDrawerOpen(false));

    const handleFieldChange = (field: keyof typeof reassignFormData, value: string) => {
        dispatch(updateReassignFormField({ field, value }));
    };

    const handleSelectContact = (contact: (typeof reassignmentContacts)[0]) => {
        dispatch(setSelectedReassignContact(contact));
        dispatch(setReassignStep('confirm'));
    };

    const handleCreateContact = async () => {
        const { email, firstName, lastName } = reassignFormData;
        if (!email.trim() || !firstName.trim() || !lastName.trim()) {
            return toast.error('Please provide first name, last name, and email.');
        }
        if (!packageData) return;

        try {
            await dispatch(
                createContactForReassignment({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                    contactData: reassignFormData,
                })
            ).unwrap();
            toast.success('Contact created successfully!');
        } catch (err) {
            console.error('Failed to create contact:', err);
        }
    };

    const handlePerformReassignment = async () => {
        if (!reassignFormData.reason.trim()) {
            return toast.error('A reason for reassignment is required.');
        }
        if (!packageData || !selectedReassignContact) return;

        try {
            await dispatch(
                performReassignment({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                    newContactId: selectedReassignContact._id,
                    reason: reassignFormData.reason,
                })
            ).unwrap();
            toast.success('Reassignment completed successfully!');
        } catch (err) {
            console.error('Failed to perform reassignment:', err);
        }
    };

    const filteredContacts = reassignmentContacts.filter(
        (c) => c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStepTitle = () => {
        switch (reassignStep) {
            case 'select':
                return 'Select Contact';
            case 'add':
                return 'Add New Contact';
            case 'confirm':
                return 'Confirm Reassignment';
            case 'success':
                return 'Reassignment Successful';
            default:
                return 'Reassign Responsibility';
        }
    };

    const getStepDescription = () => {
        switch (reassignStep) {
            case 'select':
                return 'Choose a contact to reassign your responsibility to';
            case 'add':
                return 'Enter details for the new contact';
            case 'confirm':
                return 'Review and confirm the reassignment';
            case 'success':
                return 'Your responsibility has been successfully reassigned';
            default:
                return 'Transfer your tasks to another person';
        }
    };

    // Handle Enter key submission for add step
    const handleAddStepKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !reassignmentLoading) {
            e.preventDefault();
            const { email, firstName, lastName } = reassignFormData;
            if (email.trim() && firstName.trim() && lastName.trim()) {
                handleCreateContact();
            }
        }
    };

    // Handle Enter key submission for confirm step
    const handleConfirmStepKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !reassignmentLoading && reassignFormData.reason.trim()) {
            e.preventDefault();
            handlePerformReassignment();
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
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {reassignmentLoading ? (
                    <div className="flex items-center justify-center py-10 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
                        <FiLoaderTyped className="animate-spin w-6 h-6 text-[#1e293b] mr-2" />
                        <span className="text-gray-600">Loading Contacts...</span>
                    </div>
                ) : filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                        <button
                            key={contact._id}
                            onClick={() => handleSelectContact(contact)}
                            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FiUserPlusTyped className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-[#1e293b]">
                                        {contact.firstName} {contact.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">{contact.email}</p>
                                </div>
                            </div>
                            <FiChevronRightTyped className="w-5 h-5 text-gray-500" />
                        </button>
                    ))
                ) : (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <FiAlertTriangleTyped className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No contacts found.</p>
                    </div>
                )}
            </div>

            {/* Action Button - Inline with content */}
            <button
                onClick={() => dispatch(setReassignStep('add'))}
                className="w-full px-4 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
            >
                <FiUserPlusTyped className="w-5 h-5 mr-2" /> Add New Contact
            </button>
        </div>
    );

    const renderAddStep = () => (
        <div className="space-y-6" onKeyPress={handleAddStepKeyPress}>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-600">Enter the details of the new contact to whom you want to reassign your responsibility.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-2">New Participant's Email*</label>
                <input
                    type="email"
                    value={reassignFormData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                    placeholder="name@example.com"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[#1e293b] mb-2">First Name*</label>
                    <input
                        type="text"
                        value={reassignFormData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                        placeholder="First name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#1e293b] mb-2">Last Name*</label>
                    <input
                        type="text"
                        value={reassignFormData.lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                        placeholder="Last name"
                    />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                />
            </div>

            {/* Action Buttons - Inline with content */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                    onClick={() => dispatch(setReassignStep('select'))}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                    Back
                </button>
                <button
                    onClick={handleCreateContact}
                    disabled={reassignmentLoading || !reassignFormData.email.trim() || !reassignFormData.firstName.trim() || !reassignFormData.lastName.trim()}
                    className="flex-1 px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                >
                    {reassignmentLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : 'Create and Select Contact'}
                </button>
            </div>
        </div>
    );

    const renderConfirmStep = () => (
        <div className="space-y-6" onKeyPress={handleConfirmStepKeyPress}>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">You are about to reassign your responsibility to the following contact. This action cannot be undone.</p>
                <p className="font-semibold text-[#1e293b] text-lg">
                    {selectedReassignContact?.firstName} {selectedReassignContact?.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedReassignContact?.email}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-2">Reason for Reassignment*</label>
                <textarea
                    value={reassignFormData.reason}
                    onChange={(e) => dispatch(setReassignmentReason(e.target.value))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm resize-none"
                    placeholder="Please provide a brief reason..."
                />
            </div>

            {/* Action Buttons - Inline with content */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                    onClick={() => dispatch(setReassignStep('select'))}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                    Back
                </button>
                <button
                    onClick={handlePerformReassignment}
                    disabled={reassignmentLoading || !reassignFormData.reason.trim()}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                >
                    {reassignmentLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : 'Confirm Reassignment'}
                </button>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <FiCheckCircleTyped className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-[#1e293b] mb-3">Reassignment Successful!</h3>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">Your responsibility for this document has been transferred to:</p>
                <p className="font-semibold text-[#1e293b] mt-1">{selectedReassignContact?.email}</p>
                <p className="text-xs text-gray-500 mt-2">All parties will be notified of this change.</p>
            </div>

            {/* Action Button - Inline with content */}
            <button onClick={closeDrawer} className="w-full px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md">
                Back to Document
            </button>
        </div>
    );

    return (
        <Transition show={isReassignDrawerOpen} as={Fragment}>
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
                            <div className="w-screen max-w-md sm:max-w-lg">
                                {/* Full height white background container */}
                                <div className="h-full flex flex-col bg-white shadow-2xl">
                                    {/* Fixed Header */}
                                    <div className="px-4 sm:px-6 py-6 border-b border-gray-200 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-semibold text-[#1e293b]">{getStepTitle()}</h2>
                                                <p className="text-sm text-gray-500 mt-1">{getStepDescription()}</p>
                                            </div>
                                            <button onClick={closeDrawer} className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200">
                                                <FiChevronRightTyped className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content Area - Takes remaining space */}
                                    <div className="flex-1 overflow-y-auto">
                                        {/* Content positioned at top-to-center with max-width for better UX */}
                                        <div className="px-4 sm:px-6 py-6 max-w-xl mx-auto">
                                            {reassignStep === 'select' && renderSelectStep()}
                                            {reassignStep === 'add' && renderAddStep()}
                                            {reassignStep === 'confirm' && renderConfirmStep()}
                                            {reassignStep === 'success' && renderSuccessStep()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Transition.Child>
                    </section>
                </div>
            </div>
        </Transition>
    );
};

export default ReassignDrawer;
