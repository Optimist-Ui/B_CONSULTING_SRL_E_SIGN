import React, { ComponentType, useMemo } from 'react';
import { DocumentPackage } from '../../store/slices/packageSlice';
import { FiCheck, FiClock } from 'react-icons/fi';

const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiCheckTyped = FiCheck as ComponentType<{ className?: string }>;

interface Props {
    packageData: DocumentPackage;
}

const ParticipantStatusPanel: React.FC<Props> = ({ packageData }) => {
    const participants = useMemo(() => {
        const participantMap = new Map();

        packageData.fields.forEach((field) => {
            field.assignedUsers?.forEach((user) => {
                if (!participantMap.has(user.contactId)) {
                    participantMap.set(user.contactId, {
                        ...user,
                        roles: new Set(),
                        isComplete: false,
                    });
                }
                participantMap.get(user.contactId).roles.add(user.role);
            });
        });

        packageData.receivers?.forEach((receiver) => {
            if (!participantMap.has(receiver.contactId)) {
                participantMap.set(receiver.contactId, {
                    ...receiver,
                    roles: new Set(['Receiver']),
                    isComplete: true,
                });
            } else {
                participantMap.get(receiver.contactId).roles.add('Receiver');
            }
        });

        // Calculate completion status for each participant
        participantMap.forEach((participant) => {
            if (participant.roles.has('Receiver') && participant.roles.size === 1) return;

            const requiredFields = packageData.fields.filter((field) => field.required && field.assignedUsers?.some((u) => u.contactId === participant.contactId));

            if (requiredFields.length === 0) {
                participant.isComplete = true;
                return;
            }

            const allTasksDone = requiredFields.every((field) => {
                if (field.type === 'signature' || field.type === 'checkbox') {
                    const assignment = field.assignedUsers?.find((u) => u.contactId === participant.contactId);
                    return assignment?.signed === true;
                }
                return field.value != null && field.value !== '';
            });

            participant.isComplete = allTasksDone;
        });

        return Array.from(participantMap.values());
    }, [packageData]);

    return (
        <div className="h-full flex flex-col">
            {/* Header - Hidden on mobile as it's shown in toggle */}
            <div className="hidden lg:block p-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Participants</h2>
                <p className="text-xs text-gray-500 mt-1">
                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3 lg:p-4 space-y-2">
                    {participants.map((participant) => (
                        <div key={participant.contactId} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                            {/* Status Icon */}
                            <div
                                className={`
                                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                                ${participant.isComplete ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}
                            `}
                            >
                                {participant.isComplete ? <FiCheckTyped className="w-3.5 h-3.5" /> : <FiClockTyped className="w-3.5 h-3.5" />}
                            </div>

                            {/* Participant Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{participant.contactName}</p>

                                {/* Roles */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {Array.from(participant.roles).map((role) => (
                                        <span key={role as string} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {role as string}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {participants.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No participants assigned</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParticipantStatusPanel;
