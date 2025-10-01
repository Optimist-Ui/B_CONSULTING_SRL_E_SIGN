import React, { useState, useEffect, useCallback, useRef, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { toast } from 'react-toastify';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import EditorToolbar from '../template-creator/EditorToolbar';
import PackageFieldPropertiesPanel from './PackageFieldPropertiesPanel';
import PackageFieldRenderer from './PackageFieldRenderer';
import Swal from 'sweetalert2';
import { FiMousePointer, FiX, FiSettings } from 'react-icons/fi';
import { nanoid } from '@reduxjs/toolkit';

const FiMousePointerTyped = FiMousePointer as ComponentType<{ className?: string }>;
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiSettingsTyped = FiSettings as ComponentType<{ className?: string }>;

interface PageInfo {
    width: number;
    height: number;
    scale: number;
}

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

interface StepProps {
    onNext: () => void;
    onPrevious: () => void;
    onConfirm: () => void;
}

const Step2_FieldAssignment: React.FC<StepProps> = ({ onNext, onPrevious }) => {
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
    const prevSelectedFieldIdRef = useRef<string | null>(null);

    // Auto-open panel only when a NEW field is selected on DESKTOP (not mobile)
    useEffect(() => {
        const isNewFieldSelection = selectedFieldId && selectedFieldId !== prevSelectedFieldIdRef.current;

        // Only auto-open on desktop (lg breakpoint and above)
        if (isNewFieldSelection && window.innerWidth >= 1024 && !isResizing) {
            const timer = setTimeout(() => {
                setIsPropertiesPanelOpen(true);
            }, 100);
            prevSelectedFieldIdRef.current = selectedFieldId;
            return () => clearTimeout(timer);
        }

        // Update ref even if not opening panel
        if (selectedFieldId !== prevSelectedFieldIdRef.current) {
            prevSelectedFieldIdRef.current = selectedFieldId;
        }
    }, [selectedFieldId, isResizing]);

    useEffect(() => {
        if (numPages > 0) {
            pageRefs.current = Array.from({ length: numPages }, () => React.createRef<HTMLDivElement>());
            canvasRefs.current = Array.from({ length: numPages }, () => React.createRef<HTMLCanvasElement>());
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
                if (currentPackage.fileData && currentPackage.fileData.byteLength > 0) {
                    pdf = await loadPdfDocument(currentPackage.fileData.slice(0));
                } else if (currentPackage.downloadUrl) {
                    const response = await fetch(currentPackage.downloadUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                    const arrayBuffer = await response.arrayBuffer();
                    pdf = await loadPdfDocument(arrayBuffer);
                } else if (currentPackage.fileUrl && !currentPackage.fileUrl.startsWith('blob:')) {
                    const correctedFileUrl = currentPackage.fileUrl.startsWith('/public') ? currentPackage.fileUrl : `/public${currentPackage.fileUrl}`;
                    const fullUrl = `${BACKEND_URL}${correctedFileUrl}`;
                    const response = await fetch(fullUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                    const arrayBuffer = await response.arrayBuffer();
                    pdf = await loadPdfDocument(arrayBuffer);
                } else if (currentPackage.fileUrl?.startsWith('blob:')) {
                    const response = await fetch(currentPackage.fileUrl);
                    if (!response.ok) throw new Error(`Fetch failed for blob: ${response.statusText}`);
                    const arrayBuffer = await response.arrayBuffer();
                    pdf = await loadPdfDocument(arrayBuffer);
                } else {
                    throw new Error('No valid PDF data or URL provided.');
                }

                setPdfInstance(pdf);
                setNumPages(pdf.numPages);

                const scale = 1.5; // Fixed scale for consistent PDF size

                const fetchedPageInfos: PageInfo[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });
                    fetchedPageInfos.push({ width: viewport.width, height: viewport.height, scale });
                }
                setPageInfos(fetchedPageInfos);
            } catch (err: any) {
                console.error('Error loading PDF:', err);
                setPdfLoadError(`Failed to load PDF: ${err.message}`);
                toast.error(`Failed to load PDF: ${err.message}`);
            } finally {
                isLoadingPdf.current = false;
            }
        };

        loadPdf();

        return () => {
            renderTasks.current.forEach(({ task }) => task?.cancel?.());
            renderTasks.current = [];
            if (currentPackage?.fileUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(currentPackage.fileUrl);
            }
        };
    }, [currentPackage]);

    useEffect(() => {
        const renderPages = async () => {
            if (!pdfInstance || pageInfos.length === 0 || canvasRefs.current.length === 0) return;
            if (canvasRefs.current.some((ref) => !ref.current)) return;

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
                console.error('Error rendering PDF pages:', err);
                toast.error('Failed to render PDF pages.');
            }
        };

        const timer = setTimeout(renderPages, 100);
        return () => {
            clearTimeout(timer);
            renderTasks.current.forEach(({ task }) => task?.cancel?.());
            renderTasks.current = [];
        };
    }, [pdfInstance, pageInfos, numPages]);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, pageNumber: number) => {
            e.preventDefault();
            e.stopPropagation();

            const type = e.dataTransfer.getData('field-type') as PackageField['type'];
            if (!type || !pageRefs.current[pageNumber - 1]?.current) return;

            const getFieldDefaults = (type: PackageField['type']) => {
                const isMobile = window.innerWidth < 768;
                const scale = isMobile ? 0.7 : 1;

                switch (type) {
                    case 'signature':
                        return { width: 150 * scale, height: 50 * scale, label: 'Signature' };
                    case 'textarea':
                        return { width: 200 * scale, height: 80 * scale, label: 'Text Area', placeholder: 'Enter text...' };
                    case 'checkbox':
                        return { width: 25 * scale, height: 25 * scale, label: 'Checkbox' };
                    case 'radio':
                        return { width: 25 * scale, height: 25 * scale, label: 'Radio' };
                    case 'date':
                        return { width: 120 * scale, height: 35 * scale, label: 'Date Field' };
                    case 'dropdown':
                        return { width: 150 * scale, height: 35 * scale, label: 'Dropdown' };
                    case 'text':
                    default:
                        return { width: 180 * scale, height: 35 * scale, label: 'Text Field', placeholder: 'Enter text here' };
                }
            };

            const defaults = getFieldDefaults(type);
            const pageRect = pageRefs.current[pageNumber - 1].current!.getBoundingClientRect();
            let x = e.clientX - pageRect.left;
            let y = e.clientY - pageRect.top;

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
            toast.success(`Added ${defaults.label} field.`);
        },
        [dispatch]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleFieldUpdate = useCallback(
        (fieldId: string, updates: Partial<PackageField>) => {
            dispatch(updateFieldInCurrentPackage({ id: fieldId, ...updates }));
        },
        [dispatch]
    );

    const handleFieldDelete = useCallback(
        (fieldId: string) => {
            Swal.fire({
                title: 'Delete field?',
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                customClass: { popup: 'bg-white text-gray-800' },
            }).then((result) => {
                if (result.isConfirmed) {
                    dispatch(deleteFieldFromCurrentPackage(fieldId));
                    toast.success('Field deleted.');
                    if (window.innerWidth < 1024) {
                        setIsPropertiesPanelOpen(false);
                    }
                }
            });
        },
        [dispatch]
    );

    const handleFieldSelect = useCallback(
        (fieldId: string | null) => {
            // Don't change selection during resize
            if (isResizing) return;

            // If clicking the same field that's already selected, don't do anything
            if (fieldId === selectedFieldId) return;

            dispatch(setSelectedPackageField(fieldId));
        },
        [dispatch, isResizing, selectedFieldId]
    );

    const closePropertiesPanel = () => {
        setIsPropertiesPanelOpen(false);
        wasManuallyClosedRef.current = true; // Mark as manually closed
        // Delay clearing selection to allow resize to complete
        setTimeout(() => {
            dispatch(setSelectedPackageField(null));
        }, 50);
    };

    const handleAssignUser = useCallback(
        (fieldId: string, user: Omit<AssignedUser, 'id'>) => {
            dispatch(assignUserToField({ fieldId, user }));
        },
        [dispatch]
    );

    const handleRemoveUser = useCallback(
        (fieldId: string, assignmentId: string) => {
            dispatch(removeUserFromField({ fieldId, assignmentId }));
        },
        [dispatch]
    );

    if (!currentPackage) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-center px-4 py-8">
                <div className="max-w-md">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-400">
                        <FiMousePointerTyped className="w-full h-full" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Document Selected</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Please select a document in the previous step to start assigning fields.</p>
                </div>
            </div>
        );
    }

    if (pdfLoadError) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-center px-4 py-8">
                <div className="max-w-md">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-red-500">
                        <FiXTyped className="w-full h-full" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Failed to Load PDF</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{pdfLoadError}</p>
                    <button onClick={onPrevious} className="btn btn-outline-primary text-sm sm:text-base px-6 py-2">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Sticky Toolbar */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-30">
                <div className="px-3 py-2 sm:p-3">
                    <EditorToolbar />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0 relative">
                {/* PDF Viewer */}
                <div className={`flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${isPropertiesPanelOpen ? 'hidden lg:block' : 'block'}`}>
                    <div className="p-3 sm:p-4 lg:p-6">
                        <div className="flex justify-center">
                            <div className="space-y-4 sm:space-y-6 pb-8 w-full max-w-full">
                                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                                    const pageInfo = pageInfos[pageNumber - 1];
                                    return (
                                        <div key={`page-${pageNumber}`} className="relative mx-auto">
                                            {/* Page number indicator */}
                                            <div className="absolute -top-8 left-0 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Page {pageNumber} of {numPages}
                                            </div>

                                            <div
                                                ref={pageRefs.current[pageNumber - 1]}
                                                className="relative border-2 border-gray-300 dark:border-gray-600 shadow-xl rounded-sm bg-white dark:bg-gray-800 mx-auto overflow-hidden"
                                                style={{
                                                    width: pageInfo ? `${pageInfo.width}px` : 'auto',
                                                    height: pageInfo ? `${pageInfo.height}px` : 'auto',
                                                }}
                                                onDrop={(e) => handleDrop(e, pageNumber)}
                                                onDragOver={handleDragOver}
                                                onClick={() => handleFieldSelect(null)}
                                            >
                                                <canvas ref={canvasRefs.current[pageNumber - 1]} className="block w-full h-auto" />
                                                {currentPackage?.fields
                                                    .filter((field) => field.page === pageNumber)
                                                    .map((field) => (
                                                        <PackageFieldRenderer
                                                            key={field.id}
                                                            field={field}
                                                            isSelected={selectedFieldId === field.id}
                                                            onUpdate={handleFieldUpdate}
                                                            onDelete={handleFieldDelete}
                                                            onSelect={() => handleFieldSelect(field.id)}
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

                {/* Properties Panel */}
                <div
                    className={`
                        fixed lg:relative inset-0 lg:inset-auto
                        w-full lg:w-80 xl:w-96
                        flex-shrink-0 flex flex-col
                        bg-white dark:bg-gray-800
                        border-l border-gray-200 dark:border-gray-700
                        shadow-2xl lg:shadow-none
                        z-40 lg:z-0
                        transform transition-transform duration-300 ease-in-out
                        ${isPropertiesPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    `}
                >
                    {/* Panel Header */}
                    <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FiSettingsTyped className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">Field Properties</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Configure field settings</p>
                            </div>
                        </div>
                        <button onClick={closePropertiesPanel} className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close properties panel">
                            <FiXTyped className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Panel Content */}
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
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Field Selected</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Tap on a field in the document to edit its properties and assign users.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Action Button - Mobile Only */}
                {selectedField && !isPropertiesPanelOpen && (
                    <button
                        onClick={() => {
                            wasManuallyClosedRef.current = false; // Reset flag when opening via button
                            setIsPropertiesPanelOpen(true);
                        }}
                        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95"
                        aria-label="Open field properties"
                    >
                        <FiSettingsTyped className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Step2_FieldAssignment;
