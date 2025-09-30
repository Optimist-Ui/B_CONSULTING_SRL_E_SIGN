import React, { useState, Fragment, ComponentType, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FiChevronLeft, FiChevronRight, FiMoreVertical, FiUsers, FiDownload, FiMaximize2, FiMinimize2, FiZoomIn, FiZoomOut, FiCheckCircle, FiClock, FiEdit, FiArchive, FiLoader } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import type { IRootState, AppDispatch } from '../../store';
import { setCurrentPage, setZoomLevel } from '../../store/slices/participantSlice';
import { downloadPackage } from '../../store/thunk/participantThunks';
import { toast } from 'react-toastify';

const FiChevronLeftTyped = FiChevronLeft as ComponentType<{ className?: string }>;
const FiChevronRightTyped = FiChevronRight as ComponentType<{ className?: string }>;
const FiMoreVerticalTyped = FiMoreVertical as ComponentType<{ className?: string }>;
const FiUsersTyped = FiUsers as ComponentType<{ className?: string }>;
const FiDownloadTyped = FiDownload as ComponentType<{ className?: string }>;
const FiMaximize2Typed = FiMaximize2 as ComponentType<{ className?: string }>;
const FiMinimize2Typed = FiMinimize2 as ComponentType<{ className?: string }>;
const FiZoomInTyped = FiZoomIn as ComponentType<{ className?: string }>;
const FiZoomOutTyped = FiZoomOut as ComponentType<{ className?: string }>;
const FiCheckCircleTyped = FiCheckCircle as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiEditTyped = FiEdit as ComponentType<{ className?: string }>;
const FiArchiveTyped = FiArchive as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;

interface ParticipantWithStatus {
    name: string;
    email: string;
    status: 'Pending' | 'Completed' | 'Not Applicable';
    roles: string[];
}

interface HeaderControlsProps {
    documentName: string;
    participants: ParticipantWithStatus[];
    status: 'Draft' | 'Sent' | 'Completed' | 'Archived' | 'Rejected' | 'Revoked' | 'Expired';
    options: {
        allowDownloadUnsigned: boolean;
    };
}

const HeaderControls: React.FC<HeaderControlsProps> = ({ documentName, participants, status, options }) => {
    const dispatch = useDispatch<AppDispatch>();
    const currentPage = useSelector((state: IRootState) => state.participant.currentPage);
    const numPages = useSelector((state: IRootState) => state.participant.numPages);
    const zoomLevel = useSelector((state: IRootState) => state.participant.zoomLevel);
    const { packageData, uiState } = useSelector((state: IRootState) => state.participant);
    const { isDownloading } = uiState;

    const [isApproverDrawerOpen, setIsApproverDrawerOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const isDocumentFinalized = status === 'Completed' || status === 'Rejected';
    const canDownload = isDocumentFinalized || options.allowDownloadUnsigned;

    const handleDownload = async () => {
        if (!packageData) {
            toast.error('Package data is not available to start download.');
            return;
        }

        toast.info('Preparing your document for download...');

        try {
            // The thunk now handles the download internally
            await dispatch(
                downloadPackage({
                    packageId: packageData._id,
                    participantId: packageData.currentUser.id,
                })
            ).unwrap();
        } catch (error) {
            // Error toast is already handled by the extra reducer
            console.error('Download failed:', error);
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handlePreviousPage = () => {
        dispatch(setCurrentPage(Math.max(1, currentPage - 1)));
    };

    const handleNextPage = () => {
        dispatch(setCurrentPage(Math.min(numPages, currentPage + 1)));
    };

    const handleZoomIn = () => {
        dispatch(setZoomLevel(Math.min(200, zoomLevel + 25)));
    };

    const handleZoomOut = () => {
        dispatch(setZoomLevel(Math.max(50, zoomLevel - 25)));
    };

    const getStatusStyles = () => {
        switch (status) {
            case 'Completed':
                return { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheckCircleTyped, label: 'Completed' };
            case 'Sent':
                return { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiClockTyped, label: 'Sent' };
            case 'Draft':
                return { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiEditTyped, label: 'Draft' };
            case 'Archived':
                return { bg: 'bg-gray-200', text: 'text-gray-800', icon: FiArchiveTyped, label: 'Archived' };
            case 'Rejected':
                return { bg: 'bg-red-100', text: 'text-red-800', icon: FiClockTyped, label: 'Rejected' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiClockTyped, label: status };
        }
    };

    const { bg, text, icon: StatusIcon, label } = getStatusStyles();

    return (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm h-14 sm:h-16 flex items-center sticky top-0 z-20">
            <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8">
                {/* Left Section - Page Navigation */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                            title="Previous Page"
                        >
                            <FiChevronLeftTyped className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>

                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-[#1e293b] whitespace-nowrap">
                                {currentPage} / {numPages}
                            </span>
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === numPages}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                            title="Next Page"
                        >
                            <FiChevronRightTyped className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Zoom Controls - Hidden on small screens */}
                    <div className="hidden sm:flex items-center gap-1 ml-4 lg:ml-6">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoomLevel <= 50}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            title="Zoom Out"
                        >
                            <FiZoomOutTyped className="w-4 h-4 text-gray-600" />
                        </button>

                        <div className="px-2 py-1 bg-gray-50 rounded border border-gray-200 min-w-[4rem] text-center">
                            <span className="text-sm font-medium text-gray-700">{zoomLevel}%</span>
                        </div>

                        <button
                            onClick={handleZoomIn}
                            disabled={zoomLevel >= 200}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            title="Zoom In"
                        >
                            <FiZoomInTyped className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Center Section - Document Title and Status */}
                <div className="flex-1 flex justify-center px-4">
                    <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl text-center">
                        <h2 className="text-sm sm:text-base font-semibold text-[#1e293b] truncate" title={documentName}>
                            {documentName}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <StatusIcon className={`w-4 h-4 ${text}`} />
                            <span className={`text-xs font-medium ${bg} ${text} px-2 py-0.5 rounded-full`}>{label}</span>
                        </div>
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-2">
                    {/* Full Screen Button - Hidden on mobile */}
                    <button
                        className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                        title={isFullscreen ? 'Exit Fullscreen View' : 'Fullscreen View'}
                        onClick={handleFullscreen}
                    >
                        {isFullscreen ? <FiMinimize2Typed className="w-4 h-4 text-gray-600" /> : <FiMaximize2Typed className="w-4 h-4 text-gray-600" />}
                    </button>

                    {/* More Options Dropdown */}
                    <Menu as="div" className="relative">
                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95" title="More options">
                            <FiMoreVerticalTyped className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200">
                                <div className="p-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => setIsApproverDrawerOpen(true)}
                                                className={`${
                                                    active ? 'bg-gray-50 text-[#1e293b]' : 'text-gray-700'
                                                } group flex rounded-lg items-center w-full px-3 py-2.5 text-sm transition-colors duration-150 font-medium`}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                                                    <FiUsersTyped className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="text-left">
                                                    <div>View Participants</div>
                                                    <div className="text-xs text-gray-500">See completion status</div>
                                                </div>
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleDownload}
                                                disabled={!canDownload || isDownloading}
                                                title={!canDownload ? 'Download is available only after completion' : 'Download PDF'}
                                                className={`${
                                                    active && !isDownloading ? 'bg-gray-50 text-[#1e293b]' : 'text-gray-700'
                                                } group flex rounded-lg items-center w-full px-3 py-2.5 text-sm transition-colors duration-150 font-medium
                                                ${(!canDownload || isDownloading) && 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                                                    {isDownloading ? <FiLoaderTyped className="w-4 h-4 text-green-600 animate-spin" /> : <FiDownloadTyped className="w-4 h-4 text-green-600" />}
                                                </div>
                                                <div className="text-left">
                                                    <div>{isDownloading ? 'Downloading...' : 'Download File'}</div>
                                                    <div className="text-xs text-gray-500">Save PDF copy</div>
                                                </div>
                                            </button>
                                        )}
                                    </Menu.Item>

                                    {/* Mobile-only zoom controls */}
                                    <div className="sm:hidden border-t border-gray-100 mt-1 pt-1">
                                        <div className="px-3 py-2">
                                            <div className="text-xs font-medium text-gray-500 mb-2">Zoom Level</div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={handleZoomOut} disabled={zoomLevel <= 50} className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                                    <FiZoomOutTyped className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">{zoomLevel}%</span>
                                                <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                                    <FiZoomInTyped className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>

            {/* Approvers Drawer */}
            <Transition show={isApproverDrawerOpen} as={Fragment}>
                <div className="fixed inset-0 overflow-hidden z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsApproverDrawerOpen(false)} />
                    </Transition.Child>

                    <div className="absolute inset-0 overflow-hidden pointer-events-none mt-16">
                        <section className="absolute inset-y-0 right-0 max-w-full flex pointer-events-auto">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <div className="w-screen max-w-md sm:max-w-lg">
                                    <div className="h-full flex flex-col bg-white shadow-2xl">
                                        <div className="px-4 sm:px-6 py-6 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-lg sm:text-xl font-semibold text-[#1e293b]">Participant Status</h2>
                                                    <p className="text-sm text-gray-500 mt-1">Track completion progress</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsApproverDrawerOpen(false)}
                                                    className="p-2 rounded-lg text-gray-500 hover:text-[#1e293b] hover:bg-gray-100 transition-all duration-200"
                                                >
                                                    <FiChevronRightTyped className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
                                            <div className="space-y-4">
                                                {participants && participants.length > 0 ? (
                                                    participants.map((participant, index) => {
                                                        const initials = participant.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .toUpperCase()
                                                            .substring(0, 2);

                                                        const isCompleted = participant.status === 'Completed';
                                                        const isNotApplicable = participant.status === 'Not Applicable';
                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`p-4 rounded-xl border ${
                                                                    isCompleted
                                                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                                                        : isNotApplicable
                                                                        ? 'bg-gray-50 border-gray-200'
                                                                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                                                            isCompleted ? 'bg-green-500' : isNotApplicable ? 'bg-gray-400' : 'bg-blue-500'
                                                                        }`}
                                                                    >
                                                                        {initials}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-medium text-[#1e293b]">{participant.name}</h4>
                                                                        <p className="text-sm text-gray-600 truncate">{participant.email}</p>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                                            {participant.roles.map((role) => (
                                                                                <span key={role} className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-800">
                                                                                    {role}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span
                                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                                isCompleted
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : isNotApplicable
                                                                                    ? 'bg-gray-200 text-gray-800'
                                                                                    : 'bg-blue-100 text-blue-800'
                                                                            }`}
                                                                        >
                                                                            {participant.status}
                                                                        </span>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {isCompleted ? 'All tasks complete' : isNotApplicable ? 'For records only' : 'Awaiting action'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-10">
                                                        <p className="text-gray-500">No participant information available.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                                            <button
                                                onClick={() => setIsApproverDrawerOpen(false)}
                                                className="w-full px-4 py-3 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                Back to Document
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Transition.Child>
                        </section>
                    </div>
                </div>
            </Transition>
        </div>
    );
};

export default HeaderControls;
