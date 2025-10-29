import React, { ComponentType, Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { AppDispatch, IRootState } from '../../../store';
import { setAddReceiverDrawerOpen, setAddReceiverStep, setSelectedAddReceiverContact, updateReassignFormField } from '../../../store/slices/participantSlice';
import { fetchReassignmentContacts, createContactForReassignment, addReceiverByParticipant } from '../../../store/thunk/participantThunks';
import { FiX, FiCheckCircle, FiChevronRight, FiUserPlus, FiSearch, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-number-input';
import { E164Number } from 'libphonenumber-js/core';
import 'react-phone-number-input/style.css';
import { ReassignmentContact } from '../../../store/slices/participantSlice';
import { useTranslation } from 'react-i18next';

// Typed Icons
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiChevronRightTyped = FiChevronRight as ComponentType<{ className?: string }>;
const FiUserPlusTyped = FiUserPlus as ComponentType<{ className?: string }>;
const FiSearchTyped = FiSearch as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;

const AddReceiverDrawer: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { packageData } = useSelector((state: IRootState) => state.participant);
    const { isAddReceiverDrawerOpen, addReceiverStep, addReceiverLoading, addReceiverError, reassignmentContacts, selectedAddReceiverContact, reassignFormData } = useSelector(
        (state: IRootState) => state.participant.uiState
    );

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

    const handleSelectContact = (contact: ReassignmentContact) => {
        dispatch(setSelectedAddReceiverContact(contact));
        handlePerformAddReceiver(contact._id);
    };

    const handleCreateContact = async () => {
        const { email, firstName, lastName } = reassignFormData;
        if (!email.trim() || !firstName.trim() || !lastName.trim()) {
            return toast.error(t('addReceiverDrawer.errors.missingFields') as string);
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

            if (createContactForReassignment.fulfilled.match(resultAction)) {
                const newContact = resultAction.payload.data.contact;
                dispatch(setSelectedAddReceiverContact(newContact));
                handlePerformAddReceiver(newContact._id);
            }
        } catch (err) {
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
            // Error handled by extraReducer
        }
    };

    const filteredContacts = reassignmentContacts.filter(
        (c) => c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStepTitle = () => {
        switch (addReceiverStep) {
            case 'select':
                return t('addReceiverDrawer.steps.select.title');
            case 'add':
                return t('addReceiverDrawer.steps.add.title');
            case 'success':
                return t('addReceiverDrawer.steps.success.title');
            case 'failure':
                return t('addReceiverDrawer.steps.failure.title');
            default:
                return t('addReceiverDrawer.steps.default.title');
        }
    };

    const getStepDescription = () => {
        switch (addReceiverStep) {
            case 'select':
                return t('addReceiverDrawer.steps.select.description');
            case 'add':
                return t('addReceiverDrawer.steps.add.description');
            case 'success':
                return t('addReceiverDrawer.steps.success.description');
            case 'failure':
                return addReceiverError || t('addReceiverDrawer.steps.failure.description');
            default:
                return t('addReceiverDrawer.steps.default.description');
        }
    };

    // Handle Enter key for add step
    const handleAddStepKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !addReceiverLoading) {
            e.preventDefault();
            const { email, firstName, lastName } = reassignFormData;
            if (email.trim() && firstName.trim() && lastName.trim()) {
                handleCreateContact();
            }
        }
    };

    const renderSelectStep = () => (
        <div className="space-y-6">
            <div className="relative">
                <FiSearchTyped className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder={t('addReceiverDrawer.steps.select.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                />
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {addReceiverLoading && addReceiverStep === 'select' ? (
                    <div className="flex items-center justify-center py-10 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
                        <FiLoaderTyped className="animate-spin w-6 h-6 text-[#1e293b] mr-2" />
                        <span className="text-gray-600">{t('addReceiverDrawer.steps.select.loading')}</span>
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
                        <p className="text-sm text-gray-600">{t('addReceiverDrawer.steps.select.noContacts')}</p>
                    </div>
                )}
            </div>

            {/* Action Button - Inline with content */}
            <button
                onClick={() => dispatch(setAddReceiverStep('add'))}
                className="w-full px-4 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
            >
                <FiUserPlusTyped className="w-5 h-5 mr-2" /> {t('addReceiverDrawer.steps.select.addButton')}
            </button>
        </div>
    );

    const renderAddStep = () => (
        <div className="space-y-6" onKeyPress={handleAddStepKeyPress}>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-600">{t('addReceiverDrawer.steps.add.description')}</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-2">{t('addReceiverDrawer.steps.add.emailLabel')}*</label>
                <input
                    type="email"
                    value={reassignFormData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                    placeholder={t('addReceiverDrawer.steps.add.emailPlaceholder')}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[#1e293b] mb-2">{t('addReceiverDrawer.steps.add.firstNameLabel')}*</label>
                    <input
                        type="text"
                        value={reassignFormData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                        placeholder={t('addReceiverDrawer.steps.add.firstNamePlaceholder')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#1e293b] mb-2">{t('addReceiverDrawer.steps.add.lastNameLabel')}*</label>
                    <input
                        type="text"
                        value={reassignFormData.lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 shadow-sm"
                        placeholder={t('addReceiverDrawer.steps.add.lastNamePlaceholder')}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-2">{t('addReceiverDrawer.steps.add.phoneLabel')}</label>
                <PhoneInput
                    placeholder={t('addReceiverDrawer.steps.add.phonePlaceholder')}
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
                    onClick={() => dispatch(setAddReceiverStep('select'))}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                    {t('addReceiverDrawer.steps.add.backButton')}
                </button>
                <button
                    onClick={handleCreateContact}
                    disabled={addReceiverLoading || !reassignFormData.email.trim() || !reassignFormData.firstName.trim() || !reassignFormData.lastName.trim()}
                    className="flex-1 px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center"
                >
                    {addReceiverLoading ? <FiLoaderTyped className="animate-spin w-5 h-5" /> : t('addReceiverDrawer.steps.add.createButton')}
                </button>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <FiCheckCircleTyped className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-[#1e293b] mb-3">{t('addReceiverDrawer.steps.success.title')}</h3>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">
                    <strong>
                        {selectedAddReceiverContact?.firstName} {selectedAddReceiverContact?.lastName}
                    </strong>{' '}
                    {t('addReceiverDrawer.steps.success.message')}
                </p>
                <p className="text-sm text-gray-500 mt-2">{selectedAddReceiverContact?.email}</p>
                <p className="text-xs text-gray-500 mt-2">{t('addReceiverDrawer.steps.success.notification')}</p>
            </div>

            {/* Action Button - Inline with content */}
            <button onClick={closeDrawer} className="w-full px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md">
                {t('addReceiverDrawer.steps.success.backButton')}
            </button>
        </div>
    );

    const renderFailureStep = () => (
        <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangleTyped className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-[#1e293b] mb-3">{t('addReceiverDrawer.steps.failure.title')}</h3>
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">{addReceiverError || t('addReceiverDrawer.steps.failure.description')}</p>
            </div>

            {/* Action Button - Inline with content */}
            <button onClick={closeDrawer} className="w-full px-6 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md">
                {t('addReceiverDrawer.steps.failure.closeButton')}
            </button>
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
                                            <button
                                                onClick={closeDrawer}
                                                className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200"
                                                title={t('addReceiverDrawer.close')}
                                            >
                                                <FiChevronRightTyped className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content Area */}
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="px-4 sm:px-6 py-6 max-w-xl mx-auto">
                                            {addReceiverStep === 'select' && renderSelectStep()}
                                            {addReceiverStep === 'add' && renderAddStep()}
                                            {addReceiverStep === 'success' && renderSuccessStep()}
                                            {addReceiverStep === 'failure' && renderFailureStep()}
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

export default AddReceiverDrawer;
