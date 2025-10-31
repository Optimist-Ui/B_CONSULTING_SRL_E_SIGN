import React, { ComponentType } from 'react';
import { ParticipantPackageField, SignatureValue, RejectionDetails } from '../../../store/slices/participantSlice';
import { FiFileText, FiCalendar, FiSquare, FiLock, FiUser, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { FaSignature } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    console.log(field);
    // Determine field size category for responsive styling
    const getFieldSizeCategory = () => {
        const area = field.width * field.height;
        if (area < 3000) return 'tiny'; // Very small fields
        if (area < 6000) return 'small';
        if (area < 12000) return 'medium';
        return 'large';
    };

    const sizeCategory = getFieldSizeCategory();
    const isTinyField = sizeCategory === 'tiny';
    const isSmallField = sizeCategory === 'small' || sizeCategory === 'tiny';

    // Responsive styling variables
    const headerPadding = isTinyField ? 'px-1 py-0.5' : isSmallField ? 'px-1.5 py-0.5' : 'px-2 py-1';
    const labelTextSize = isTinyField ? 'text-[9px]' : isSmallField ? 'text-[10px]' : 'text-xs';
    const userTextSize = isTinyField ? 'text-[7px]' : isSmallField ? 'text-[8px]' : 'text-[10px]';
    const contentPadding = isTinyField ? 'p-0.5' : isSmallField ? 'p-1' : 'p-2';
    const iconSize = isTinyField ? 'w-2.5 h-2.5' : isSmallField ? 'w-3 h-3' : 'w-4 h-4';
    const largeIconSize = isTinyField ? 'w-3 h-3' : isSmallField ? 'w-4 h-4' : 'w-5 h-5';

    const getFieldIcon = () => {
        switch (field.type) {
            case 'text':
                return <FiFileTextTyped className={`${iconSize} text-gray-500`} />;
            case 'date':
                return <FiCalendarTyped className={`${iconSize} text-gray-500`} />;
            case 'textarea':
                return <FiFileTextTyped className={`${iconSize} text-gray-500`} />;
            case 'checkbox':
                return field.value ? <FiSquareTyped className={`${iconSize} text-green-500`} /> : <FiSquareTyped className={`${iconSize} text-gray-500`} />;
            case 'signature':
                return <FaSignatureTyped className={`${iconSize} text-gray-500`} />;
            default:
                return <FiFileTextTyped className={`${iconSize} text-gray-500`} />;
        }
    };

    // Get assigned user details for display
    const getAssignedUserInfo = () => {
        if (field.assignedUsers && field.assignedUsers.length > 0) {
            const user = field.assignedUsers[0];
            const signatureMethods = user.signatureMethods || [];

            // Determine which contact info to show based on signature method
            let contactInfo = user.contactName || t('readOnlyField.unknownUser');

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
                name: user.contactName || t('readOnlyField.unknownUser'),
                contactInfo,
                email: user.contactEmail || '',
                phone: user.contactPhone || '',
                role: user.role || t('readOnlyField.participantRole'),
            };
        }
        return {
            name: t('readOnlyField.otherParticipant'),
            contactInfo: t('readOnlyField.otherParticipant'),
            email: '',
            phone: '',
            role: t('readOnlyField.participantRole'),
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
                <div className={`flex items-center gap-1 ${isTinyField ? 'mb-0.5' : 'mb-1'} text-green-700`}>
                    <FiCheckCircleTyped className={`${iconSize} flex-shrink-0`} />
                    <h4 className={`font-bold ${labelTextSize} uppercase tracking-wider`}>{t('readOnlyField.signed')}</h4>
                </div>
                <div className={`${userTextSize} text-slate-700 space-y-0.5 ${isTinyField ? 'pl-0' : 'pl-1'}`}>
                    <p className="font-semibold truncate">{signatureValue.signedBy}</p>
                    {!isTinyField &&
                        (signatureValue.method === 'SMS OTP' && signatureValue.phone ? (
                            <p className="truncate text-gray-600">{signatureValue.phone}</p>
                        ) : (
                            <p className="truncate text-gray-600">{signatureValue.email}</p>
                        ))}
                    {!isTinyField && signatureValue.otpCode && <p className="text-gray-600 font-mono">{t('readOnlyField.otpCode', { code: signatureValue.otpCode })}</p>}
                    <p className="text-gray-600 truncate">{new Date(signatureValue.date).toLocaleString()}</p>
                </div>
                {!isTinyField && (
                    <p className={`text-right ${userTextSize} text-gray-500 mt-auto pt-0.5 font-semibold truncate`}>
                        {t('readOnlyField.via', { method: signatureValue.method || t('readOnlyField.emailOtp') })}
                    </p>
                )}
            </div>
        );
    }

    // Show rejection details if this field belongs to the rejecter
    if (showRejectionDetails) {
        return (
            <div
                style={baseStyles}
                className="bg-red-50/80 border-2 border-red-400 rounded-lg shadow-sm backdrop-blur-sm flex flex-col overflow-hidden hover:shadow-md transition-all duration-200"
                title={t('readOnlyField.rejectionTooltip', { name: rejectionDetails!.rejectedBy.contactName, reason: rejectionDetails!.reason })}
            >
                <div className={`flex items-center justify-between ${headerPadding} bg-red-100/60 rounded-t-md border-b border-red-300 flex-shrink-0`}>
                    <div className="flex items-center gap-0.5 min-w-0 flex-1">
                        <FiXCircleTyped className={`${iconSize} text-red-600 flex-shrink-0`} />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className={`${labelTextSize} font-semibold text-red-700 truncate leading-tight`}>
                                {field.label}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                            {!isTinyField && (
                                <div className="flex items-center gap-0.5">
                                    <FiUserTyped className="w-1.5 h-1.5 text-red-600" />
                                    <span className={`${userTextSize} text-red-700 font-medium truncate`}>{assignedUserInfo.contactInfo}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <FiAlertTriangleTyped className={`${iconSize} text-red-600 flex-shrink-0`} />
                </div>
                <div className={`flex-grow flex flex-col ${contentPadding} min-h-0`}>
                    <div className="flex items-center gap-0.5 mb-0.5">
                        <FiXCircleTyped className={`${iconSize} text-red-600 flex-shrink-0`} />
                        <span className={`${labelTextSize} font-bold text-red-700 uppercase tracking-wider`}>{t('readOnlyField.rejected')}</span>
                    </div>
                    <div className={`${userTextSize} text-red-700 space-y-0.5`}>
                        <p className="font-semibold truncate">{rejectionDetails!.rejectedBy.contactName}</p>
                        <p className="text-red-600 truncate">{new Date(rejectionDetails!.rejectedAt).toLocaleString()}</p>
                    </div>
                    {rejectionDetails!.reason && !isTinyField && (
                        <div className="mt-0.5 flex-grow">
                            <p className={`${userTextSize} text-red-600 font-medium mb-0.5`}>{t('readOnlyField.reason')}</p>
                            <p className={`${labelTextSize} text-red-700 leading-tight break-words line-clamp-2`}>{rejectionDetails!.reason}</p>
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
            title={t('readOnlyField.fieldTooltip', { name: assignedUserInfo.name, contact: assignedUserInfo.contactInfo, label: field.label })}
        >
            <div className={`flex items-center justify-between ${headerPadding} bg-gray-200/60 rounded-t-md border-b border-gray-300 flex-shrink-0`}>
                <div className="flex items-center gap-0.5 min-w-0 flex-1">
                    {getFieldIcon()}
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className={`${labelTextSize} font-semibold text-gray-600 truncate leading-tight`}>
                            {field.label}
                            {field.required && <span className="text-gray-400 ml-0.5">*</span>}
                        </span>
                        {/* Always show contact info for read-only fields */}
                        <div className="flex items-center gap-0.5">
                            <FiUserTyped className={`${isTinyField ? 'w-1 h-1' : 'w-1.5 h-1.5'} text-gray-500 flex-shrink-0`} />
                            <span className={`${userTextSize} text-gray-500 font-medium truncate`}>{assignedUserInfo.contactInfo}</span>
                        </div>
                    </div>
                </div>
                <FiLockTyped className={`${iconSize} text-gray-500 flex-shrink-0`} />
            </div>
            <div className={`flex-grow flex flex-col items-center justify-center ${contentPadding} min-h-0`}>
                {field.type === 'signature' ? (
                    <>
                        <FaSignatureTyped className={`${largeIconSize} text-gray-400 ${isTinyField ? 'mb-0' : 'mb-0.5'} flex-shrink-0`} />
                        {!isTinyField && (
                            <>
                                <span className={`${labelTextSize} text-gray-500 font-medium text-center leading-tight`}>{t('readOnlyField.signatureField')}</span>
                                <span className={`${userTextSize} text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full`}>{assignedUserInfo.name}</span>
                            </>
                        )}
                    </>
                ) : field.type === 'checkbox' ? (
                    <>
                        <FiSquareTyped className={`${largeIconSize} text-gray-400 ${isTinyField ? 'mb-0' : 'mb-0.5'} flex-shrink-0`} />
                        {!isTinyField && (
                            <>
                                <span className={`${labelTextSize} text-gray-500 font-medium text-center leading-tight`}>{t('readOnlyField.checkbox')}</span>
                                <span className={`${userTextSize} text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full`}>{assignedUserInfo.name}</span>
                            </>
                        )}
                    </>
                ) : field.type === 'textarea' ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <FiFileTextTyped className={`${largeIconSize} text-gray-400 ${isTinyField ? 'mb-0' : 'mb-0.5'} flex-shrink-0`} />
                            {!isTinyField && (
                                <>
                                    <span className={`${labelTextSize} text-gray-500 font-medium text-center leading-tight`}>{t('readOnlyField.textarea')}</span>
                                    <span className={`${userTextSize} text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full`}>{assignedUserInfo.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                ) : field.type === 'date' ? (
                    <>
                        <FiCalendarTyped className={`${largeIconSize} text-gray-400 ${isTinyField ? 'mb-0' : 'mb-0.5'} flex-shrink-0`} />
                        {!isTinyField && (
                            <>
                                <span className={`${labelTextSize} text-gray-500 font-medium text-center leading-tight`}>{t('readOnlyField.dateField')}</span>
                                <span className={`${userTextSize} text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full`}>{assignedUserInfo.name}</span>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <FiFileTextTyped className={`${largeIconSize} text-gray-400 ${isTinyField ? 'mb-0' : 'mb-0.5'} flex-shrink-0`} />
                        {!isTinyField && (
                            <>
                                <span className={`${labelTextSize} text-gray-500 font-medium text-center leading-tight`}>{t('readOnlyField.textField')}</span>
                                <span className={`${userTextSize} text-gray-400 text-center leading-tight mt-0.5 truncate max-w-full`}>{assignedUserInfo.name}</span>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReadOnlyField;
