import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ComponentType } from 'react';
import { FiXCircle, FiCheckCircle, FiShare2, FiAlertTriangle, FiClock, FiUser, FiSave, FiUserPlus } from 'react-icons/fi';
import { AppDispatch, IRootState } from '../../store';
import { setRejectModalOpen, setSigningDrawerOpen, setReassignDrawerOpen, setActiveSigningFieldId, setActiveParticipantId, setAddReceiverDrawerOpen } from '../../store/slices/participantSlice';
import { submitParticipantFields } from '../../store/thunk/participantThunks';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Typed icons
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiShare2Typed = FiShare2 as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiUserTyped = FiUser as ComponentType<{ className?: string }>;
const FiSaveTyped = FiSave as ComponentType<{ className?: string }>;
const FiUserPlusTyped = FiUserPlus as ComponentType<{ className?: string }>;

interface ActionSidebarProps {
    allowReassign: boolean;
    allowReceiversToAdd: boolean;
    currentUserTasksCompleted: boolean;
}

const ActionSidebar: React.FC<ActionSidebarProps> = ({ allowReassign, allowReceiversToAdd, currentUserTasksCompleted }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { packageData, fieldValues, uiState, loading } = useSelector((state: IRootState) => state.participant);
    const { hasAgreedToTerms } = uiState;

    // Check if package is in a final state
    const isFinalized = packageData?.status === 'Completed' || packageData?.status === 'Rejected' || packageData?.status === 'Revoked';
    const isCurrentUserReceiver = packageData?.currentUser?.role === 'Receiver';

    // Check if there are any unsaved field changes
    const hasUnsavedChanges = React.useMemo(() => {
        if (!packageData || isFinalized) return false;

        return packageData.fields.some((field) => {
            if (!field.isAssignedToCurrentUser) return false;

            const currentValue = fieldValues[field.id];
            const savedValue = field.value;

            // Compare current field value with saved value
            if (currentValue !== savedValue) {
                if (typeof currentValue === 'string' && typeof savedValue === 'string') {
                    return currentValue.trim() !== savedValue.trim();
                }
                return true;
            }
            return false;
        });
    }, [packageData, fieldValues, isFinalized]);

    // Check if current user has any signature fields assigned
    const hasSignatureFieldAssigned = React.useMemo(() => {
        if (!packageData || isFinalized) return false;
        return packageData.fields.some((field) => field.type === 'signature' && field.isAssignedToCurrentUser);
    }, [packageData, isFinalized]);

    // Enable the Sign button only if terms are agreed, there is a signature field, and package is not finalized
    const canSign = hasAgreedToTerms && hasSignatureFieldAssigned && !isFinalized;

    // Handle saving field values
    const handleSaveFields = async () => {
        if (!packageData || !hasUnsavedChanges || isFinalized) return;

        try {
            const result = await dispatch(
                submitParticipantFields({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                    fieldValues: fieldValues,
                })
            ).unwrap();

            toast.success(t('actionSidebar.save.success') as string);
        } catch (error) {
            console.error('Failed to save fields:', error);
            toast.error(t('actionSidebar.save.error') as string);
        }
    };

    const handleSignClick = () => {
        if (isFinalized) {
            toast.info(t('actionSidebar.sign.finalized', { status: packageData?.status.toLowerCase() }) as string);
            return;
        }

        if (hasUnsavedChanges) {
            toast.warn(t('actionSidebar.sign.saveFirst') as string);
            return;
        }

        if (!hasSignatureFieldAssigned) {
            toast.info(t('actionSidebar.sign.noSignatureFields') as string);
            return;
        }

        if (!hasAgreedToTerms) {
            toast.warn(t('actionSidebar.sign.agreeTerms') as string);
            const termsSection = document.getElementById('terms-checkbox-section');
            if (termsSection) {
                termsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                termsSection.classList.add('highlight-animation');
                setTimeout(() => {
                    termsSection.classList.remove('highlight-animation');
                }, 2000);
            }
            return;
        }

        const firstUnsignedSignatureField = packageData?.fields.find((field) => {
            if (field.type !== 'signature' || !field.isAssignedToCurrentUser) return false;

            const fieldValue = fieldValues[field.id];
            return !fieldValue || typeof fieldValue !== 'object' || !fieldValue.signedBy;
        });

        if (!packageData || !firstUnsignedSignatureField) {
            toast.info(t('actionSidebar.sign.allSigned') as string);
            return;
        }

        const assignedUser = firstUnsignedSignatureField.assignedUsers.find(
            (au) => au.contactEmail && packageData.currentUser.contactEmail && au.contactEmail === packageData.currentUser.contactEmail
        );

        if (assignedUser) {
            dispatch(setActiveSigningFieldId(firstUnsignedSignatureField.id));
            dispatch(setActiveParticipantId(assignedUser.id));
            dispatch(setSigningDrawerOpen(true));
        } else {
            toast.error(t('actionSidebar.sign.error') as string);
        }
    };

    const handleRejectClick = () => {
        if (isFinalized) {
            toast.info(t('actionSidebar.reject.finalized', { status: packageData?.status.toLowerCase() }) as string);
            return;
        }
        dispatch(setRejectModalOpen(true));
    };

    const handleReassignClick = () => {
        if (isFinalized) {
            toast.info(t('actionSidebar.reassign.finalized', { status: packageData?.status.toLowerCase() }) as string);
            return;
        }
        dispatch(setReassignDrawerOpen(true));
    };

    const handleAddReceiverClick = () => {
        if (isFinalized) return;
        dispatch(setAddReceiverDrawerOpen(true));
    };

    const getSignButtonTooltip = () => {
        if (isFinalized) return t('actionSidebar.sign.finalized', { status: packageData?.status.toLowerCase() });
        if (hasUnsavedChanges) return t('actionSidebar.sign.saveFirst');
        if (!hasSignatureFieldAssigned) return t('actionSidebar.sign.noSignatureFields');
        if (!hasAgreedToTerms) return t('actionSidebar.sign.agreeTerms');
        return t('actionSidebar.sign.ready');
    };

    const getSaveButtonTooltip = () => {
        if (isFinalized) return t('actionSidebar.save.finalized', { status: packageData?.status.toLowerCase() });
        if (!hasUnsavedChanges) return t('actionSidebar.save.noChanges');
        if (loading) return t('actionSidebar.save.saving');
        return t('actionSidebar.save.saveChanges');
    };

    const getRejectButtonTooltip = () => {
        if (isFinalized) return t('actionSidebar.reject.finalized', { status: packageData?.status.toLowerCase() });
        return t('actionSidebar.reject.label');
    };

    const getReassignButtonTooltip = () => {
        if (isFinalized) return t('actionSidebar.reassign.finalized', { status: packageData?.status.toLowerCase() });
        if (currentUserTasksCompleted) return t('actionSidebar.reassign.completed');
        return t('actionSidebar.reassign.label');
    };

    const getProgressStatus = () => {
        if (isFinalized)
            return {
                text: t('actionSidebar.progress.finalized', { status: packageData?.status }),
                color: packageData?.status === 'Completed' ? 'green' : 'red',
                icon: packageData?.status === 'Completed' ? FiCheckCircleTyped : FiXCircleTyped,
            };
        if (hasUnsavedChanges) return { text: t('actionSidebar.progress.unsaved'), color: 'orange', icon: FiSaveTyped };
        if (canSign) return { text: t('actionSidebar.progress.readyToSign'), color: 'green', icon: FiCheckCircleTyped };
        if (hasAgreedToTerms && hasSignatureFieldAssigned) return { text: t('actionSidebar.progress.readyToSign'), color: 'green', icon: FiCheckCircleTyped };
        if (hasAgreedToTerms) return { text: t('actionSidebar.progress.noSignature'), color: 'blue', icon: FiUserTyped };
        return { text: t('actionSidebar.progress.reviewTerms'), color: 'gray', icon: FiAlertTriangleTyped };
    };

    const progressStatus = getProgressStatus();
    const IconComponent = progressStatus.icon;

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-24 xl:w-28 bg-white border-l border-gray-200 flex-shrink-0 items-center justify-center shadow-sm">
                <div className="flex flex-col gap-6 p-4">
                    {/* Save Button (only show if there are unsaved changes) */}
                    {hasUnsavedChanges && (
                        <div className="group relative">
                            <button
                                onClick={handleSaveFields}
                                disabled={loading || isFinalized}
                                className={`flex flex-col items-center justify-center w-16 h-16 xl:w-18 xl:h-18 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                                    loading || isFinalized
                                        ? 'bg-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-60 text-white'
                                        : 'text-orange-600 bg-orange-50 border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-100 hover:shadow-lg'
                                }`}
                                title={getSaveButtonTooltip()}
                            >
                                <FiSaveTyped className="w-6 h-6 xl:w-7 xl:h-7 mb-1" />
                                <span className="text-xs font-semibold">{loading ? t('actionSidebar.save.saving') : t('actionSidebar.save.label')}</span>
                            </button>

                            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                {getSaveButtonTooltip()}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                            </div>
                        </div>
                    )}

                    {/* Reject Button */}
                    <div className="group relative">
                        <button
                            onClick={handleRejectClick}
                            disabled={currentUserTasksCompleted || isFinalized || isCurrentUserReceiver}
                            className={`flex flex-col items-center justify-center w-16 h-16 xl:w-18 xl:h-18 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                                currentUserTasksCompleted || isFinalized || isCurrentUserReceiver
                                    ? 'bg-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-60 text-white'
                                    : 'text-red-600 bg-red-50 border-2 border-red-100 hover:border-red-300 hover:bg-red-100 hover:shadow-lg'
                            }`}
                            title={getRejectButtonTooltip()}
                        >
                            <FiXCircleTyped className="w-6 h-6 xl:w-7 xl:h-7 mb-1" />
                            <span className="text-xs font-semibold">{t('actionSidebar.reject.label')}</span>
                        </button>

                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {getRejectButtonTooltip()}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                        </div>
                    </div>

                    {/* Sign Button */}
                    <div className="group relative">
                        <button
                            onClick={handleSignClick}
                            disabled={!canSign}
                            className={`flex flex-col items-center justify-center w-16 h-16 xl:w-18 xl:h-18 rounded-2xl text-white transition-all duration-300 shadow-lg relative overflow-hidden ${
                                canSign
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-400 hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer'
                                    : 'bg-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-60'
                            }`}
                            title={getSignButtonTooltip()}
                        >
                            {canSign && <div className="absolute inset-0 bg-green-300 rounded-2xl animate-pulse opacity-30"></div>}
                            <FiCheckCircleTyped className="w-6 h-6 xl:w-7 xl:h-7 mb-1 relative z-10" />
                            <span className="text-xs font-semibold relative z-10">{t('actionSidebar.sign.label')}</span>
                            {canSign && <div className="absolute inset-0 -top-4 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 animate-shimmer"></div>}
                        </button>

                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg max-w-48">
                            {getSignButtonTooltip()}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                        </div>
                    </div>

                    {/* Reassign Button */}
                    {allowReassign && !isCurrentUserReceiver && (
                        <div className="group relative">
                            <button
                                onClick={handleReassignClick}
                                disabled={isFinalized || currentUserTasksCompleted}
                                className={`flex flex-col items-center justify-center w-16 h-16 xl:w-18 xl:h-18 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                                    isFinalized || currentUserTasksCompleted
                                        ? 'bg-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-60 text-white'
                                        : 'text-[#1e293b] bg-blue-50 border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-100 hover:shadow-lg'
                                }`}
                                title={getReassignButtonTooltip()}
                            >
                                <FiShare2Typed className="w-6 h-6 xl:w-7 xl:h-7 mb-1" />
                                <span className="text-xs font-semibold">{t('actionSidebar.reassign.label')}</span>
                            </button>
                            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                {getReassignButtonTooltip()}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                            </div>
                        </div>
                    )}

                    {/* Add Receiver Button */}
                    {allowReceiversToAdd && isCurrentUserReceiver && (
                        <div className="group relative">
                            <button
                                onClick={handleAddReceiverClick}
                                disabled={isFinalized}
                                className={`flex flex-col items-center justify-center w-16 h-16 xl:w-18 xl:h-18 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                                    isFinalized
                                        ? 'bg-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-60 text-white'
                                        : 'text-teal-600 bg-teal-50 border-2 border-teal-100 hover:border-teal-300 hover:bg-teal-100 hover:shadow-lg'
                                }`}
                                title={isFinalized ? t('actionSidebar.addReceiver.finalized', { status: packageData?.status?.toLowerCase() }) : t('actionSidebar.addReceiver.label')}
                            >
                                <FiUserPlusTyped className="w-6 h-6 xl:w-7 xl:h-7 mb-1" />
                                <span className="text-xs font-semibold">{t('actionSidebar.addReceiver.label')}</span>
                            </button>
                            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                {t('actionSidebar.addReceiver.label')}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                            </div>
                        </div>
                    )}

                    {/* Progress Status */}
                    <div className="flex flex-col items-center pt-4 border-t border-gray-200">
                        <div
                            className={`w-4 h-4 rounded-full mb-2 flex items-center justify-center ${
                                progressStatus.color === 'green'
                                    ? 'bg-green-500'
                                    : progressStatus.color === 'red'
                                    ? 'bg-red-500'
                                    : progressStatus.color === 'amber'
                                    ? 'bg-amber-500'
                                    : progressStatus.color === 'blue'
                                    ? 'bg-blue-500'
                                    : progressStatus.color === 'orange'
                                    ? 'bg-orange-500'
                                    : 'bg-gray-400'
                            }`}
                        >
                            <IconComponent className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span
                            className={`text-xs font-medium text-center leading-tight ${
                                progressStatus.color === 'green'
                                    ? 'text-green-700'
                                    : progressStatus.color === 'red'
                                    ? 'text-red-700'
                                    : progressStatus.color === 'amber'
                                    ? 'text-amber-700'
                                    : progressStatus.color === 'blue'
                                    ? 'text-blue-700'
                                    : progressStatus.color === 'orange'
                                    ? 'text-orange-700'
                                    : 'text-gray-500'
                            }`}
                        >
                            {progressStatus.text}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Tablet Floating Actions */}
            <div className="hidden md:flex lg:hidden fixed bottom-6 right-6 flex-col gap-4 z-30">
                {/* Save Button */}
                {hasUnsavedChanges && (
                    <div className="group relative">
                        <button
                            onClick={handleSaveFields}
                            disabled={loading || isFinalized}
                            className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                                loading || isFinalized
                                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                                    : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-110 active:scale-95'
                            }`}
                            title={getSaveButtonTooltip()}
                        >
                            <FiSaveTyped className="w-6 h-6 relative z-10" />
                        </button>

                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                            {getSaveButtonTooltip()}
                        </div>
                    </div>
                )}

                {/* Sign Button */}
                <div className="group relative">
                    <button
                        onClick={handleSignClick}
                        disabled={!canSign}
                        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                            canSign
                                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl hover:scale-110 active:scale-95'
                                : 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                        }`}
                        title={getSignButtonTooltip()}
                    >
                        {canSign && <div className="absolute inset-0 bg-green-300 rounded-full animate-pulse opacity-30"></div>}
                        <FiCheckCircleTyped className="w-6 h-6 relative z-10" />
                    </button>

                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                        {getSaveButtonTooltip()}
                    </div>
                </div>

                {/* Reject Button */}
                <div className="group relative">
                    <button
                        onClick={handleRejectClick}
                        disabled={isFinalized || currentUserTasksCompleted || isCurrentUserReceiver}
                        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                            currentUserTasksCompleted || isFinalized || isCurrentUserReceiver
                                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                                : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-xl hover:scale-110 active:scale-95'
                        }`}
                        title={getRejectButtonTooltip()}
                    >
                        <FiXCircleTyped className="w-6 h-6" />
                    </button>

                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                        {getRejectButtonTooltip()}
                    </div>
                </div>

                {/* Reassign Button */}
                {allowReassign && !isCurrentUserReceiver && (
                    <div className="group relative">
                        <button
                            onClick={handleReassignClick}
                            disabled={isFinalized || currentUserTasksCompleted}
                            className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                                isFinalized || currentUserTasksCompleted
                                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                                    : 'bg-[#1e293b] text-white hover:bg-opacity-90 hover:shadow-xl hover:scale-110 active:scale-95'
                            }`}
                            title={getReassignButtonTooltip()}
                        >
                            <FiShare2Typed className="w-6 h-6" />
                        </button>

                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                            {getReassignButtonTooltip()}
                        </div>
                    </div>
                )}

                {/* Add Receiver Button */}
                {allowReceiversToAdd && isCurrentUserReceiver && (
                    <div className="group relative">
                        <button
                            onClick={handleAddReceiverClick}
                            disabled={isFinalized}
                            className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                                isFinalized ? 'bg-gray-400 text-white cursor-not-allowed opacity-60' : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-xl hover:scale-110 active:scale-95'
                            }`}
                            title={t('actionSidebar.addReceiver.label')}
                        >
                            <FiUserPlusTyped className="w-6 h-6" />
                        </button>
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                            {t('actionSidebar.addReceiver.label')}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30">
                {/* Status Bar */}
                <div
                    className={`px-4 py-2 text-center text-sm font-medium ${
                        progressStatus.color === 'green'
                            ? 'bg-green-50 text-green-700 border-b border-green-200'
                            : progressStatus.color === 'red'
                            ? 'bg-red-50 text-red-700 border-b border-red-200'
                            : progressStatus.color === 'amber'
                            ? 'bg-amber-50 text-amber-700 border-b border-amber-200'
                            : progressStatus.color === 'blue'
                            ? 'bg-blue-50 text-blue-700 border-b border-blue-200'
                            : progressStatus.color === 'orange'
                            ? 'bg-orange-50 text-orange-700 border-b border-orange-200'
                            : 'bg-gray-50 text-gray-600 border-b border-gray-200'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{progressStatus.text}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        {/* Save Button (mobile) */}
                        {hasUnsavedChanges && (
                            <button
                                onClick={handleSaveFields}
                                disabled={loading || isFinalized}
                                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 ${
                                    loading || isFinalized
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'text-orange-600 bg-orange-50 border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-100'
                                }`}
                            >
                                <FiSaveTyped className="w-5 h-5" />
                                <span>{loading ? t('actionSidebar.save.saving') : t('actionSidebar.save.label')}</span>
                            </button>
                        )}

                        {/* Reject Button */}
                        <button
                            onClick={handleRejectClick}
                            disabled={isCurrentUserReceiver || currentUserTasksCompleted || isFinalized}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 ${
                                currentUserTasksCompleted || isCurrentUserReceiver || isFinalized
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'text-red-600 bg-red-50 border-2 border-red-100 hover:border-red-300 hover:bg-red-100'
                            }`}
                            title={isCurrentUserReceiver ? t('actionSidebar.reject.receiversCannot') : t('actionSidebar.reject.label')}
                        >
                            <FiXCircleTyped className="w-5 h-5" />
                            <span>{t('actionSidebar.reject.label')}</span>
                        </button>

                        {/* Sign Button */}
                        <button
                            onClick={handleSignClick}
                            disabled={!canSign}
                            className={`flex-2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 active:scale-95 relative overflow-hidden min-w-0 ${
                                canSign ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {canSign && <div className="absolute inset-0 bg-green-400 animate-pulse opacity-20"></div>}
                            <FiCheckCircleTyped className="w-5 h-5 relative z-10 flex-shrink-0" />
                            <span className="relative z-10 truncate">
                                {hasUnsavedChanges ? t('actionSidebar.sign.saveFirst') : canSign ? t('actionSidebar.sign.ready') : t('actionSidebar.sign.agreeTerms')}
                            </span>
                        </button>

                        {/* Reassign Button (if allowed) */}
                        {allowReassign && !isCurrentUserReceiver && (
                            <button
                                onClick={handleReassignClick}
                                disabled={isFinalized || currentUserTasksCompleted}
                                title={getReassignButtonTooltip()}
                                className={`p-3.5 rounded-xl transition-all duration-200 active:scale-95 ${
                                    isFinalized || currentUserTasksCompleted
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'text-[#1e293b] bg-blue-50 border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-100'
                                }`}
                            >
                                <FiShare2Typed className="w-5 h-5" />
                            </button>
                        )}
                        {/* Add Receiver Button */}
                        {allowReceiversToAdd && isCurrentUserReceiver && (
                            <button
                                onClick={handleAddReceiverClick}
                                disabled={isFinalized}
                                title={isFinalized ? t('actionSidebar.addReceiver.finalized', { status: packageData?.status?.toLowerCase() }) : t('actionSidebar.addReceiver.label')}
                                className={`p-3.5 rounded-xl transition-all duration-200 active:scale-95 ${
                                    isFinalized ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-teal-600 bg-teal-50 border-2 border-teal-100 hover:border-teal-300 hover:bg-teal-100'
                                }`}
                            >
                                <FiUserPlusTyped className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Padding */}
            <div className="md:hidden h-32"></div>
        </>
    );
};

export default ActionSidebar;
