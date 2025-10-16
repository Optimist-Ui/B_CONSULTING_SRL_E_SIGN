import React, { useRef, useMemo } from 'react';
import { ComponentType } from 'react';
import { ParticipantPackageView, setHasAgreedToTerms } from '../../store/slices/participantSlice';
import ActionSidebar from './ActionSidebar';
import DocumentViewer from './DocumentViewer';
import HeaderControls from './HeaderControls';
import { FiFileText, FiUser, FiGlobe, FiMenu, FiX, FiCheck, FiClock, FiX as FiXIcon } from 'react-icons/fi';
import { IRootState, AppDispatch } from '../../store';
import { useSelector, useDispatch } from 'react-redux';
import RejectModal from './modals/RejectModal';
import ReassignDrawer from './modals/ReassignDrawer';
import SigningDrawer from './modals/SigningDrawer';
import AddReceiverDrawer from './modals/AddReceiverDrawer';
import '../../assets/css/participanLayout.scss';

// Helper for typed icons
const FiFileTextTyped = FiFileText as ComponentType<{ className?: string }>;
const FiUserTyped = FiUser as ComponentType<{ className?: string }>;
const FiGlobeTyped = FiGlobe as ComponentType<{ className?: string }>;
const FiMenuTyped = FiMenu as ComponentType<{ className?: string }>;
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiCheckTyped = FiCheck as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiXIconTyped = FiXIcon as ComponentType<{ className?: string }>;

interface ParticipantLayoutProps {
    packageData: ParticipantPackageView;
}

const ParticipantLayout: React.FC<ParticipantLayoutProps> = ({ packageData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const numPages = 1;

    const { fieldValues, uiState } = useSelector((state: IRootState) => state.participant);
    const { hasAgreedToTerms } = uiState;
    const termsSectionRef = useRef<HTMLDivElement>(null);
    // Enhanced progress calculation
    // Check if current user has completed all their tasks
    const currentUserTasksCompleted = useMemo(() => {
        if (!packageData || packageData.status === 'Completed' || packageData.status === 'Rejected') {
            return false; // Don't show completion message for finalized documents
        }

        const currentUserFields = packageData.fields?.filter((field) => field.isAssignedToCurrentUser) || [];

        if (currentUserFields.length === 0) {
            return false; // No fields assigned, don't show completion message
        }

        const allFieldsCompleted = currentUserFields.every((field) => {
            // For signature fields, the definitive status is the 'signed' flag
            if (field.type === 'signature') {
                const currentUserAssignment = field.assignedUsers?.find((user) => user.contactId === packageData.currentUser?.contactId);
                return currentUserAssignment?.signed || false;
            }

            // For all other field types, check for a value in the state
            const fieldValue = fieldValues[field.id];
            return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
        });

        return allFieldsCompleted;
    }, [packageData, fieldValues]);

    const progressData = useMemo(() => {
        const status = packageData.status;

        // Handle different document statuses
        switch (status) {
            case 'Completed':
                return {
                    percentage: 100,
                    label: 'Document completed',
                    color: 'bg-gradient-to-r from-green-500 to-green-600',
                    icon: <FiCheckTyped className="w-4 h-4 text-green-600" />,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                };

            case 'Rejected':
                return {
                    percentage: 0,
                    label: 'Document rejected',
                    color: 'bg-gradient-to-r from-red-500 to-red-600',
                    icon: <FiXIconTyped className="w-4 h-4 text-red-600" />,
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                };

            case 'Expired':
                return {
                    percentage: 0,
                    label: 'Document expired',
                    color: 'bg-gradient-to-r from-orange-500 to-orange-600',
                    icon: <FiClockTyped className="w-4 h-4 text-orange-600" />,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                };

            case 'Draft':
                return {
                    percentage: 10,
                    label: 'Document in draft',
                    color: 'bg-gradient-to-r from-gray-400 to-gray-500',
                    icon: <FiClockTyped className="w-4 h-4 text-gray-500" />,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };

            case 'Archived':
                return {
                    percentage: 100,
                    label: 'Document archived',
                    color: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    icon: <FiCheckTyped className="w-4 h-4 text-gray-600" />,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };

            case 'Sent':
            default:
                // If current user has completed all tasks, show completion state
                if (currentUserTasksCompleted) {
                    return {
                        percentage: 100,
                        label: 'Your tasks completed',
                        color: 'bg-gradient-to-r from-green-500 to-green-600',
                        icon: <FiCheckTyped className="w-4 h-4 text-green-600" />,
                        bgColor: 'bg-green-50',
                        borderColor: 'border-green-200',
                    };
                }

                // Calculate progress based on field completion for active documents
                const currentUserFields = packageData.fields?.filter((field) => field.isAssignedToCurrentUser) || [];

                const totalRequiredFields = currentUserFields.filter((field) => field.required).length;

                // Count completed fields
                let completedFields = 0;

                // Check field values from Redux store
                currentUserFields.forEach((field) => {
                    const fieldValue = fieldValues[field.id];
                    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                        completedFields++;
                    }

                    // For signature fields, also check if they're signed
                    if (field.type === 'signature' && field.assignedUsers?.length > 0) {
                        const currentUserAssignment = field.assignedUsers.find((user) => user.contactId === packageData.currentUser?.contactId);
                        if (currentUserAssignment?.signed) {
                            completedFields++;
                        }
                    }
                });

                // Base progress starts at 20% if terms are agreed
                let baseProgress = hasAgreedToTerms ? 25 : 10;

                // Add progress based on field completion
                const fieldProgress =
                    totalRequiredFields > 0
                        ? Math.floor((completedFields / totalRequiredFields) * 65) // 65% for field completion
                        : 50; // If no required fields, give 50% for being sent

                const totalProgress = Math.min(baseProgress + fieldProgress, 95); // Cap at 95% until fully completed

                return {
                    percentage: totalProgress,
                    label: totalProgress < 30 ? 'Review and accept terms' : totalProgress < 80 ? `${completedFields}/${totalRequiredFields} fields completed` : 'Ready for final submission',
                    color: 'bg-gradient-to-r from-[#1e293b] to-blue-600',
                    icon: <FiClockTyped className="w-4 h-4 text-blue-600" />,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                };
        }
    }, [packageData, fieldValues, hasAgreedToTerms, currentUserTasksCompleted]);

    const participantsWithStatus = useMemo(() => {
        if (!packageData?.allParticipants) {
            return [];
        }

        return packageData.allParticipants.map((p) => ({
            name: p.contactName || 'Other Participant',
            email: p.contactEmail || 'Other Participant',
            roles: p.roles || [],
            status: p.status || 'Pending',
        }));
    }, [packageData]);

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            {/* Enhanced Topbar */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 relative z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200"
                        aria-label="Toggle sidebar"
                    >
                        {isSidebarOpen ? <FiXTyped className="w-5 h-5" /> : <FiMenuTyped className="w-5 h-5" />}
                    </button>

                    <div className="font-bold text-lg sm:text-xl text-[#1e293b]">I-Sign.eu</div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 text-gray-600">
                    <a href="/help" className="text-sm hover:text-[#1e293b] transition-colors duration-200 font-medium">
                        Help
                    </a>
                    <button className="flex items-center gap-1 text-sm hover:text-[#1e293b] transition-colors duration-200 font-medium">
                        <FiGlobeTyped className="w-4 h-4" />
                        <span className="hidden sm:inline">EN</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />}

                {/* Enhanced Left Sidebar */}
                <aside
                    className={`
                    fixed md:relative inset-y-0 left-0 z-50 md:z-0
                    w-72 sm:w-80 md:w-64 lg:w-72 xl:w-80
                    bg-white border-r border-gray-200 shadow-lg md:shadow-none
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    flex-shrink-0 flex flex-col
                `}
                >
                    <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-[#1e293b]">Document Details</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100">
                            <FiXTyped className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6 sm:gap-8 overflow-y-auto">
                        <div className="space-y-3">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Sign as</h3>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center">
                                    <FiUserTyped className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[#1e293b] truncate">{packageData.currentUser?.contactName}</p>
                                    <p className="text-sm text-gray-500 truncate">{packageData.currentUser?.role || 'Current User'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Documents ({numPages})</h3>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                        <FiFileTextTyped className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-[#1e293b] leading-tight mb-1">{packageData.name}</h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                {numPages} page{numPages > 1 ? 's' : ''}
                                            </span>
                                            <span className="px-2 py-1 bg-white bg-opacity-70 rounded-md text-xs font-medium">PDF</span>
                                        </div>
                                        <div className="mt-2">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    packageData.status === 'Completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : packageData.status === 'Rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : packageData.status === 'Expired'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : packageData.status === 'Draft'
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : packageData.status === 'Archived'
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {packageData.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Progress</h3>
                            <div className={`p-4 rounded-xl ${progressData.bgColor} border ${progressData.borderColor}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {progressData.icon}
                                        <span className="text-sm font-medium text-[#1e293b]">Completion Status</span>
                                    </div>
                                    <span className="text-sm font-semibold text-[#1e293b]">{progressData.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div className={`${progressData.color} h-2 rounded-full transition-all duration-700 ease-out`} style={{ width: `${progressData.percentage}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">{progressData.label}</p>

                                {/* Additional status info for active documents */}
                                {packageData.status === 'Sent' && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Terms accepted</span>
                                            <span className={hasAgreedToTerms ? 'text-green-600 font-medium' : 'text-gray-400'}>{hasAgreedToTerms ? '✓' : '○'}</span>
                                        </div>
                                        {packageData.fields?.filter((f) => f.isAssignedToCurrentUser && f.required).length > 0 && (
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                                <span>Required fields</span>
                                                <span className="font-medium">
                                                    {packageData.fields.filter((f) => f.isAssignedToCurrentUser && f.required && fieldValues[f.id]).length}/
                                                    {packageData.fields.filter((f) => f.isAssignedToCurrentUser && f.required).length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <HeaderControls documentName={packageData.name} participants={participantsWithStatus} status={packageData.status} options={packageData.options} />
                    <div className="flex-1 overflow-auto bg-gray-100">
                        <DocumentViewer packageData={packageData} fieldValues={fieldValues} />

                        {/* Success Message for Completed Tasks */}
                        {currentUserTasksCompleted && (
                            <div className="flex items-center justify-center p-6 sm:p-8 transition-all duration-300">
                                <div className="max-w-2xl w-full">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 sm:p-8 shadow-lg">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <FiCheckTyped className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">You're All Set!</h3>
                                            <p className="text-green-700 mb-4 text-sm sm:text-base leading-relaxed">
                                                Congratulations! You have successfully completed all your assigned tasks for this document. Your responses have been submitted and the document is ready
                                                for the next steps in the process.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <FiCheckTyped className="w-5 h-5" />
                                                    <span className="text-sm font-medium">All required fields completed</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <FiCheckTyped className="w-5 h-5" />
                                                    <span className="text-sm font-medium">Terms of use accepted</span>
                                                </div>
                                                {packageData.fields?.some((f) => f.type === 'signature' && f.isAssignedToCurrentUser) && (
                                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                                        <FiCheckTyped className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Digital signature applied</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 p-4 bg-white bg-opacity-70 rounded-xl border border-green-200">
                                                <p className="text-sm text-green-700">
                                                    <span className="font-semibold">What happens next?</span>
                                                    <br />
                                                    The document will proceed to other participants for their review and completion. You will be notified when the entire document process is completed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Terms Checkbox Section - Only show if tasks are not completed */}
                        {!currentUserTasksCompleted && (
                            <div id="terms-checkbox-section" ref={termsSectionRef} className="flex items-center justify-center p-6 sm:p-8 transition-all duration-300">
                                <div className="max-w-2xl w-full">
                                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-[#1e293b] border-2 border-gray-300 rounded focus:ring-[#1e293b] focus:ring-2 focus:border-transparent transition-all duration-200"
                                                    checked={hasAgreedToTerms}
                                                    onChange={(e) => dispatch(setHasAgreedToTerms(e.target.checked))}
                                                    disabled={packageData.status === 'Completed' || packageData.status === 'Rejected'}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="cursor-pointer block">
                                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                                        I declare that I have read the document and shall comply with the{' '}
                                                        <a
                                                            href="/terms-of-use"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[#1e293b] hover:text-blue-600 underline font-medium transition-colors duration-200"
                                                        >
                                                            Terms of Use
                                                        </a>
                                                        .
                                                    </p>
                                                </label>
                                                {hasAgreedToTerms && (
                                                    <div className="flex items-center gap-2 mt-3 text-green-600">
                                                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                                        </div>
                                                        <span className="text-sm font-medium">Terms accepted</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <ActionSidebar
                    allowReassign={packageData.options.allowReassign}
                    currentUserTasksCompleted={currentUserTasksCompleted}
                    allowReceiversToAdd={true}
                    // allowReceiversToAdd={packageData.options.allowReceiversToAdd ?? false}
                />

                {uiState.isRejectModalOpen && <RejectModal />}
                {uiState.isReassignDrawerOpen && <ReassignDrawer />}
                {uiState.isAddReceiverDrawerOpen && <AddReceiverDrawer />}
                {uiState.isSigningDrawerOpen && <SigningDrawer />}
            </div>
        </div>
    );
};

export default ParticipantLayout;
