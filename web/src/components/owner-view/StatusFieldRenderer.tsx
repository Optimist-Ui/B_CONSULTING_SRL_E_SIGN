import React, { ComponentType } from 'react';
import { PackageField } from '../../store/slices/packageSlice';
import { SignatureValue } from '../../store/slices/participantSlice';
import { FiCheckCircle, FiClock, FiEdit3, FiXCircle } from 'react-icons/fi';

const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiEdit3Typed = FiEdit3 as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;

interface Props {
    field: PackageField;
    currentScale: number;
    baseScale: number;
    packageStatus?: string; // 👈 ADD THIS
}

const StatusFieldRenderer: React.FC<Props> = ({ field, currentScale, baseScale, packageStatus }) => {
    const isSigned = field.type === 'signature' && field.value;
    const isFilled = !isSigned && field.value != null && field.value !== '';
    const assignedUser = field.assignedUsers && field.assignedUsers.length > 0 ? field.assignedUsers[0] : null;

    // Check status at multiple levels
    const isRejected = packageStatus === 'Rejected' || (field as any).status === 'Rejected' || (assignedUser as any)?.status === 'Rejected';

    const isRevoked = packageStatus === 'Revoked' || (field as any).status === 'Revoked' || (assignedUser as any)?.status === 'Revoked';

    const isDraft = packageStatus === 'Draft';

    const getStatusInfo = () => {
        // Rejected - Red
        if (isRejected) {
            return {
                bg: 'bg-red-500/20',
                border: 'border-red-500',
                textColor: 'text-red-800',
            };
        }
        // Revoked - Orange
        if (isRevoked) {
            return {
                bg: 'bg-orange-500/20',
                border: 'border-orange-500',
                textColor: 'text-orange-800',
            };
        }
        // Draft - Yellow
        if (isDraft) {
            return {
                bg: 'bg-yellow-500/20',
                border: 'border-yellow-500',
                textColor: 'text-yellow-800',
            };
        }
        // Signed - Green
        if (isSigned) {
            return {
                bg: 'bg-green-500/20',
                border: 'border-green-500',
                textColor: 'text-green-800',
            };
        }
        // Filled - Blue
        if (isFilled) {
            return {
                bg: 'bg-blue-500/20',
                border: 'border-blue-500',
                textColor: 'text-blue-800',
            };
        }
        // Pending - Gray
        return {
            bg: 'bg-gray-500/20',
            border: 'border-gray-500',
            textColor: 'text-gray-800',
        };
    };

    const status = getStatusInfo();

    // Calculate scale ratio
    const scaleRatio = currentScale / baseScale;

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${field.x * scaleRatio}px`,
        top: `${field.y * scaleRatio}px`,
        width: `${field.width * scaleRatio}px`,
        height: `${field.height * scaleRatio}px`,
        minHeight: '20px',
        minWidth: '50px',
    };

    const baseFontSize = Math.max(8, Math.min(12, (field.height * scaleRatio) / 3));
    const fontSize = `${baseFontSize}px`;

    return (
        <div
            style={baseStyles}
            className={`absolute border-2 border-dashed rounded backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${status.bg} ${status.border}`}
            title={`${field.label} - ${field.type} - Assigned to: ${assignedUser?.contactName || 'N/A'} - Status: ${
                isRejected ? 'Rejected' : isRevoked ? 'Revoked' : isDraft ? 'Draft' : isSigned ? 'Signed' : isFilled ? 'Filled' : 'Pending'
            }`}
        >
            <div className="w-full h-full flex flex-col p-1 overflow-hidden" style={{ fontSize }}>
                <div className={`font-semibold truncate leading-tight ${status.textColor}`}>{field.label}</div>
                <div className={`text-xs truncate opacity-90 ${status.textColor}`}>{assignedUser?.contactName || 'Unassigned'}</div>

                <div className="flex-1 flex items-end">
                    {isRejected && (
                        <div className="w-full bg-red-600/30 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiXCircleTyped className="w-3 h-3 mr-1 flex-shrink-0 text-red-700" />
                            <span className="truncate text-red-900 font-semibold">Rejected</span>
                        </div>
                    )}

                    {!isRejected && isRevoked && (
                        <div className="w-full bg-orange-600/30 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiXCircleTyped className="w-3 h-3 mr-1 flex-shrink-0 text-orange-700" />
                            <span className="truncate text-orange-900 font-semibold">Revoked</span>
                        </div>
                    )}

                    {!isRejected && !isRevoked && isDraft && (
                        <div className="w-full bg-yellow-600/30 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiEdit3Typed className="w-3 h-3 mr-1 flex-shrink-0 text-yellow-700" />
                            <span className="truncate text-yellow-900 font-semibold">Draft</span>
                        </div>
                    )}

                    {!isRejected && !isRevoked && !isDraft && isSigned && (
                        <div className="w-full bg-black/20 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiCheckCircleTyped className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate text-white">Signed by {(field.value as SignatureValue)?.signedBy}</span>
                        </div>
                    )}

                    {!isRejected && !isRevoked && !isDraft && isFilled && !isSigned && (
                        <div className="w-full bg-black/20 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiEdit3Typed className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate text-white">{String(field.value).length > 20 ? `${String(field.value).substring(0, 20)}...` : String(field.value)}</span>
                        </div>
                    )}

                    {!isRejected && !isRevoked && !isDraft && !isSigned && !isFilled && (
                        <div className="w-full bg-black/20 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiClockTyped className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate text-white">Pending</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusFieldRenderer;
