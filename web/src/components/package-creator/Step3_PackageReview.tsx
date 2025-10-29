import React, { useEffect, useMemo, useRef, useState, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { IRootState, AppDispatch } from '../../store';
import { PackageField, addReceiverToPackage, removeReceiverFromPackage, updatePackageOptions, setPackageCustomMessage } from '../../store/slices/packageSlice';
import { Contact } from '../../store/slices/contactSlice';
import SearchableContactDropdown from '../common/SearchableContactDropdown';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/display/api';
import { toast } from 'react-toastify';
import { FiFileText, FiList, FiUsers, FiCheck, FiAlertCircle, FiEye, FiZoomIn, FiInfo, FiSettings, FiClock, FiRepeat, FiBell, FiSave, FiMessageSquare } from 'react-icons/fi';
import AddEditContactModal from '../common/AddEditContactModal';

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

const FiFileTextTyped = FiFileText as ComponentType<{ className?: string }>;
const FiListTyped = FiList as ComponentType<{ className?: string }>;
const FiUsersTyped = FiUsers as ComponentType<{ className?: string }>;
const FiCheckTyped = FiCheck as ComponentType<{ className?: string }>;
const FiAlertCircleTyped = FiAlertCircle as ComponentType<{ className?: string }>;
const FiEyeTyped = FiEye as ComponentType<{ className?: string }>;
const FiZoomInTyped = FiZoomIn as ComponentType<{ className?: string }>;
const FiBellTyped = FiBell as ComponentType<{ className?: string }>;
const FiRepeatTyped = FiRepeat as ComponentType<{ className?: string }>;
const FiClockTyped = FiClock as ComponentType<{ className?: string }>;
const FiSettingsTyped = FiSettings as ComponentType<{ className?: string }>;
const FiInfoTyped = FiInfo as ComponentType<{ className?: string }>;
const FiSaveTyped = FiSave as ComponentType<{ className?: string }>;
const FiMessageSquareTyped = FiMessageSquare as ComponentType<{ className?: string }>;

interface StepProps {
    onPrevious: () => void;
}

interface PageInfo {
    width: number;
    height: number;
    scale: number;
}

type ActiveTab = 'summary' | 'recipients' | 'settings';

const Step3_PackageReview: React.FC<StepProps> = ({ onPrevious }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const dispatch = useDispatch<AppDispatch>();
    const { currentPackage, error, loading } = useSelector((state: IRootState) => state.packages);
    const { contacts } = useSelector((state: IRootState) => state.contacts);

    const [selectedReceiver, setSelectedReceiver] = useState<Contact | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
    const [numPages, setNumPages] = useState<number>(0);
    const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
    const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(true);
    const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'fit' | 'actual'>('fit');
    const [tempExpiresAt, setTempExpiresAt] = useState<string>('');
    const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);

    const pdfProxyRef = useRef<PDFDocumentProxy | null>(null);
    const canvasRefs = useRef<Array<React.RefObject<HTMLCanvasElement>>>([]);
    const renderTasksRef = useRef<RenderTask[]>([]);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Options for reminderPeriod dropdown
    const reminderPeriodOptions = [
        { value: '1_hour_before', label: t('packageReview.settings.reminders.timing.options.1_hour'), durationMs: 3600000 },
        { value: '2_hours_before', label: t('packageReview.settings.reminders.timing.options.2_hours'), durationMs: 7200000 },
        { value: '1_day_before', label: t('packageReview.settings.reminders.timing.options.1_day'), durationMs: 86400000 },
        { value: '2_days_before', label: t('packageReview.settings.reminders.timing.options.2_days'), durationMs: 172800000 },
    ];

    const availableReminderOptions = useMemo(() => {
        const expiresAt = currentPackage?.options.expiresAt;
        if (!expiresAt) {
            return reminderPeriodOptions;
        }
        const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();
        if (timeUntilExpiry <= 0) {
            return [];
        }
        return reminderPeriodOptions.filter((option) => timeUntilExpiry > option.durationMs);
    }, [currentPackage?.options.expiresAt, t]);

    const maxFirstReminderDays = useMemo(() => {
        const expiresAt = currentPackage?.options.expiresAt;
        if (!expiresAt) {
            return 999;
        }
        const timeUntilExpiryMs = new Date(expiresAt).getTime() - Date.now();
        if (timeUntilExpiryMs <= 86400000) {
            return 0;
        }
        return Math.floor(timeUntilExpiryMs / (1000 * 60 * 60 * 24));
    }, [currentPackage?.options.expiresAt]);

    const maxRepeatReminderDays = useMemo(() => {
        const firstDays = currentPackage?.options.firstReminderDays;
        if (firstDays) {
            return firstDays;
        }
        return maxFirstReminderDays;
    }, [currentPackage?.options.firstReminderDays, maxFirstReminderDays]);

    useEffect(() => {
        if (currentPackage?.options.expiresAt) {
            const date = new Date(currentPackage.options.expiresAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            setTempExpiresAt(`${year}-${month}-${day}T${hours}:${minutes}`);
        }
    }, [currentPackage?.options.expiresAt]);

    useEffect(() => {
        const cleanup = () => {
            renderTasksRef.current.forEach((task) => task?.cancel?.());
            pdfProxyRef.current?.destroy();
            pdfProxyRef.current = null;
            setNumPages(0);
            setPageInfos([]);
            setIsRendering(false);
            setIsCanvasReady(false);
        };

        if (!currentPackage || (!currentPackage.fileData && !currentPackage.fileUrl)) {
            setPdfLoadError(t('packageReview.errors.missingSource'));
            setIsRendering(false);
            return cleanup;
        }

        let isMounted = true;
        setPdfLoadError(null);
        setIsRendering(true);

        const getPdfData = async () => {
            if (currentPackage.fileData?.byteLength) return currentPackage.fileData.slice(0);
            if (currentPackage.downloadUrl) {
                const response = await fetch(currentPackage.downloadUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(t('packageReview.errors.fetchFailed'));
                return response.arrayBuffer();
            } else if (currentPackage.fileUrl) {
                const correctedFileUrl = currentPackage.fileUrl.startsWith('/public') ? currentPackage.fileUrl : `/public${currentPackage.fileUrl}`;
                const fullUrl = `${BACKEND_URL}${correctedFileUrl}`;
                const response = await fetch(fullUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(t('packageReview.errors.fetchFailed'));
                return response.arrayBuffer();
            }
            throw new Error(t('packageReview.errors.noSource'));
        };

        const loadPdf = async () => {
            try {
                const data = await getPdfData();
                if (!isMounted || !data) return;
                const pdf = await loadPdfDocument(data);
                if (!isMounted) return;

                const fetchedPageInfos: PageInfo[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale });
                    fetchedPageInfos.push({ width: viewport.width, height: viewport.height, scale });
                }

                if (isMounted) {
                    pdfProxyRef.current = pdf;
                    setNumPages(pdf.numPages);
                    setPageInfos(fetchedPageInfos);
                    canvasRefs.current = Array.from({ length: pdf.numPages }, () => React.createRef());
                    setIsCanvasReady(true);
                }
            } catch (err: any) {
                if (isMounted) {
                    setPdfLoadError(err.message || t('packageReview.errors.loadFailed'));
                    setIsRendering(false);
                    console.error('PDF load error:', err);
                }
            }
        };

        loadPdf();
        return () => {
            isMounted = false;
            cleanup();
        };
    }, [currentPackage?.fileUrl, currentPackage?.fileData, currentPackage?.downloadUrl, t]);

    useEffect(() => {
        if (!pdfProxyRef.current || numPages === 0 || pageInfos.length === 0 || !isCanvasReady) {
            return;
        }

        const renderAllPages = async () => {
            const tasks: Promise<RenderTask | void>[] = [];
            for (let i = 1; i <= numPages; i++) {
                const canvas = canvasRefs.current[i - 1]?.current;
                const pageInfo = pageInfos[i - 1];

                if (canvas && pdfProxyRef.current && pageInfo) {
                    canvas.width = pageInfo.width;
                    canvas.height = pageInfo.height;
                    const context = canvas.getContext('2d');
                    if (!context) {
                        console.error(`Failed to get 2D context for canvas on page ${i}`);
                        continue;
                    }
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    tasks.push(renderPdfPageToCanvas(pdfProxyRef.current, i, canvas, pageInfo.scale));
                }
            }
            try {
                await Promise.all(tasks);
            } catch (err: any) {
                if (err.name !== 'RenderingCancelledException') {
                    console.error('Rendering error:', err);
                    toast.error(t('packageReview.errors.renderFailed') as string);
                }
            } finally {
                setIsRendering(false);
            }
        };

        renderAllPages();
        return () => {
            renderTasksRef.current.forEach((task) => task?.cancel?.());
            renderTasksRef.current = [];
        };
    }, [numPages, pageInfos, isCanvasReady, t]);

    useEffect(() => {
        const selectedPeriod = currentPackage?.options.reminderPeriod;
        if (!selectedPeriod || !availableReminderOptions) {
            return;
        }
        const isSelectedPeriodValid = availableReminderOptions.some((option) => option.value === selectedPeriod);
        if (!isSelectedPeriodValid) {
            dispatch(updatePackageOptions({ reminderPeriod: null }));
            toast.info(t('packageReview.messages.reminderTimingReset') as string, { autoClose: 6000 });
        }
    }, [availableReminderOptions, currentPackage?.options.reminderPeriod, dispatch, t]);

    useEffect(() => {
        const firstReminderDays = currentPackage?.options?.firstReminderDays;
        if (firstReminderDays && firstReminderDays > maxFirstReminderDays) {
            dispatch(updatePackageOptions({ firstReminderDays: null }));
            toast.info(t('packageReview.messages.firstReminderReset') as string, { autoClose: 6000 });
        }
    }, [maxFirstReminderDays, currentPackage?.options?.firstReminderDays, dispatch, t]);

    useEffect(() => {
        const repeatDays = currentPackage?.options?.repeatReminderDays;
        const maxRepeat = currentPackage?.options.firstReminderDays || maxFirstReminderDays;
        if (repeatDays && repeatDays > maxRepeat) {
            dispatch(updatePackageOptions({ repeatReminderDays: null }));
            toast.info(t('packageReview.messages.repeatReminderReset') as string, { autoClose: 6000 });
        }
    }, [currentPackage?.options?.repeatReminderDays, currentPackage?.options.firstReminderDays, maxFirstReminderDays, dispatch, t]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const getPackageStats = () => {
        const fields = currentPackage?.fields || [];
        const totalFields = fields.length;
        const assignedFields = fields.filter((f) => f.assignedUsers?.length).length;
        const allUsers = new Set(fields.flatMap((f) => f.assignedUsers || []).map((u) => u.contactId));
        const uniqueRecipients = allUsers.size + (currentPackage?.receivers.length || 0);
        const unassignedRequiredFields = fields.filter((field) => field.required && (!field.assignedUsers || field.assignedUsers.length === 0));

        return {
            totalFields,
            assignedFields,
            uniqueRecipients,
            completionRate: totalFields > 0 ? Math.round((assignedFields / totalFields) * 100) : 0,
            unassignedRequiredFields,
        };
    };

    const calculateDocumentCredits = () => {
        const fields = currentPackage?.fields || [];
        const uniqueSignerIds = new Set<string>();
        fields.forEach((field) => {
            if (field.type === 'signature') {
                (field.assignedUsers || []).forEach((user) => {
                    if (user.role === 'Signer') {
                        uniqueSignerIds.add(user.contactId);
                    }
                });
            }
        });
        const uniqueSignerCount = uniqueSignerIds.size;
        const creditsNeeded = uniqueSignerCount > 0 ? Math.ceil(uniqueSignerCount / 2) : 1;

        return {
            uniqueSignerCount,
            creditsNeeded,
        };
    };

    const handleAddReceiver = () => {
        if (selectedReceiver) {
            dispatch(
                addReceiverToPackage({
                    contactId: selectedReceiver._id,
                    contactName: `${selectedReceiver.firstName} ${selectedReceiver.lastName}`,
                    contactEmail: selectedReceiver.email,
                })
            );
            setSelectedReceiver(null);
            toast.success(t('packageReview.messages.receiverAdded', { name: `${selectedReceiver.firstName} ${selectedReceiver.lastName}` }) as string);
        }
    };

    const handleRemoveReceiver = (receiverId: string) => {
        dispatch(removeReceiverFromPackage(receiverId));
    };

    const handleOptionsChange = (updates: Parameters<typeof updatePackageOptions>[0]) => {
        dispatch(updatePackageOptions(updates));
    };

    const handleConfirmDate = () => {
        if (tempExpiresAt) {
            const [datePart, timePart] = tempExpiresAt.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            const selectedDate = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();

            if (selectedDate <= now) {
                toast.error(t('packageReview.errors.pastDate') as string);
                return;
            }

            handleOptionsChange({ expiresAt: selectedDate.toISOString() });
            const formatOptions: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            };
            const formattedDate = selectedDate.toLocaleDateString('en-US', formatOptions);
            toast.success(t('packageReview.messages.expirationSet', { date: formattedDate }) as string);
        } else {
            handleOptionsChange({ expiresAt: null });
            toast.info(t('packageReview.messages.expirationRemoved') as string);
        }

        if (dateInputRef.current) {
            dateInputRef.current.blur();
        }
    };

    if (!currentPackage) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="font-medium">{t('packageReview.loading')}</p>
                </div>
            </div>
        );
    }

    if (pdfLoadError) {
        return (
            <div className="flex flex-col justify-center items-center h-full max-w-md mx-auto text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-lg">
                    <FiAlertCircleTyped className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-800 mb-2">{t('packageReview.errors.loadFailed')}</h3>
                    <p className="text-red-600 mb-6">{pdfLoadError}</p>
                    <button onClick={onPrevious} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                        {t('packagesDashboard.returnToPrevious')} {/* Assuming this key exists elsewhere */}
                    </button>
                </div>
            </div>
        );
    }

    const stats = getPackageStats();
    const creditInfo = calculateDocumentCredits();

    const TabButton: React.FC<{ tab: ActiveTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex justify-center items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <>
            <div className="h-full bg-gradient-to-br dark:bg-gray-900 from-slate-50 to-blue-50 overflow-hidden flex flex-col">
                <div className="flex flex-grow overflow-hidden">
                    {/* PDF Preview */}
                    <div className="flex-1 flex flex-col dark:bg-gray-900 bg-white border-r border-gray-200">
                        {/* PDF Controls */}
                        <div className="flex justify-between items-center px-4 py-3 dark:bg-gray-900 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <FiEyeTyped className="w-5 h-5" />
                                <h3 className="font-semibold">{t('packageReview.preview.title')}</h3>
                                <span className="text-sm">
                                    ({numPages} {numPages === 1 ? t('packageReview.preview.pageCount', { count: numPages }) : t('packageReview.preview.pageCount_plural', { count: numPages })})
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode(viewMode === 'fit' ? 'actual' : 'fit')}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                                >
                                    <FiZoomInTyped className="w-4 h-4" />
                                    {viewMode === 'fit' ? t('packageReview.preview.actualSize') : t('packageReview.preview.fitWidth')}
                                </button>
                            </div>
                        </div>

                        {/* PDF Content */}
                        <div className="flex-1 overflow-auto bg-gray-100 relative">
                            {isRendering && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col justify-center items-center z-20">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                                    <p className="mt-4 font-semibold">{t('packageReview.preview.rendering.title')}</p>
                                    <p className="text-sm mt-1">{t('packageReview.preview.rendering.subtitle')}</p>
                                </div>
                            )}

                            <div className="p-6 dark:bg-gray-900">
                                <div className={`pdf-viewer-pages space-y-8 mx-auto ${viewMode === 'fit' ? 'max-w-full' : ''}`}>
                                    {Array.from({ length: numPages }, (_, index) => {
                                        const pageInfo = pageInfos[index];
                                        const fieldsOnPage = currentPackage.fields.filter((field) => field.page === index + 1);

                                        if (!pageInfo) {
                                            return null;
                                        }

                                        const containerWidth = viewMode === 'fit' ? '100%' : `${pageInfo.width}px`;
                                        const containerHeight = viewMode === 'fit' ? 'auto' : `${pageInfo.height}px`;
                                        const canvasStyle = viewMode === 'fit' ? 'w-full h-auto' : 'w-full h-full';

                                        return (
                                            <div key={`review-page-${index}`} className="relative">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-sm font-medium">{t('packageReview.preview.pageIndicator', { current: index + 1, total: numPages })}</span>
                                                </div>
                                                <div
                                                    className="relative dark:bg-gray-900 bg-white shadow-2xl border border-gray-200 mx-auto overflow-hidden rounded-lg"
                                                    style={{
                                                        width: containerWidth,
                                                        height: containerHeight,
                                                        maxWidth: viewMode === 'fit' ? '100%' : 'none',
                                                    }}
                                                >
                                                    <canvas
                                                        ref={canvasRefs.current[index]}
                                                        className={`${canvasStyle} block`}
                                                        style={{
                                                            width: viewMode === 'fit' ? '100%' : `${pageInfo.width}px`,
                                                            height: viewMode === 'fit' ? 'auto' : `${pageInfo.height}px`,
                                                        }}
                                                    />
                                                    {fieldsOnPage.map((field) => {
                                                        const assignedUsers = field.assignedUsers || [];
                                                        const hasAssignments = assignedUsers.length > 0;
                                                        const showPlaceholder = ['text', 'textarea'].includes(field.type) && field.placeholder;
                                                        const isInvalid = field.required && !hasAssignments;

                                                        const fieldStyle =
                                                            viewMode === 'fit'
                                                                ? {
                                                                      left: `${(field.x / pageInfo.width) * 100}%`,
                                                                      top: `${(field.y / pageInfo.height) * 100}%`,
                                                                      width: `${(field.width / pageInfo.width) * 100}%`,
                                                                      height: `${(field.height / pageInfo.height) * 100}%`,
                                                                  }
                                                                : {
                                                                      left: `${field.x}px`,
                                                                      top: `${field.y}px`,
                                                                      width: `${field.width}px`,
                                                                      height: `${field.height}px`,
                                                                  };

                                                        return (
                                                            <div
                                                                key={field.id}
                                                                className={`absolute border-2 border-dashed rounded-lg backdrop-blur-sm transition-all duration-200 ${
                                                                    isInvalid
                                                                        ? 'bg-red-500/20 border-red-500'
                                                                        : hasAssignments
                                                                        ? 'bg-green-500/20 border-green-500'
                                                                        : 'bg-amber-500/20 border-amber-500'
                                                                }`}
                                                                style={fieldStyle}
                                                            >
                                                                <div
                                                                    className={`flex items-center text-white text-xs font-bold px-2 py-0.5 rounded-tl-md rounded-tr-md ${
                                                                        isInvalid ? 'bg-red-600' : hasAssignments ? 'bg-green-600' : 'bg-amber-600'
                                                                    }`}
                                                                >
                                                                    <span className="truncate flex-1">{field.label}</span>
                                                                </div>
                                                                {showPlaceholder && (
                                                                    <div className="flex items-center justify-center h-full text-xs px-2 py-1">
                                                                        <span className="truncate">{field.placeholder}</span>
                                                                    </div>
                                                                )}
                                                                {hasAssignments && (
                                                                    <div className="absolute -bottom-7 left-0 right-0 flex flex-wrap gap-1.5">
                                                                        {assignedUsers.map((user, idx) => (
                                                                            <div
                                                                                key={user.id || idx}
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-white text-[10px] font-medium shadow-sm ${
                                                                                    user.role === 'Signer' ? 'bg-indigo-600' : user.role === 'Approver' ? 'bg-teal-600' : 'bg-orange-600'
                                                                                }`}
                                                                                title={`${user.contactName} - ${user.role}${
                                                                                    user.signatureMethods ? '\nAuth: ' + user.signatureMethods.join(', ') : ''
                                                                                }`}
                                                                            >
                                                                                {user.signatureMethods && user.signatureMethods.length > 0 && (
                                                                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-white/20 rounded text-[9px] font-semibold">
                                                                                        {user.signatureMethods.includes('Email OTP') && <span>Email</span>}
                                                                                        {user.signatureMethods.includes('Email OTP') && user.signatureMethods.includes('SMS OTP') && <span>+</span>}
                                                                                        {user.signatureMethods.includes('SMS OTP') && <span>SMS</span>}
                                                                                    </span>
                                                                                )}
                                                                                <span className="truncate max-w-[120px]">{user.contactName}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Settings Panel (Tabs) */}
                    <div className="w-96 dark:bg-gray-900 bg-white flex flex-col shadow-xl">
                        <div className="px-3 pt-3 border-b border-gray-200">
                            <div className="flex items-center rounded-t-lg overflow-hidden">
                                <TabButton tab="summary" label={t('packageReview.tabs.summary')} icon={<FiInfoTyped />} />
                                <TabButton tab="recipients" label={t('packageReview.tabs.recipients')} icon={<FiUsersTyped />} />
                                <TabButton tab="settings" label={t('packageReview.tabs.settings')} icon={<FiSettingsTyped />} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 dark:bg-gray-900 bg-gray-50/50">
                            {activeTab === 'summary' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h3 className="text-xl font-bold leading-tight">{currentPackage.name}</h3>

                                    {/* Optional Message Block */}
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <FiMessageSquareTyped />
                                            {t('packageReview.summary.message.title')}
                                        </h4>
                                        <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('packageReview.summary.message.description')}</p>
                                            <textarea
                                                className="w-full h-24 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={t('packageReview.summary.message.placeholder')}
                                                value={currentPackage.customMessage || ''}
                                                onChange={(e) => dispatch(setPackageCustomMessage(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    {/* Details at a Glance */}
                                    <div>
                                        <h4 className="font-semibold mb-2">{t('packageReview.summary.details.title')}</h4>
                                        <div className="p-4 dark:bg-gray-900 bg-white border rounded-lg grid grid-cols-3 gap-4 text-center">
                                            <div className="p-2">
                                                <div className="text-2xl font-bold text-blue-600">{stats.totalFields}</div>
                                                <div className="text-xs mt-1">{t('packageReview.summary.details.fields')}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-2xl font-bold text-green-600">{stats.uniqueRecipients}</div>
                                                <div className="text-xs mt-1">{t('packageReview.summary.details.recipients')}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-2xl font-bold">{numPages}</div>
                                                <div className="text-xs mt-1">{t('packageReview.summary.details.pages')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Credit Usage Information */}
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <FiInfoTyped />
                                            {t('packageReview.summary.credits.title')}
                                        </h4>
                                        <div
                                            className={`p-4 border rounded-lg ${
                                                creditInfo.creditsNeeded === 1
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                                                        creditInfo.creditsNeeded === 1
                                                            ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                                                            : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                                                    }`}
                                                >
                                                    {creditInfo.creditsNeeded}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm mb-1">
                                                        {creditInfo.creditsNeeded === 1
                                                            ? t('packageReview.summary.credits.usageText')
                                                            : t('packageReview.summary.credits.usageText_plural', { count: creditInfo.creditsNeeded })}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {creditInfo.uniqueSignerCount === 0
                                                            ? t('packageReview.summary.credits.signerCountText')
                                                            : creditInfo.uniqueSignerCount === 1
                                                            ? t('packageReview.summary.credits.signerCountText_plural', { count: creditInfo.uniqueSignerCount })
                                                            : t('packageReview.summary.credits.signerCountText_plural_plural', { count: creditInfo.uniqueSignerCount })}
                                                    </p>
                                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            💡 <span className="font-medium">{t('packageReview.summary.credits.tip_strong')}</span> {t('packageReview.summary.credits.tip_text')}
                                                            {creditInfo.uniqueSignerCount > 2 && (
                                                                <span>
                                                                    {' '}
                                                                    {t('packageReview.summary.credits.tip_extra', {
                                                                        signers: creditInfo.uniqueSignerCount,
                                                                        credits: creditInfo.creditsNeeded,
                                                                    })}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assignment Progress */}
                                    <div>
                                        <h4 className="font-semibold mb-2">{t('packageReview.summary.progress.title')}</h4>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                                    stats.completionRate === 100 ? 'bg-green-500' : stats.completionRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${stats.completionRate}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-right mt-1">{t('packageReview.summary.progress.completeText', { rate: stats.completionRate })}</p>
                                        {stats.unassignedRequiredFields.length > 0 && (
                                            <div className="mt-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg">
                                                <p className="font-bold text-sm">{t('packageReview.summary.progress.actionRequired')}</p>
                                                <p className="text-xs">
                                                    {stats.unassignedRequiredFields.length === 1
                                                        ? t('packageReview.summary.progress.unassignedFields')
                                                        : t('packageReview.summary.progress.unassignedFields_plural', { count: stats.unassignedRequiredFields.length })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'recipients' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div>
                                        <h4 className="font-semibold mb-2">{t('packageReview.recipients.assigned.title')}</h4>
                                        <div className="space-y-2 p-3 dark:bg-gray-900 bg-white border rounded-lg max-h-60 overflow-y-auto">
                                            {currentPackage.fields.flatMap((f) => f.assignedUsers || []).length > 0 ? (
                                                currentPackage.fields
                                                    .flatMap((f) => f.assignedUsers || [])
                                                    .map((user, idx) => (
                                                        <div key={user.id || idx} className="p-3 bg-gray-50 rounded-md text-sm">
                                                            <p className="font-bold">{user.contactName}</p>
                                                            <p className="text-xs text-indigo-600 font-semibold">{user.role}</p>
                                                        </div>
                                                    ))
                                            ) : (
                                                <div className="text-center text-sm py-6">
                                                    <FiUsersTyped className="mx-auto text-3xl mb-2" />
                                                    {t('packageReview.recipients.assigned.empty')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">{t('packageReview.recipients.notificationOnly.title')}</h4>
                                        <div className="space-y-3 p-4 dark:bg-gray-900 bg-white border rounded-lg">
                                            <p className="text-xs">{t('packageReview.recipients.notificationOnly.description')}</p>
                                            <SearchableContactDropdown
                                                contacts={contacts}
                                                selectedContact={selectedReceiver}
                                                onSelectContact={setSelectedReceiver}
                                                onAddNewContact={() => setAddContactModalOpen(true)}
                                            />
                                            <button
                                                onClick={handleAddReceiver}
                                                disabled={!selectedReceiver}
                                                className="w-full px-3 py-2 dark:bg-gray-900 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg font-medium transition-colors duration-200"
                                            >
                                                {t('packageReview.recipients.notificationOnly.addButton')}
                                            </button>
                                            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                                                {currentPackage.receivers.map((rec) => (
                                                    <div key={rec.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                                        <span className="font-medium">{rec.contactName}</span>
                                                        <button onClick={() => handleRemoveReceiver(rec.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full">
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="p-4 dark:bg-gray-900 bg-white border rounded-lg">
                                        <label className="font-semibold flex items-center gap-2 mb-2">
                                            <FiClockTyped /> {t('packageReview.settings.expiration.title')}
                                        </label>
                                        <p className="text-xs mb-3">{t('packageReview.settings.expiration.description')}</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="datetime-local"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={tempExpiresAt}
                                                onChange={(e) => setTempExpiresAt(e.target.value)}
                                                ref={dateInputRef}
                                            />
                                            <button
                                                onClick={handleConfirmDate}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                                            >
                                                {t('packageReview.settings.expiration.okButton')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 dark:bg-gray-900 bg-white border rounded-lg space-y-3">
                                        <label className="font-semibold flex items-center gap-2">
                                            <FiBellTyped /> {t('packageReview.settings.reminders.title')}
                                        </label>
                                        {!currentPackage.options.expiresAt && (
                                            <p className="text-xs text-amber-700 p-2 bg-amber-50 dark:bg-gray-800 rounded-md">{t('packageReview.settings.reminders.setExpirationNote')}</p>
                                        )}
                                        <label className={`flex items-center dark:bg-gray-900 text-sm gap-3 p-2 rounded-md hover:bg-gray-50 ${!currentPackage.options.expiresAt ? 'opacity-40' : ''}`}>
                                            <input
                                                type="checkbox"
                                                className="mr-2 rounded"
                                                checked={currentPackage.options.sendExpirationReminders}
                                                onChange={(e) => handleOptionsChange({ sendExpirationReminders: e.target.checked })}
                                                disabled={!currentPackage.options.expiresAt}
                                            />
                                            {t('packageReview.settings.reminders.enableCheckbox')}
                                        </label>
                                        <div
                                            className={`space-y-4 pl-8 border-l-2 ml-2 transition-opacity ${
                                                !currentPackage.options.sendExpirationReminders || !currentPackage.options.expiresAt ? 'opacity-40 pointer-events-none' : 'opacity-100'
                                            }`}
                                        >
                                            <div>
                                                <label className="text-xs font-medium block mb-1">{t('packageReview.settings.reminders.timing.label')}</label>
                                                <select
                                                    className="w-full dark:bg-gray-900 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    value={currentPackage.options.reminderPeriod || ''}
                                                    onChange={(e) => handleOptionsChange({ reminderPeriod: e.target.value || null })}
                                                    disabled={!currentPackage.options.sendExpirationReminders || !currentPackage.options.expiresAt || availableReminderOptions.length === 0}
                                                >
                                                    <option value="">{t('packageReview.settings.reminders.timing.placeholder')}</option>
                                                    {availableReminderOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {currentPackage?.options.sendExpirationReminders && availableReminderOptions.length === 0 && currentPackage?.options.expiresAt && (
                                                    <p className="text-xs text-amber-700 mt-2 p-2 dark:bg-gray-900 bg-amber-50 rounded-md">
                                                        {t('packageReview.settings.reminders.timing.tooSoonNote')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 dark:bg-gray-900 bg-white border rounded-lg space-y-3">
                                        <label className="font-semibold flex items-center gap-2">
                                            <FiRepeatTyped /> {t('packageReview.settings.autoReminders.title')}
                                        </label>
                                        {!currentPackage.options.expiresAt && (
                                            <p className="text-xs text-amber-700 p-2 bg-amber-50 dark:bg-gray-800 rounded-md">{t('packageReview.settings.autoReminders.setExpirationNote')}</p>
                                        )}
                                        <label className={`flex items-center dark:bg-gray-900 text-sm gap-3 p-2 rounded-md hover:bg-gray-50 ${!currentPackage.options.expiresAt ? 'opacity-40' : ''}`}>
                                            <input
                                                type="checkbox"
                                                className="mr-2 rounded"
                                                checked={currentPackage.options.sendAutomaticReminders}
                                                onChange={(e) => handleOptionsChange({ sendAutomaticReminders: e.target.checked })}
                                                disabled={!currentPackage.options.expiresAt}
                                            />
                                            {t('packageReview.settings.autoReminders.enableCheckbox')}
                                        </label>
                                        <div
                                            className={`space-y-4 pl-8 border-l-2 ml-2 transition-opacity ${
                                                !currentPackage.options.sendAutomaticReminders || !currentPackage.options.expiresAt || maxFirstReminderDays < 1
                                                    ? 'opacity-40 pointer-events-none'
                                                    : 'opacity-100'
                                            }`}
                                        >
                                            <div>
                                                <label className="text-xs font-medium block mb-1">{t('packageReview.settings.autoReminders.first.label')}</label>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={maxFirstReminderDays}
                                                        className="w-20 px-2 py-1 border dark:bg-gray-900 border-gray-300 rounded text-sm disabled:bg-gray-100"
                                                        value={currentPackage.options.firstReminderDays || ''}
                                                        onChange={(e) => {
                                                            let value = parseInt(e.target.value);
                                                            if (value > maxFirstReminderDays) {
                                                                value = maxFirstReminderDays;
                                                            }
                                                            handleOptionsChange({ firstReminderDays: value || null });
                                                        }}
                                                        disabled={!currentPackage.options.sendAutomaticReminders || !currentPackage.options.expiresAt || maxFirstReminderDays < 1}
                                                    />
                                                    {t('packageReview.settings.autoReminders.first.suffix')}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium block mb-1">{t('packageReview.settings.autoReminders.repeat.label')}</label>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {t('packageReview.settings.autoReminders.repeat.prefix')}
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={maxRepeatReminderDays}
                                                        className="w-20 px-2 py-1 dark:bg-gray-900 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                                                        value={currentPackage.options.repeatReminderDays || ''}
                                                        onChange={(e) => {
                                                            let value = parseInt(e.target.value);
                                                            if (value > maxRepeatReminderDays) {
                                                                value = maxRepeatReminderDays;
                                                            }
                                                            handleOptionsChange({ repeatReminderDays: value || null });
                                                        }}
                                                        disabled={!currentPackage.options.sendAutomaticReminders || !currentPackage.options.expiresAt || maxFirstReminderDays < 1}
                                                    />
                                                    {t('packageReview.settings.autoReminders.repeat.suffix')}
                                                </div>
                                            </div>
                                        </div>
                                        {currentPackage.options.sendAutomaticReminders && maxFirstReminderDays < 1 && currentPackage.options.expiresAt && (
                                            <div className="pl-8 ml-2">
                                                <p className="text-xs text-amber-700 dark:bg-gray-900 mt-2 p-2 bg-amber-50 rounded-md">{t('packageReview.settings.autoReminders.tooSoonNote')}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 dark:bg-gray-900 bg-white border rounded-lg space-y-3">
                                        <label className="font-semibold">{t('packageReview.settings.permissions.title')}</label>
                                        <label className="flex items-center text-sm gap-3 p-2 rounded-md dark:bg-gray-900 hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                className="mr-2 rounded"
                                                checked={currentPackage.options.allowDownloadUnsigned}
                                                onChange={(e) => handleOptionsChange({ allowDownloadUnsigned: e.target.checked })}
                                            />
                                            {t('packageReview.settings.permissions.allowDownload')}
                                        </label>
                                        <label className="flex items-center text-sm gap-3 p-2 dark:bg-gray-900 rounded-md hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                className="mr-2 rounded"
                                                checked={currentPackage.options.allowReassign}
                                                onChange={(e) => handleOptionsChange({ allowReassign: e.target.checked })}
                                            />
                                            {t('packageReview.settings.permissions.allowReassign')}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddEditContactModal
                isOpen={isAddContactModalOpen}
                onClose={() => setAddContactModalOpen(false)}
                onSaveSuccess={(newContact) => {
                    setSelectedReceiver(newContact);
                    setAddContactModalOpen(false);
                    toast.success(t('packageReview.messages.contactCreated', { name: `${newContact.firstName} ${newContact.lastName}` }) as string);
                }}
            />
        </>
    );
};

export default Step3_PackageReview;
