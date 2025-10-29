import React, { useRef, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import Dropdown from '../Dropdown';

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
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [flag, setFlag] = useState('en');
    const numPages = 1;

    const { fieldValues, uiState } = useSelector((state: IRootState) => state.participant);
    const { hasAgreedToTerms } = uiState;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const termsSectionRef = useRef<HTMLDivElement>(null);

    const setLocale = (flag: string) => {
        setFlag(flag);
        i18next.changeLanguage(flag);
    };

    // Enhanced progress calculation
    const currentUserTasksCompleted = useMemo(() => {
        if (!packageData || packageData.status === 'Completed' || packageData.status === 'Rejected') {
            return false;
        }

        const currentUserFields = packageData.fields?.filter((field) => field.isAssignedToCurrentUser) || [];

        if (currentUserFields.length === 0) {
            return false;
        }

        const allFieldsCompleted = currentUserFields.every((field) => {
            if (field.type === 'signature') {
                const currentUserAssignment = field.assignedUsers?.find((user) => user.contactId === packageData.currentUser?.contactId);
                return currentUserAssignment?.signed || false;
            }

            const fieldValue = fieldValues[field.id];
            return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
        });

        return allFieldsCompleted;
    }, [packageData, fieldValues]);

    const progressData = useMemo(() => {
        const status = packageData.status;

        switch (status) {
            case 'Completed':
                return {
                    percentage: 100,
                    label: t('participantLayout.progress.completed'),
                    color: 'bg-gradient-to-r from-green-500 to-green-600',
                    icon: <FiCheckTyped className="w-4 h-4 text-green-600" />,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                };

            case 'Rejected':
                return {
                    percentage: 0,
                    label: t('participantLayout.progress.rejected'),
                    color: 'bg-gradient-to-r from-red-500 to-red-600',
                    icon: <FiXIconTyped className="w-4 h-4 text-red-600" />,
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                };

            case 'Expired':
                return {
                    percentage: 0,
                    label: t('participantLayout.progress.expired'),
                    color: 'bg-gradient-to-r from-orange-500 to-orange-600',
                    icon: <FiClockTyped className="w-4 h-4 text-orange-600" />,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                };

            case 'Draft':
                return {
                    percentage: 10,
                    label: t('participantLayout.progress.draft'),
                    color: 'bg-gradient-to-r from-gray-400 to-gray-500',
                    icon: <FiClockTyped className="w-4 h-4 text-gray-500" />,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };

            case 'Archived':
                return {
                    percentage: 100,
                    label: t('participantLayout.progress.archived'),
                    color: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    icon: <FiCheckTyped className="w-4 h-4 text-gray-600" />,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };

            case 'Sent':
            default:
                if (currentUserTasksCompleted) {
                    return {
                        percentage: 100,
                        label: t('participantLayout.progress.tasksCompleted'),
                        color: 'bg-gradient-to-r from-green-500 to-green-600',
                        icon: <FiCheckTyped className="w-4 h-4 text-green-600" />,
                        bgColor: 'bg-green-50',
                        borderColor: 'border-green-200',
                    };
                }

                const currentUserFields = packageData.fields?.filter((field) => field.isAssignedToCurrentUser) || [];
                const totalRequiredFields = currentUserFields.filter((field) => field.required).length;
                let completedFields = 0;

                currentUserFields.forEach((field) => {
                    const fieldValue = fieldValues[field.id];
                    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                        completedFields++;
                    }

                    if (field.type === 'signature' && field.assignedUsers?.length > 0) {
                        const currentUserAssignment = field.assignedUsers.find((user) => user.contactId === packageData.currentUser?.contactId);
                        if (currentUserAssignment?.signed) {
                            completedFields++;
                        }
                    }
                });

                let baseProgress = hasAgreedToTerms ? 25 : 10;
                const fieldProgress = totalRequiredFields > 0 ? Math.floor((completedFields / totalRequiredFields) * 65) : 50;

                const totalProgress = Math.min(baseProgress + fieldProgress, 95);

                return {
                    percentage: totalProgress,
                    label:
                        totalProgress < 30
                            ? t('participantLayout.progress.reviewTerms')
                            : totalProgress < 80
                            ? t('participantLayout.progress.fieldsCompleted', { completed: completedFields, total: totalRequiredFields })
                            : t('participantLayout.progress.readyForSubmission'),
                    color: 'bg-gradient-to-r from-[#1e293b] to-blue-600',
                    icon: <FiClockTyped className="w-4 h-4 text-blue-600" />,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                };
        }
    }, [packageData, fieldValues, hasAgreedToTerms, currentUserTasksCompleted, t]);

    const participantsWithStatus = useMemo(() => {
        if (!packageData?.allParticipants) {
            return [];
        }

        return packageData.allParticipants.map((p) => ({
            name: p.contactName || t('participantLayout.defaultParticipant'),
            email: p.contactEmail || t('participantLayout.defaultParticipant'),
            roles: p.roles || [],
            status: p.status || 'Pending',
        }));
    }, [packageData, t]);

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            {/* Enhanced Topbar */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 relative z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200"
                        aria-label={t('participantLayout.sidebar.toggle')}
                    >
                        {isSidebarOpen ? <FiXTyped className="w-5 h-5" /> : <FiMenuTyped className="w-5 h-5" />}
                    </button>

                    <div className="font-bold text-lg sm:text-xl text-[#1e293b]">{t('participantLayout.brand')}</div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 text-gray-600">
                    <a href="/help" target='_blank' className="text-sm hover:text-[#1e293b] transition-colors duration-200 font-medium">
                        {t('participantLayout.help')}
                    </a>
                    <div className="dropdown shrink-0">
                        <Dropdown
                            offset={[0, 8]}
                            placement="bottom-end"
                            btnClassName="flex items-center gap-1 text-sm hover:text-[#1e293b] transition-colors duration-200 font-medium p-2 rounded-lg hover:bg-gray-100"
                            button={
                                <>
                                    <FiGlobeTyped className="w-4 h-4" />
                                    <span className="hidden sm:inline">{flag.toUpperCase()}</span>
                                </>
                            }
                        >
                            <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                {themeConfig.languageList.map((item: any) => (
                                    <li key={item.code}>
                                        <button
                                            type="button"
                                            className={`flex w-full hover:text-primary rounded-lg ${i18next.language === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                            onClick={() => setLocale(item.code)}
                                        >
                                            <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                            <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Dropdown>
                    </div>
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
                        <h2 className="text-lg font-semibold text-[#1e293b]">{t('participantLayout.sidebar.title')}</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100">
                            <FiXTyped className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6 sm:gap-8 overflow-y-auto">
                        <div className="space-y-3">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">{t('participantLayout.sidebar.signAs')}</h3>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center">
                                    <FiUserTyped className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[#1e293b] truncate">{packageData.currentUser?.contactName}</p>
                                    <p className="text-sm text-gray-500 truncate">{packageData.currentUser?.role || t('participantLayout.sidebar.currentUser')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                {t('participantLayout.sidebar.documents')} ({numPages})
                            </h3>
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
                            <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">{t('participantLayout.sidebar.progress')}</h3>
                            <div className={`p-4 rounded-xl ${progressData.bgColor} border ${progressData.borderColor}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {progressData.icon}
                                        <span className="text-sm font-medium text-[#1e293b]">{t('participantLayout.progress.status')}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-[#1e293b]">{progressData.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div className={`${progressData.color} h-2 rounded-full transition-all duration-700 ease-out`} style={{ width: `${progressData.percentage}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">{progressData.label}</p>

                                {packageData.status === 'Sent' && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{t('participantLayout.progress.termsAccepted')}</span>
                                            <span className={hasAgreedToTerms ? 'text-green-600 font-medium' : 'text-gray-400'}>{hasAgreedToTerms ? '✓' : '○'}</span>
                                        </div>
                                        {packageData.fields?.filter((f) => f.isAssignedToCurrentUser && f.required).length > 0 && (
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                                <span>{t('participantLayout.progress.requiredFields')}</span>
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
                                            <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">{t('participantLayout.success.title')}</h3>
                                            <p className="text-green-700 mb-4 text-sm sm:text-base leading-relaxed">{t('participantLayout.success.message')}</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <FiCheckTyped className="w-5 h-5" />
                                                    <span className="text-sm font-medium">{t('participantLayout.success.requiredFields')}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <FiCheckTyped className="w-5 h-5" />
                                                    <span className="text-sm font-medium">{t('participantLayout.success.termsAccepted')}</span>
                                                </div>
                                                {packageData.fields?.some((f) => f.type === 'signature' && f.isAssignedToCurrentUser) && (
                                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                                        <FiCheckTyped className="w-5 h-5" />
                                                        <span className="text-sm font-medium">{t('participantLayout.success.signatureApplied')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 p-4 bg-white bg-opacity-70 rounded-xl border border-green-200">
                                                <p className="text-sm text-green-700">
                                                    <span className="font-semibold">{t('participantLayout.success.nextSteps')}</span>
                                                    <br />
                                                    {t('participantLayout.success.nextMessage')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                        {t('participantLayout.terms.part1')}{' '}
                                                        <a
                                                            href="/terms-of-use"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[#1e293b] hover:text-blue-600 underline font-medium transition-colors duration-200"
                                                        >
                                                            {t('participantLayout.terms.link')}
                                                        </a>
                                                        {t('participantLayout.terms.part2')}
                                                    </p>
                                                </label>
                                                {hasAgreedToTerms && (
                                                    <div className="flex items-center gap-2 mt-3 text-green-600">
                                                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                                        </div>
                                                        <span className="text-sm font-medium">{t('participantLayout.terms.accepted')}</span>
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

                <ActionSidebar allowReassign={packageData.options.allowReassign} currentUserTasksCompleted={currentUserTasksCompleted} allowReceiversToAdd={true} />

                {uiState.isRejectModalOpen && <RejectModal />}
                {uiState.isReassignDrawerOpen && <ReassignDrawer />}
                {uiState.isAddReceiverDrawerOpen && <AddReceiverDrawer />}
                {uiState.isSigningDrawerOpen && <SigningDrawer />}
            </div>
        </div>
    );
};

export default ParticipantLayout;
