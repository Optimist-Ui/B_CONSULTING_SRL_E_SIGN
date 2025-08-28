import React, { useState, useEffect, useCallback, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../../store';
import { setFieldValue, setSigningDrawerOpen, setActiveSigningFieldId, setActiveParticipantId, SignatureValue } from '../../../store/slices/participantSlice';
import { ParticipantPackageField, RejectionDetails } from '../../../store/slices/participantSlice';
import { FiEdit3, FiSave, FiFileText, FiCalendar, FiSquare, FiCheckSquare, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { FaSignature, FaPen } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Typed Icons
const FiEdit3Typed = FiEdit3 as ComponentType<{ className?: string }>;
const FiSaveTyped = FiSave as ComponentType<{ className?: string }>;
const FaSignatureTyped = FaSignature as ComponentType<{ className?: string }>;
const FaPenTyped = FaPen as ComponentType<{ className?: string }>;
const FiFileTextTyped = FiFileText as ComponentType<{ className?: string }>;
const FiCalendarTyped = FiCalendar as ComponentType<{ className?: string }>;
const FiSquareTyped = FiSquare as ComponentType<{ className?: string }>;
const FiCheckSquareTyped = FiCheckSquare as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;

interface InteractiveFieldProps {
    field: ParticipantPackageField;
    value: any;
    rejectionDetails?: RejectionDetails;
    packageStatus?: string;
}

const InteractiveField: React.FC<InteractiveFieldProps> = ({ field, value, rejectionDetails, packageStatus }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { packageData, uiState } = useSelector((state: IRootState) => state.participant);
    const { hasAgreedToTerms } = uiState;

    // Only use localValue and isEditing for text-based fields
    const [localValue, setLocalValue] = useState<string | undefined>(field.type !== 'signature' && field.type !== 'checkbox' ? value ?? '' : undefined);
    const [isEditing, setIsEditing] = useState<boolean>(field.type !== 'signature' && field.type !== 'checkbox' ? !(value !== undefined && value !== '' && value !== false) : false);

    useEffect(() => {
        if (field.type !== 'signature' && field.type !== 'checkbox') {
            setLocalValue(value ?? '');
            const hasInitialValue = value !== undefined && value !== null && value !== '' && value !== false;
            setIsEditing(!hasInitialValue);
        }
    }, [value, field.type]);

    // Check if this field is assigned to the person who rejected the package
    const isAssignedToRejecter = () => {
        if (!rejectionDetails || packageStatus !== 'Rejected') return false;

        return field.assignedUsers.some((user) => user.contactEmail === rejectionDetails.rejectedBy.contactEmail || user.contactId === rejectionDetails.rejectedBy.contactId);
    };

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setFieldValue({ fieldId: field.id, value: e.target.checked }));
    };

    const handleFinalize = () => {
        dispatch(setFieldValue({ fieldId: field.id, value: localValue }));
        setIsEditing(false);
    };

    const handleSignatureClick = useCallback(() => {
        if (!hasAgreedToTerms) {
            toast.warn('Please agree to the Terms of Use at the bottom of the document before signing.');
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

        if (!packageData) {
            toast.error('Error: Document data not available.');
            return;
        }

        const assignedUser = field.assignedUsers.find(
            (au) => au.id === packageData.currentUser.id || (au.contactEmail && packageData.currentUser.contactEmail && au.contactEmail === packageData.currentUser.contactEmail)
        );

        if (!assignedUser) {
            toast.error('Error: Unable to find participant assignment.');
            return;
        }

        dispatch(setActiveSigningFieldId(field.id));
        dispatch(setActiveParticipantId(assignedUser.id));
        dispatch(setSigningDrawerOpen(true));
    }, [dispatch, hasAgreedToTerms, field, packageData]);

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        boxSizing: 'border-box',
    };

    const getFieldIcon = () => {
        switch (field.type) {
            case 'text':
                return <FiFileTextTyped className="w-3 h-3 text-blue-600" />;
            case 'date':
                return <FiCalendarTyped className="w-3 h-3 text-purple-600" />;
            case 'textarea':
                return <FiFileTextTyped className="w-3 h-3 text-blue-600" />;
            case 'checkbox':
                return value ? <FiCheckSquareTyped className="w-3 h-3 text-green-600" /> : <FiSquareTyped className="w-3 h-3 text-gray-500" />;
            case 'signature':
                return <FaSignatureTyped className="w-3 h-3 text-indigo-600" />;
            default:
                return <FiFileTextTyped className="w-3 h-3 text-gray-500" />;
        }
    };

    const getFieldColor = () => {
        // If this field is assigned to the rejecter, use red colors
        if (isAssignedToRejecter()) {
            return {
                editing: 'border-red-400 bg-red-50/80 focus-within:border-red-500 focus-within:ring-red-200',
                finalized: 'border-red-400 bg-red-50/80',
                button: 'bg-red-500 hover:bg-red-600',
            };
        }

        switch (field.type) {
            case 'text':
                return {
                    editing: 'border-blue-300 bg-blue-50/80 focus-within:border-blue-500 focus-within:ring-blue-200',
                    finalized: 'border-green-300 bg-green-50/80',
                    button: 'bg-blue-500 hover:bg-blue-600',
                };
            case 'date':
                return {
                    editing: 'border-purple-300 bg-purple-50/80 focus-within:border-purple-500 focus-within:ring-purple-200',
                    finalized: 'border-green-300 bg-green-50/80',
                    button: 'bg-purple-500 hover:bg-purple-600',
                };
            case 'textarea':
                return {
                    editing: 'border-blue-300 bg-blue-50/80 focus-within:border-blue-500 focus-within:ring-blue-200',
                    finalized: 'border-green-300 bg-green-50/80',
                    button: 'bg-blue-500 hover:bg-blue-600',
                };
            case 'checkbox':
                return {
                    editing: 'border-amber-300 bg-amber-50/80 hover:bg-amber-100/80',
                    finalized: 'border-green-300 bg-green-50/80',
                    button: 'bg-amber-500 hover:bg-amber-600',
                };
            case 'signature':
                return {
                    editing: 'border-indigo-300 bg-indigo-50/80 hover:bg-indigo-100/80',
                    finalized: 'border-green-300 bg-green-50/80',
                    button: 'bg-indigo-500 hover:bg-indigo-600',
                };
            default:
                return {
                    editing: 'border-gray-300 bg-gray-50/80',
                    finalized: 'border-green-300 bg-green-50/80',
                    button: 'bg-gray-500 hover:bg-gray-600',
                };
        }
    };

    const colors = getFieldColor();
    const canBeFinalized = ['text', 'textarea', 'date'].includes(field.type);
    const showRejectionDetails = isAssignedToRejecter();

    // Show rejection details for interactive fields assigned to the rejecter
    if (showRejectionDetails && packageStatus === 'Rejected') {
        return (
            <div
                style={baseStyles}
                className="bg-red-50/80 border-2 border-red-400 rounded-lg shadow-sm backdrop-blur-sm flex flex-col overflow-hidden hover:shadow-md transition-all duration-200"
                title={`Field rejected by ${rejectionDetails!.rejectedBy.contactName}: ${rejectionDetails!.reason}`}
            >
                <div className="flex items-center justify-between px-2 py-1 bg-red-100/60 rounded-t-md border-b border-red-300 flex-shrink-0">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <FiXCircleTyped className="w-3 h-3 text-red-600 flex-shrink-0" />
                        <span className="text-xs font-semibold text-red-700 truncate leading-tight">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FiAlertTriangleTyped className="w-3 h-3 text-red-600" />
                    </div>
                </div>
                <div className="flex-grow flex flex-col p-2 min-h-0">
                    <div className="flex items-center gap-1 mb-1">
                        <FiXCircleTyped className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Document Rejected</span>
                    </div>
                    <div className="text-xs text-red-700 space-y-1">
                        <p className="font-semibold truncate">By: {rejectionDetails!.rejectedBy.contactName}</p>
                        <p className="text-red-600 text-[10px]">{new Date(rejectionDetails!.rejectedAt).toLocaleString()}</p>
                    </div>
                    {rejectionDetails!.reason && (
                        <div className="mt-1 flex-grow">
                            <p className="text-[10px] text-red-600 font-medium mb-0.5">Reason:</p>
                            <p className="text-xs text-red-700 leading-tight break-words">{rejectionDetails!.reason}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (canBeFinalized && !isEditing) {
        return (
            <div style={baseStyles} className={`${colors.finalized} border-2 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md`}>
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/40 rounded-t-md border-b border-green-200">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFieldIcon()}
                        <span className="text-xs font-semibold text-slate-700 truncate">
                            {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md hover:bg-green-200/60 transition-colors group" title="Edit field">
                        <FiEdit3Typed className="w-3.5 h-3.5 text-green-700 group-hover:text-green-800" />
                    </button>
                </div>
                <div className="px-3 py-2 flex-grow">
                    <div className="text-sm font-medium text-slate-800 break-words">
                        {field.type === 'textarea' ? <div className="whitespace-pre-wrap">{value.toString()}</div> : <div className="truncate">{value.toString()}</div>}
                    </div>
                </div>
            </div>
        );
    }

    switch (field.type) {
        case 'text':
        case 'date':
            return (
                <div
                    style={baseStyles}
                    className={`${colors.editing} border-2 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-opacity-50 focus-within:shadow-md`}
                >
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/40 rounded-t-md border-b border-current border-opacity-20">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getFieldIcon()}
                            <span className="text-xs font-semibold text-slate-700 truncate">
                                {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        </div>
                        <button onClick={handleFinalize} className={`${colors.button} text-white p-1.5 rounded-md transition-colors shadow-sm hover:shadow-md`} title="Save field">
                            <FiSaveTyped className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="px-3 py-2 flex-grow">
                        <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={localValue ?? ''}
                            onChange={handleLocalChange}
                            className="w-full h-full bg-transparent border-none outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                        />
                    </div>
                </div>
            );

        case 'textarea':
            return (
                <div
                    style={baseStyles}
                    className={`${colors.editing} border-2 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-opacity-50 focus-within:shadow-md flex flex-col`}
                >
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/40 rounded-t-md border-b border-current border-opacity-20 flex-shrink-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getFieldIcon()}
                            <span className="text-xs font-semibold text-slate-700 truncate">
                                {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        </div>
                        <button onClick={handleFinalize} className={`${colors.button} text-white p-1.5 rounded-md transition-colors shadow-sm hover:shadow-md`} title="Save field">
                            <FiSaveTyped className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="px-3 py-2 flex-grow">
                        <textarea
                            placeholder={field.placeholder}
                            value={localValue}
                            onChange={handleLocalChange}
                            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm font-medium text-slate-800 placeholder-slate-400"
                        />
                    </div>
                </div>
            );

        case 'checkbox':
            return (
                <label
                    style={baseStyles}
                    className={`${colors.editing} border-2 rounded-lg shadow-sm backdrop-blur-sm cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col overflow-hidden`}
                >
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/40 rounded-t-md border-b border-current border-opacity-20 flex-shrink-0">
                        {getFieldIcon()}
                        <span className="text-xs font-semibold text-slate-700 truncate leading-tight">
                            {field.label} {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                    </div>
                    <div className="flex-grow flex items-center justify-center p-1 min-h-0">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={handleCheckboxChange}
                            className="w-5 h-5 rounded border-2 border-amber-400 text-amber-500 focus:ring-amber-200 focus:ring-2 bg-white/80 transition-all duration-200 flex-shrink-0"
                        />
                    </div>
                </label>
            );

        // Updated signature field rendering section in InteractiveField.tsx

        case 'signature':
            const isSigned = value && typeof value === 'object' && value.signedBy;

            if (isSigned) {
                const signatureValue = value as SignatureValue;
                return (
                    <div style={baseStyles} className="border-2 border-green-400 bg-green-50/80 rounded-lg shadow-sm backdrop-blur-sm p-2 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5 text-green-700">
                            <FiCheckCircleTyped className="w-4 h-4 flex-shrink-0" />
                            <h4 className="font-bold text-xs uppercase tracking-wider">Signed Digitally</h4>
                        </div>
                        <div className="text-xs text-slate-700 space-y-0.5 pl-1">
                            <p className="font-semibold">{signatureValue.signedBy}</p>
                            {signatureValue.method === 'SMS OTP' && signatureValue.phone ? (
                                <p className="truncate text-gray-600">{signatureValue.phone}</p>
                            ) : (
                                <p className="truncate text-gray-600">{signatureValue.email}</p>
                            )}
                            <p className="text-gray-600">{new Date(signatureValue.date).toLocaleString()}</p>
                        </div>
                        <p className="text-right text-[10px] text-gray-500 mt-auto pt-1 font-semibold">via {signatureValue.method || 'Email OTP'} by SignatureFlow</p>
                    </div>
                );
            } else {
                // Get the signature method for this field
                const currentUserAssignment = field.assignedUsers.find((user) => user.contactId === packageData?.currentUser?.contactId);
                const signatureMethod = currentUserAssignment?.signatureMethod || 'Email OTP';

                // Display method-specific information
                const getSignatureMethodInfo = () => {
                    switch (signatureMethod) {
                        case 'SMS OTP':
                            return {
                                subtitle: 'Click to sign via SMS',
                                iconColor: 'text-green-600',
                                bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50',
                                borderColor: 'border-green-300',
                            };
                        case 'Email OTP':
                            return {
                                subtitle: 'Click to sign via email',
                                iconColor: 'text-indigo-600',
                                bgGradient: 'bg-gradient-to-br from-indigo-50 to-blue-50',
                                borderColor: 'border-indigo-300',
                            };
                        case 'Both':
                            return {
                                subtitle: 'Choose signing method',
                                iconColor: 'text-purple-600',
                                bgGradient: 'bg-gradient-to-br from-purple-50 to-indigo-50',
                                borderColor: 'border-purple-300',
                            };
                        default:
                            return {
                                subtitle: 'Click to sign',
                                iconColor: 'text-indigo-600',
                                bgGradient: 'bg-gradient-to-br from-indigo-50 to-blue-50',
                                borderColor: 'border-indigo-300',
                            };
                    }
                };

                const methodInfo = getSignatureMethodInfo();

                return (
                    <div
                        onClick={handleSignatureClick}
                        style={baseStyles}
                        className={`${methodInfo.borderColor} border-2 ${methodInfo.bgGradient} rounded-lg shadow-sm backdrop-blur-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] flex flex-col group overflow-hidden`}
                    >
                        <div className="flex items-center justify-between px-2 py-1 bg-white/40 rounded-t-md border-b border-current border-opacity-20 flex-shrink-0">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                {getFieldIcon()}
                                <span className="text-xs font-semibold text-slate-700 truncate leading-tight">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </span>
                            </div>
                            {signatureMethod && <span className="text-[10px] font-medium text-gray-600 bg-white/60 px-1.5 py-0.5 rounded-full">{signatureMethod}</span>}
                        </div>
                        <div className="flex-grow flex flex-col items-center justify-center p-2 group-hover:bg-white/20 transition-colors min-h-0">
                            <FaPenTyped className={`text-lg ${methodInfo.iconColor} mb-1 group-hover:scale-105 transition-transform flex-shrink-0`} />
                            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide text-center leading-tight">{methodInfo.subtitle}</span>
                        </div>
                    </div>
                );
            }

        default:
            return (
                <div style={baseStyles} className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 rounded-t-md border-b border-gray-300">
                        {getFieldIcon()}
                        <span className="text-xs font-semibold text-slate-700 truncate">
                            {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                    </div>
                    <div className="flex-grow flex items-center justify-center px-3 py-2">
                        <span className="text-xs text-gray-500 font-medium">Unsupported Field Type</span>
                    </div>
                </div>
            );
    }
};

export default InteractiveField;
