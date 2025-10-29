import React, { useState } from 'react';
import { DocumentPackage } from '../../store/slices/packageSlice';
import ParticipantStatusPanel from './ParticipantStatusPanel';
import PackageStatusHeader from './PackageStatusHeader';
import OwnerDocumentViewer from './OwnerDocumentViewer';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface Props {
    packageData: DocumentPackage;
}

const PackageStatusLayout: React.FC<Props> = ({ packageData }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const [showParticipants, setShowParticipants] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row h-full bg-gray-50">
            {/* Mobile/Tablet Participants Toggle */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <button onClick={() => setShowParticipants(!showParticipants)} className="flex items-center justify-between w-full text-left">
                    <span className="font-medium text-gray-900">
                        {t('packageStatusLayout.participants.title')} (
                        {packageData.fields?.reduce((acc, field) => {
                            field.assignedUsers?.forEach((user) => acc.add(user.contactId));
                            return acc;
                        }, new Set()).size || 0}
                        )
                    </span>
                    <svg className={`w-5 h-5 transform transition-transform ${showParticipants ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Participants Panel - Responsive */}
            <div
                className={`
                ${showParticipants ? 'block' : 'hidden'} lg:block
                lg:w-80 lg:flex-shrink-0
                ${showParticipants ? 'border-b lg:border-b-0 lg:border-r' : 'lg:border-r'} 
                border-gray-200 bg-white
            `}
            >
                <ParticipantStatusPanel packageData={packageData} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <PackageStatusHeader packageData={packageData} />
                <div className="flex-1 overflow-auto">
                    <OwnerDocumentViewer packageData={packageData} />
                </div>
            </div>
        </div>
    );
};

export default PackageStatusLayout;
