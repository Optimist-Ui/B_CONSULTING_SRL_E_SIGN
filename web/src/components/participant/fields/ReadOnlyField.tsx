import React, { ComponentType } from 'react';
import { ParticipantPackageField, SignatureValue, RejectionDetails } from '../../../store/slices/participantSlice';
import { FiFileText, FiCalendar, FiSquare, FiLock, FiUser, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { FaSignature } from 'react-icons/fa';

// Typed Icons
const FiFileTextTyped = FiFileText as ComponentType<{ className?: string }>;
const FiCalendarTyped = FiCalendar as ComponentType<{ className?: string }>;
const FiSquareTyped = FiSquare as ComponentType<{ className?: string }>;
const FiLockTyped = FiLock as ComponentType<{ className?: string }>;
const FiUserTyped = FiUser as ComponentType<{ className?: string }>;
const FaSignatureTyped = FaSignature as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;
const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;

interface ReadOnlyFieldProps {
    field: ParticipantPackageField;
    rejectionDetails?: RejectionDetails;
    packageStatus?: string;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ field, rejectionDetails, packageStatus }) => {
    const getFieldIcon = () => {
        switch (field.type) {
            case 'text':
                return <FiFileTextTyped className="w-3 h-3 text-gray-500" />;
            case 'date':
                return <FiCalendarTyped className="w-3 h-3 text-gray-500" />;
            case 'textarea':
                return <FiFileTextTyped className="w-3 h-3 text-gray-500" />;
            case 'checkbox':
                return field.value ? <FiSquareTyped className="w-3 h-3 text-green-500" /> : <FiSquareTyped className="w-3 h-3 text-gray-500" />;
            case 'signature':
                return <FaSignatureTyped className="w-3 h-3 text-gray-500" />;
            default:
                return <FiFileTextTyped className="w-3 h-3 text-gray-500" />;
        }
    };

    // Get assigned user details for display
    const getAssignedUserInfo = () => {
        if (field.assignedUsers && field.assignedUsers.length > 0) {
            const user = field.assignedUsers[0];
            const signatureMethods = user.signatureMethods || [];

            // Determine which contact info to show based on signature method
            let contactInfo = user.contactName || 'Unknown User';

            if (field.type === 'signature') {
                if (signatureMethods.includes('SMS OTP') && user.contactPhone) {
                    contactInfo = user.contactPhone;
                } else if (signatureMethods.includes('Email OTP') && user.contactEmail) {
                    contactInfo = user.contactEmail;
                } else if (user.contactEmail) {
                    contactInfo = user.contactEmail;
                }
            } else {
                // For non-signature fields, prefer email over phone for professional appearance
                if (user.contactEmail) {
                    contactInfo = user.contactEmail;
                } else if (user.contactPhone) {
                    contactInfo = user.contactPhone;
                }
            }

            return {
                name: user.contactName || 'Unknown User',
                contactInfo,
                email: user.contactEmail || '',
                phone: user.contactPhone || '',
                role: user.role || 'Participant',
            };
        }
        return {
            name: 'Other Participant',
            contactInfo: 'Other Participant',
            email: '',
            phone: '',
            role: 'Participant',
        };
    };

    const assignedUserInfo = getAssignedUserInfo();

    // Check if this field is assigned to the person who rejected the package
    const isAssignedToRejecter = () => {
        if (!rejectionDetails || packageStatus !== 'Rejected') return false;

        return field.assignedUsers.some((user) => user.contactEmail === rejectionDetails.rejectedBy.contactEmail || user.contactId === rejectionDetails.rejectedBy.contactId);
    };

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        boxSizing: 'border-box',
    };

    const isSigned = field.value && typeof field.value === 'object' && 'signedBy' in field.value;
    const showRejectionDetails = isAssignedToRejecter();

    if (field.type === 'signature' && isSigned) {
        const signatureValue = field.value as SignatureValue;
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
                    {signatureValue.otpCode && <p className="text-gray-600 font-mono">OTP: {signatureValue.otpCode}</p>}
                    <p className="text-gray-600">{new Date(signatureValue.date).toLocaleString()}</p>
                </div>
                <p className="text-right text-[10px] text-gray-500 mt-auto pt-1 font-semibold">via {signatureValue.method || 'Email OTP'} by SignatureFlow</p>
            </div>
        );
    }

    // Show rejection details if this field belongs to the rejecter
    if (showRejectionDetails) {
        return (
            <div
                style={baseStyles}
                className="bg-red-50/80 border-2 border-red-400 rounded-lg shadow-sm backdrop-blur-sm flex flex-col overflow-hidden hover:shadow-md transition-all duration-200"
                title={`Field rejected by ${rejectionDetails!.rejectedBy.contactName}: ${rejectionDetails!.reason}`}
            >
                <div className="flex items-center justify-between px-2 py-1 bg-red-100/60 rounded-t-md border-b border-red-300 flex-shrink-0">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <FiXCircleTyped className="w-3 h-3 text-red-600 flex-shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-semibold text-red-700 truncate leading-tight">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                            <div className="flex items-center gap-1">
                                <FiUserTyped className="w-2 h-2 text-red-600" />
                                <span className="text-[9px] text-red-700 font-medium truncate">{assignedUserInfo.contactInfo}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <FiAlertTriangleTyped className="w-3 h-3 text-red-600" />
                    </div>
                </div>
                <div className="flex-grow flex flex-col p-2 min-h-0">
                    <div className="flex items-center gap-1 mb-1">
                        <FiXCircleTyped className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejected</span>
                    </div>
                    <div className="text-xs text-red-700 space-y-1">
                        <p className="font-semibold truncate">{rejectionDetails!.rejectedBy.contactName}</p>
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

    // Default read-only field display
    return (
        <div
            style={baseStyles}
            className="bg-gray-100/80 border-2 border-dashed border-gray-300 rounded-lg shadow-sm backdrop-blur-sm opacity-70 hover:opacity-80 transition-all duration-200 flex flex-col overflow-hidden"
            title={`Field for ${assignedUserInfo.name} (${assignedUserInfo.contactInfo}): ${field.label}`}
        >
            <div className="flex items-center justify-between px-2 py-1 bg-gray-200/60 rounded-t-md border-b border-gray-300 flex-shrink-0">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                    {getFieldIcon()}
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold text-gray-600 truncate leading-tight">
                            {field.label}
                            {field.required && <span className="text-gray-400 ml-0.5">*</span>}
                        </span>
                        <div className="flex items-center gap-1">
                            <FiUserTyped className="w-2 h-2 text-gray-500" />
                            <span className="text-[9px] text-gray-500 font-medium truncate">{assignedUserInfo.contactInfo}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <FiLockTyped className="w-3 h-3 text-gray-500" />
                </div>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center p-2 min-h-0">
                {field.type === 'signature' ? (
                    <>
                        <FaSignatureTyped className="text-lg text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 font-medium text-center leading-tight">Signature Field</span>
                        <span className="text-[10px] text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full">{assignedUserInfo.name}</span>
                    </>
                ) : field.type === 'checkbox' ? (
                    <>
                        <FiSquareTyped className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 font-medium text-center leading-tight">Checkbox</span>
                        <span className="text-[10px] text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full">{assignedUserInfo.name}</span>
                    </>
                ) : field.type === 'textarea' ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <FiFileTextTyped className="w-4 h-4 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 font-medium text-center leading-tight">Text Area</span>
                            <span className="text-[10px] text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full">{assignedUserInfo.name}</span>
                        </div>
                    </div>
                ) : field.type === 'date' ? (
                    <>
                        <FiCalendarTyped className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 font-medium text-center leading-tight">Date Field</span>
                        <span className="text-[10px] text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full">{assignedUserInfo.name}</span>
                    </>
                ) : (
                    <>
                        <FiFileTextTyped className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 font-medium text-center leading-tight">Text Field</span>
                        <span className="text-[10px] text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full">{assignedUserInfo.name}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReadOnlyField;
