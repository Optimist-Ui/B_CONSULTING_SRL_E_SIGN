import React, { useState, useEffect, useCallback, useRef, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../store';
import { addFieldToCurrentPackage, updateFieldInCurrentPackage, deleteFieldFromCurrentPackage, setSelectedPackageField, PackageField } from '../../store/slices/packageSlice';
import { toast } from 'react-toastify';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import EditorToolbar from '../template-creator/EditorToolbar';
import PackageFieldPropertiesPanel from './PackageFieldPropertiesPanel';
import PackageFieldRenderer from './PackageFieldRenderer';
import Swal from 'sweetalert2';
import { FiMousePointer } from 'react-icons/fi';
import { nanoid } from '@reduxjs/toolkit';

const FiMousePointerTyped = FiMousePointer as ComponentType<{ className?: string }>;

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
    const pageRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
    const canvasRefs = useRef<Array<React.RefObject<HTMLCanvasElement>>>([]);
    const isLoadingPdf = useRef(false);
    const renderTasks = useRef<Array<{ page: number; task: any }>>([]);

    const selectedField = currentPackage?.fields.find((field) => field.id === selectedFieldId);

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
                } else if (currentPackage.fileUrl && !currentPackage.fileUrl.startsWith('blob:')) {
                    const correctedFileUrl = currentPackage.fileUrl.startsWith('/public') ? currentPackage.fileUrl : `/public${currentPackage.fileUrl}`;
                    const fullUrl = `${BACKEND_URL}${correctedFileUrl}`;
                    const response = await fetch(fullUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                    const arrayBuffer = await response.arrayBuffer();
                    pdf = await loadPdfDocument(arrayBuffer);
                } else if (currentPackage.fileUrl?.startsWith('blob:')) {
                    const response = await fetch(currentPackage.fileUrl);
                    if (!response.ok) throw new Error(`Failed to fetch blob PDF: ${response.statusText}`);
                    const arrayBuffer = await response.arrayBuffer();
                    pdf = await loadPdfDocument(arrayBuffer);
                } else {
                    throw new Error('No valid PDF data or URL provided.');
                }

                setPdfInstance(pdf);
                setNumPages(pdf.numPages);

                const fetchedPageInfos: PageInfo[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const scale = 1.5;
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
                        const context = canvas.getContext('2d');
                        if (context) {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                        }
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
                switch (type) {
                    case 'signature':
                        return { width: 150, height: 50, label: 'Signature' };
                    case 'textarea':
                        return { width: 200, height: 80, label: 'Text Area', placeholder: 'Enter text...' };
                    case 'checkbox':
                        return { width: 25, height: 25, label: 'Checkbox' };
                    case 'radio':
                        return { width: 25, height: 25, label: 'Radio' };
                    case 'date':
                        return { width: 120, height: 35, label: 'Date Field' };
                    case 'dropdown':
                        return { width: 150, height: 35, label: 'Dropdown' };
                    case 'text':
                    default:
                        return { width: 180, height: 35, label: 'Text Field', placeholder: 'Enter text here' };
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
                required: false,
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
                }
            });
        },
        [dispatch]
    );

    const handleFieldSelect = useCallback(
        (fieldId: string | null) => {
            dispatch(setSelectedPackageField(fieldId));
        },
        [dispatch]
    );

    if (!currentPackage) {
        return <div className="flex justify-center items-center h-full text-lg text-gray-600">Please select a document first in the previous step to start assigning fields.</div>;
    }

    if (pdfLoadError) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-lg text-red-500">
                <p className="mb-4">{pdfLoadError}</p>
                <button onClick={onPrevious} className="btn btn-outline-primary">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-grow overflow-hidden gap-4 h-full bg-gray-50">
            <div className="flex-shrink-0 bg-white/80 rounded-lg shadow-md p-2">
                <EditorToolbar />
            </div>
            <div className="flex flex-grow overflow-hidden gap-4">
                <div className="flex-grow flex flex-col items-center bg-white rounded-lg shadow-md p-4 overflow-auto">
                    <div className="pdf-viewer-pages space-y-8">
                        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                            const pageInfo = pageInfos[pageNumber - 1];
                            return (
                                <div
                                    key={`page-${pageNumber}`}
                                    ref={pageRefs.current[pageNumber - 1]}
                                    className="relative border border-gray-300 shadow-sm bg-white flex-shrink-0"
                                    style={{
                                        width: pageInfo ? `${pageInfo.width}px` : 'auto',
                                        height: pageInfo ? `${pageInfo.height}px` : 'auto',
                                    }}
                                    onDrop={(e) => handleDrop(e, pageNumber)}
                                    onDragOver={handleDragOver}
                                    onClick={() => handleFieldSelect(null)}
                                >
                                    <canvas ref={canvasRefs.current[pageNumber - 1]} className="block max-w-full h-auto" />
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
                                            />
                                        ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4 border-b pb-2 border-gray-200 text-gray-900">Field Properties & Roles</h3>
                    {selectedField ? (
                        <PackageFieldPropertiesPanel field={selectedField} onUpdate={handleFieldUpdate} />
                    ) : (
                        <div className="text-center pt-10 text-gray-500">
                            <FiMousePointerTyped className="mx-auto text-4xl mb-4 text-gray-400" />
                            <p>Select a field to edit its properties or assign roles.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step2_FieldAssignment;
