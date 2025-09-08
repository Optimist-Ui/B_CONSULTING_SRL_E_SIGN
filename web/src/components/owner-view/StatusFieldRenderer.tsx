import React, { ComponentType } from 'react';
import { PackageField } from '../../store/slices/packageSlice';
import { SignatureValue } from '../../store/slices/participantSlice';
import { FiCheckCircle, FiClock, FiEdit3 } from 'react-icons/fi';

const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiEdit3Typed = FiEdit3 as ComponentType<{ className?: string }>;

interface Props {
    field: PackageField;
    currentScale: number;
    baseScale: number;
}

const StatusFieldRenderer: React.FC<Props> = ({ field, currentScale, baseScale }) => {
    const isSigned = field.type === 'signature' && field.value;
    const isFilled = !isSigned && field.value != null && field.value !== '';

    const getStatusInfo = () => {
        if (isSigned) return { bg: 'bg-green-500/20', border: 'border-green-500', textColor: 'text-green-800' };
        if (isFilled) return { bg: 'bg-blue-500/20', border: 'border-blue-500', textColor: 'text-blue-800' };
        return { bg: 'bg-gray-500/20', border: 'border-gray-500', textColor: 'text-gray-800' };
    };

    const status = getStatusInfo();
    const assignedUser = field.assignedUsers && field.assignedUsers.length > 0 ? field.assignedUsers[0] : null;

    // Calculate scale ratio - fields are positioned correctly at baseScale (1.5)
    const scaleRatio = currentScale / baseScale;

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${field.x * scaleRatio}px`,
        top: `${field.y * scaleRatio}px`,
        width: `${field.width * scaleRatio}px`,
        height: `${field.height * scaleRatio}px`,
        minHeight: '20px', // Ensure minimum visibility
        minWidth: '50px', // Ensure minimum visibility
    };

    // Calculate responsive font size based on field size and scale
    const baseFontSize = Math.max(8, Math.min(12, (field.height * scaleRatio) / 3));
    const fontSize = `${baseFontSize}px`;

    return (
        <div
            style={baseStyles}
            className={`absolute border-2 border-dashed rounded backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${status.bg} ${status.border}`}
            title={`${field.label} - ${field.type} - Assigned to: ${assignedUser?.contactName || 'N/A'}`}
        >
            <div className="w-full h-full flex flex-col p-1 overflow-hidden" style={{ fontSize }}>
                <div className={`font-semibold truncate leading-tight ${status.textColor}`}>{field.label}</div>

                <div className={`text-xs truncate opacity-90 ${status.textColor}`}>{assignedUser?.contactName || 'Unassigned'}</div>

                <div className="flex-1 flex items-end">
                    {isSigned && (
                        <div className="w-full bg-black/20 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiCheckCircleTyped className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate text-white">Signed by {(field.value as SignatureValue)?.signedBy}</span>
                        </div>
                    )}

                    {isFilled && !isSigned && (
                        <div className="w-full bg-black/20 backdrop-blur-sm px-1 py-0.5 rounded text-xs flex items-center">
                            <FiEdit3Typed className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate text-white">{String(field.value).length > 20 ? `${String(field.value).substring(0, 20)}...` : String(field.value)}</span>
                        </div>
                    )}

                    {!isSigned && !isFilled && (
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
