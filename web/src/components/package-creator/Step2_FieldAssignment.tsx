import React, { useState, useEffect, useCallback, useRef, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { nanoid } from '@reduxjs/toolkit';
import { useTranslation } from 'react-i18next';
import { FiMousePointer, FiX, FiSettings, FiAlertCircle } from 'react-icons/fi';

// Redux Imports
import { AppDispatch, IRootState } from '../../store';
import {
    addFieldToCurrentPackage,
    updateFieldInCurrentPackage,
    deleteFieldFromCurrentPackage,
    setSelectedPackageField,
    PackageField,
    assignUserToField,
    removeUserFromField,
    AssignedUser,
} from '../../store/slices/packageSlice';

// PDF Utility Imports
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Child Component Imports
import EditorToolbar from '../template-creator/EditorToolbar';
import PackageFieldPropertiesPanel from './PackageFieldPropertiesPanel';
import PackageFieldRenderer from './PackageFieldRenderer';

const FiMousePointerTyped = FiMousePointer as ComponentType<{ className?: string }>;
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiSettingsTyped = FiSettings as ComponentType<{ className?: string }>;
const FiAlertCircleTyped = FiAlertCircle as ComponentType<{ className?: string }>;

interface PageInfo {
    width: number;
    height: number;
    scale: number;
}
interface StepProps {
    onNext: () => void;
    onPrevious: () => void;
    onConfirm: () => void;
}

const Step2_FieldAssignment: React.FC<StepProps> = ({ onPrevious }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { currentPackage, selectedFieldId } = useSelector((state: IRootState) => state.packages);

    const [numPages, setNumPages] = useState<number>(0);
    const [pdfInstance, setPdfInstance] = useState<PDFDocumentProxy | null>(null);
    const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
    const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
    const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const pageRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
    const canvasRefs = useRef<Array<React.RefObject<HTMLCanvasElement>>>([]);
    const isLoadingPdf = useRef(false);
    const renderTasks = useRef<Array<{ page: number; task: any }>>([]);
    const wasManuallyClosedRef = useRef(false);

    const selectedField = currentPackage?.fields.find((field) => field.id === selectedFieldId);

    useEffect(() => {
        if (numPages > 0) {
            pageRefs.current = Array.from({ length: numPages }, () => React.createRef());
            canvasRefs.current = Array.from({ length: numPages }, () => React.createRef());
        }
    }, [numPages]);

    useEffect(() => {
        const loadPdf = async () => {
            if (!currentPackage || isLoadingPdf.current) {
                setPdfInstance(null);
                setNumPages(0);
                setPageInfos([]);
                return;
            }
            setPdfLoadError(null);
            isLoadingPdf.current = true;
            try {
                let pdf: PDFDocumentProxy;
                if (currentPackage.fileData?.byteLength) pdf = await loadPdfDocument(currentPackage.fileData.slice(0));
                else if (currentPackage.downloadUrl) {
                    const response = await fetch(currentPackage.downloadUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`${t('fieldAssignment.errors.fetchFailed')}: ${response.statusText}`);
                    pdf = await loadPdfDocument(await response.arrayBuffer());
                } else if (currentPackage.fileUrl && !currentPackage.fileUrl.startsWith('blob:')) {
                    const correctedFileUrl = currentPackage.fileUrl.startsWith('/public') ? currentPackage.fileUrl : `/public${currentPackage.fileUrl}`;
                    const fullUrl = `${import.meta.env.VITE_BASE_URL}${correctedFileUrl}`;
                    const response = await fetch(fullUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`${t('fieldAssignment.errors.fetchFailed')}: ${response.statusText}`);
                    pdf = await loadPdfDocument(await response.arrayBuffer());
                } else if (currentPackage.fileUrl?.startsWith('blob:')) {
                    const response = await fetch(currentPackage.fileUrl);
                    if (!response.ok) throw new Error(`${t('fieldAssignment.errors.fetchBlobFailed')}: ${response.statusText}`);
                    pdf = await loadPdfDocument(await response.arrayBuffer());
                } else throw new Error(t('fieldAssignment.errors.noValidPdf'));

                setPdfInstance(pdf);
                setNumPages(pdf.numPages);
                const scale = 1.5;
                const fetchedPageInfos: PageInfo[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });
                    fetchedPageInfos.push({ width: viewport.width, height: viewport.height, scale });
                }
                setPageInfos(fetchedPageInfos);
            } catch (err: any) {
                const errorMessage = `${t('fieldAssignment.errors.loadFailed')}: ${err.message}`;
                setPdfLoadError(errorMessage);
                toast.error(errorMessage);
            } finally {
                isLoadingPdf.current = false;
            }
        };
        loadPdf();
        return () => {
            renderTasks.current.forEach(({ task }) => task?.cancel?.());
            renderTasks.current = [];
            if (currentPackage?.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(currentPackage.fileUrl);
        };
    }, [currentPackage, t]);

    useEffect(() => {
        const renderPages = async () => {
            if (!pdfInstance || !pageInfos.length || !canvasRefs.current.length || canvasRefs.current.some((ref) => !ref.current)) return;
            renderTasks.current.forEach(({ task }) => task?.cancel?.());
            renderTasks.current = [];
            try {
                for (let i = 1; i <= numPages; i++) {
                    const canvas = canvasRefs.current[i - 1]?.current;
                    if (canvas) {
                        const task = await renderPdfPageToCanvas(pdfInstance, i, canvas, pageInfos[i - 1].scale);
                        renderTasks.current.push({ page: i, task });
                    }
                }
            } catch (err: any) {
                if (err.name === 'RenderingCancelledException') return;
                toast.error(t('fieldAssignment.errors.renderFailed') as string);
            }
        };
        const timer = setTimeout(renderPages, 100);
        return () => {
            clearTimeout(timer);
            renderTasks.current.forEach(({ task }) => task?.cancel?.());
            renderTasks.current = [];
        };
    }, [pdfInstance, pageInfos, numPages, t]);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, pageNumber: number) => {
            e.preventDefault();
            e.stopPropagation();
            const type = e.dataTransfer.getData('field-type') as PackageField['type'];
            if (!type || !pageRefs.current[pageNumber - 1]?.current) return;

            const getFieldDefaults = (type: PackageField['type']) => {
                const scale = window.innerWidth < 768 ? 0.7 : 1;
                switch (type) {
                    case 'signature':
                        return { width: 150 * scale, height: 50 * scale, label: t('editor.fieldDefaults.signature') };
                    case 'textarea':
                        return { width: 200 * scale, height: 80 * scale, label: t('editor.fieldDefaults.textarea'), placeholder: t('editor.fieldDefaults.textareaPlaceholder') };
                    case 'checkbox':
                        return { width: 25 * scale, height: 25 * scale, label: t('editor.fieldDefaults.checkbox') };
                    case 'radio':
                        return { width: 25 * scale, height: 25 * scale, label: t('editor.fieldDefaults.radio') };
                    case 'date':
                        return { width: 120 * scale, height: 35 * scale, label: t('editor.fieldDefaults.date') };
                    case 'dropdown':
                        return { width: 150 * scale, height: 35 * scale, label: t('editor.fieldDefaults.dropdown') };
                    default:
                        return { width: 180 * scale, height: 35 * scale, label: t('editor.fieldDefaults.text'), placeholder: t('editor.fieldDefaults.textPlaceholder') };
                }
            };

            const defaults = getFieldDefaults(type);
            const pageRect = pageRefs.current[pageNumber - 1].current!.getBoundingClientRect();
            let x = e.clientX - pageRect.left,
                y = e.clientY - pageRect.top;
            const snap = 10;
            x = Math.max(0, Math.min(Math.round(x / snap) * snap, pageRect.width - defaults.width));
            y = Math.max(0, Math.min(Math.round(y / snap) * snap, pageRect.height - defaults.height));
            const newField: Omit<PackageField, 'id' | 'assignedUsers'> = {
                type,
                page: pageNumber,
                x,
                y,
                width: defaults.width,
                height: defaults.height,
                required: type === 'signature',
                label: defaults.label,
                placeholder: defaults.placeholder,
                ...(type === 'radio' && { groupId: `group-${nanoid(5)}`, options: [{ value: 'option1', label: 'Option 1' }] }),
                ...(type === 'dropdown' && {
                    options: [
                        { value: 'opt1', label: 'Option 1' },
                        { value: 'opt2', label: 'Option 2' },
                    ],
                }),
            };
            dispatch(addFieldToCurrentPackage(newField));
            toast.success(t('fieldAssignment.messages.fieldAdded', { fieldLabel: defaults.label }) as string);
        },
        [dispatch, t]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<PackageField>) => dispatch(updateFieldInCurrentPackage({ id: fieldId, ...updates })), [dispatch]);
    const handleFieldDelete = useCallback(
        (fieldId: string) => {
            Swal.fire({
                title: t('editor.deleteConfirm.title'),
                text: t('editor.deleteConfirm.text'),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: t('editor.deleteConfirm.confirmButton'),
                cancelButtonText: t('editor.deleteConfirm.cancelButton'),
                customClass: { popup: 'bg-white text-gray-800' },
            }).then((result) => {
                if (result.isConfirmed) {
                    dispatch(deleteFieldFromCurrentPackage(fieldId));
                    toast.success(t('editor.messages.deleteSuccess') as string);
                    setIsPropertiesPanelOpen(false);
                }
            });
        },
        [dispatch, t]
    );
    const handleFieldSelect = useCallback(
        (fieldId: string | null) => {
            if (isResizing || fieldId === selectedFieldId) return;
            dispatch(setSelectedPackageField(fieldId));
        },
        [dispatch, isResizing, selectedFieldId]
    );
    const closePropertiesPanel = () => {
        setIsPropertiesPanelOpen(false);
        wasManuallyClosedRef.current = true;
        setTimeout(() => dispatch(setSelectedPackageField(null)), 50);
    };
    const handleAssignUser = useCallback((fieldId: string, user: Omit<AssignedUser, 'id'>) => dispatch(assignUserToField({ fieldId, user })), [dispatch]);
    const handleRemoveUser = useCallback((fieldId: string, assignmentId: string) => dispatch(removeUserFromField({ fieldId, assignmentId })), [dispatch]);

    if (!currentPackage)
        return (
            <div className="flex flex-col justify-center items-center h-full text-center px-4 py-8">
                <div className="max-w-md">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-400">
                        <FiMousePointerTyped className="w-full h-full" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('fieldAssignment.noDocument.title')}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('fieldAssignment.noDocument.description')}</p>
                </div>
            </div>
        );
    if (pdfLoadError)
        return (
            <div className="flex flex-col justify-center items-center h-full text-center px-4 py-8">
                <div className="max-w-md">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-red-500">
                        <FiXTyped className="w-full h-full" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400 mb-2">{t('fieldAssignment.loadError.title')}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{pdfLoadError}</p>
                    <button onClick={onPrevious} className="btn btn-outline-primary text-sm sm:text-base px-6 py-2">
                        {t('fieldAssignment.loadError.button')}
                    </button>
                </div>
            </div>
        );

    return (
        <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 ">
                <div className="px-3 py-2 sm:p-3">
                    <EditorToolbar />
                </div>
                {currentPackage?.fields.length === 0 && (
                    <div className="px-3 pb-3">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 rounded-r-lg">
                            <div className="flex items-start gap-2">
                                <FiAlertCircleTyped className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('fieldAssignment.noFieldsWarning.title')}</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{t('fieldAssignment.noFieldsWarning.description')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-1 min-h-0 relative">
                <div className={`flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${isPropertiesPanelOpen ? 'mr-[25vw]' : ''}`}>
                    <div className="p-3 sm:p-4 lg:p-6">
                        <div className="flex justify-center">
                            <div className="space-y-4 sm:space-y-6 pb-8 w-full max-w-full">
                                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                                    const pageInfo = pageInfos[pageNumber - 1];
                                    return (
                                        <div key={`page-${pageNumber}`} className="relative mx-auto">
                                            <div className="absolute -top-8 left-0 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('fieldAssignment.pageIndicator', { page: pageNumber, total: numPages })}
                                            </div>
                                            <div
                                                ref={pageRefs.current[pageNumber - 1]}
                                                className="relative border-2 border-gray-300 dark:border-gray-600 shadow-xl rounded-sm bg-white dark:bg-gray-800 mx-auto overflow-hidden"
                                                style={{ width: pageInfo ? `${pageInfo.width}px` : 'auto', height: pageInfo ? `${pageInfo.height}px` : 'auto' }}
                                                onDrop={(e) => handleDrop(e, pageNumber)}
                                                onDragOver={handleDragOver}
                                                onClick={() => handleFieldSelect(null)}
                                            >
                                                <canvas ref={canvasRefs.current[pageNumber - 1]} className="block w-full h-auto" />
                                                {currentPackage?.fields
                                                    .filter((f) => f.page === pageNumber)
                                                    .map((f) => (
                                                        <PackageFieldRenderer
                                                            key={f.id}
                                                            field={f}
                                                            isSelected={selectedFieldId === f.id}
                                                            onUpdate={handleFieldUpdate}
                                                            onDelete={handleFieldDelete}
                                                            onSelect={() => handleFieldSelect(f.id)}
                                                            containerRef={pageRefs.current[pageNumber - 1]}
                                                            onResizeStart={() => setIsResizing(true)}
                                                            onResizeEnd={() => setIsResizing(false)}
                                                            onAssignUser={handleAssignUser}
                                                            onRemoveUser={handleRemoveUser}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className={`fixed right-0 top-0 h-full w-[25vw] flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
                        isPropertiesPanelOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FiSettingsTyped className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{t('fieldAssignment.properties.title')}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{t('fieldAssignment.properties.subtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={closePropertiesPanel}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label={t('fieldAssignment.properties.closeAriaLabel')}
                        >
                            <FiXTyped className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                        {selectedField ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                <PackageFieldPropertiesPanel field={selectedField} onUpdate={handleFieldUpdate} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600">
                                    <FiMousePointerTyped className="w-full h-full" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('fieldAssignment.properties.noFieldSelected.title')}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t('fieldAssignment.properties.noFieldSelected.description')}</p>
                            </div>
                        )}
                    </div>
                </div>
                {selectedField && !isPropertiesPanelOpen && (
                    <button
                        onClick={() => {
                            wasManuallyClosedRef.current = false;
                            setIsPropertiesPanelOpen(true);
                        }}
                        className="fixed top-1/2 -translate-y-1/2 right-4 sm:right-20 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95"
                        aria-label={t('fieldAssignment.properties.openAriaLabel')}
                    >
                        <FiSettingsTyped className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Step2_FieldAssignment;
