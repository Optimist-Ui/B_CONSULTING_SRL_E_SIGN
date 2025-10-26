import React, { ComponentType } from 'react';
import { DocumentPackage } from '../../store/slices/packageSlice';
import { FiXCircle, FiCheckCircle, FiClock, FiArchive, FiEdit, FiMoreVertical } from 'react-icons/fi';

const FiEditTyped = FiEdit as ComponentType<{ className?: string }>;
const FiArchiveTyped = FiArchive as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;
const FiMoreVerticalTyped = FiMoreVertical as ComponentType<{ className?: string }>;

interface Props {
    packageData: DocumentPackage;
}

const PackageStatusHeader: React.FC<Props> = ({ packageData }) => {
    const getStatusInfo = () => {
        switch (packageData.status) {
            case 'Completed':
                return {
                    text: 'Completed',
                    icon: FiCheckCircleTyped,
                    className: 'bg-green-50 text-green-700 border-green-200',
                };
            case 'Rejected':
                return {
                    text: 'Rejected',
                    icon: FiXCircleTyped,
                    className: 'bg-red-50 text-red-700 border-red-200',
                };
            case 'Sent':
                return {
                    text: 'Pending',
                    icon: FiClockTyped,
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                };
            case 'Archived':
                return {
                    text: 'Archived',
                    icon: FiArchiveTyped,
                    className: 'bg-gray-50 text-gray-700 border-gray-200',
                };
            case 'Draft':
                return {
                    text: 'Draft',
                    icon: FiEditTyped,
                    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                };
            default:
                return {
                    text: packageData.status,
                    icon: FiClockTyped,
                    className: 'bg-gray-50 text-gray-700 border-gray-200',
                };
        }
    };

    const status = getStatusInfo();
    const StatusIcon = status.icon;

    return (
        <header className="flex-shrink-0 bg-white border-b border-gray-200">
            <div className="px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Title and Status */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{packageData.name}</h1>

                            {/* Status Badge */}
                            <div
                                className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                ${status.className}
                            `}
                            >
                                <StatusIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{status.text}</span>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            {packageData.createdAt && <span>Created {new Date(packageData.createdAt).toLocaleDateString()}</span>}
                            {packageData.fields && (
                                <span>
                                    {packageData.fields.length} field{packageData.fields.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                        {/* Mobile Menu */}
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
                            <FiMoreVerticalTyped className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Desktop Actions */}
                        {/* <div className="hidden lg:flex items-center gap-2">
                            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Export</button>
                            <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Share</button>
                        </div> */}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default PackageStatusHeader;
