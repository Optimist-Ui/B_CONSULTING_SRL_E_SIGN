import React, { useState, useEffect, useCallback, useRef, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { FiMousePointer } from 'react-icons/fi';

// Redux Imports
import { AppDispatch, IRootState } from '../../store';
import { addFieldToCurrentTemplate, updateFieldInCurrentTemplate, deleteFieldFromCurrentTemplate, setSelectedField, DocumentField } from '../../store/slices/templateSlice';

// PDF Utility Imports
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Child Component Imports
import EditorToolbar from './EditorToolbar';
import FieldPropertiesPanel from './FieldPropertiesPanel';
import FieldRenderer from './FieldRenderer';

const FiMousePointerTyped = FiMousePointer as ComponentType<{ className?: string }>;

interface PageInfo {
    width: number;
    height: number;
    scale: number;
}

const DocumentEditorStep: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { currentTemplate, selectedFieldId } = useSelector((state: IRootState) => state.templates);

    const [numPages, setNumPages] = useState<number>(0);
    const [pdfInstance, setPdfInstance] = useState<PDFDocumentProxy | null>(null);
    const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
    const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
    const pageRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
    const canvasRefs = useRef<Array<React.RefObject<HTMLCanvasElement>>>([]);
    const isLoadingPdf = useRef(false);
    const renderTasks = useRef<Array<{ page: number; task: any }>>([]);

    const selectedField = currentTemplate?.fields.find((field) => field.id === selectedFieldId);

    useEffect(() => {
        if (numPages > 0) {
            pageRefs.current = Array.from({ length: numPages }, () => React.createRef<HTMLDivElement>());
            canvasRefs.current = Array.from({ length: numPages }, () => React.createRef<HTMLCanvasElement>());
        }
    }, [numPages]);

    useEffect(() => {
        const loadPdf = async () => {
            if (!currentTemplate || isLoadingPdf.current) {
                setPdfInstance(null);
                setNumPages(0);
                setPageInfos([]);
                return;
            }
            setPdfLoadError(null);
            isLoadingPdf.current = true;

            try {
                let pdf: PDFDocumentProxy;
                if (currentTemplate.fileData && currentTemplate.fileData.byteLength > 0) {
                    pdf = await loadPdfDocument(currentTemplate.fileData.slice(0));
                } else if (currentTemplate.downloadUrl) {
                    const response = await fetch(currentTemplate.downloadUrl);
                    if (!response.ok) throw new Error(`${t('editor.errors.fetchFailed')}: ${response.statusText}`);
                    pdf = await loadPdfDocument(await response.arrayBuffer());
                } else if (currentTemplate.fileUrl && !currentTemplate.fileUrl.startsWith('blob:')) {
                    const response = await fetch(currentTemplate.fileUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`${t('editor.errors.fetchFailed')}: ${response.statusText}`);
                    pdf = await loadPdfDocument(await response.arrayBuffer());
                } else {
                    throw new Error(t('editor.errors.noValidPdf'));
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
                const errorMessage = `${t('editor.errors.loadFailed')}: ${err.message}`;
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
            if (currentTemplate?.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(currentTemplate.fileUrl);
        };
    }, [currentTemplate, t]);

    useEffect(() => {
        const renderPages = async () => {
            if (!pdfInstance || pageInfos.length === 0 || canvasRefs.current.length === 0 || canvasRefs.current.some((ref) => !ref.current)) return;
            renderTasks.current.forEach(({ task }) => task?.cancel?.());
            renderTasks.current = [];
            try {
                for (let i = 1; i <= numPages; i++) {
                    const canvas = canvasRefs.current[i - 1]?.current;
                    if (canvas) {
                        const context = canvas.getContext('2d');
                        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
                        const task = await renderPdfPageToCanvas(pdfInstance, i, canvas, pageInfos[i - 1].scale);
                        renderTasks.current.push({ page: i, task });
                    }
                }
            } catch (err: any) {
                if (err.name === 'RenderingCancelledException') return;
                toast.error(t('editor.errors.renderFailed') as string);
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
            const type = e.dataTransfer.getData('field-type') as DocumentField['type'];
            if (!type || !pageRefs.current[pageNumber - 1]?.current) return;

            const getFieldDefaults = (type: DocumentField['type']) => {
                switch (type) {
                    case 'signature':
                        return { width: 150, height: 50, label: t('editor.fieldDefaults.signature') };
                    case 'textarea':
                        return { width: 200, height: 80, label: t('editor.fieldDefaults.textarea'), placeholder: t('editor.fieldDefaults.textareaPlaceholder') };
                    case 'checkbox':
                        return { width: 25, height: 25, label: t('editor.fieldDefaults.checkbox') };
                    case 'radio':
                        return { width: 25, height: 25, label: t('editor.fieldDefaults.radio') };
                    case 'date':
                        return { width: 120, height: 35, label: t('editor.fieldDefaults.date') };
                    case 'dropdown':
                        return { width: 150, height: 35, label: t('editor.fieldDefaults.dropdown') };
                    default:
                        return { width: 180, height: 35, label: t('editor.fieldDefaults.text'), placeholder: t('editor.fieldDefaults.textPlaceholder') };
                }
            };

            const defaults = getFieldDefaults(type);
            const pageRect = pageRefs.current[pageNumber - 1].current!.getBoundingClientRect();
            let x = e.clientX - pageRect.left;
            let y = e.clientY - pageRect.top;
            const snap = 10;
            x = Math.max(0, Math.min(Math.round(x / snap) * snap, pageRect.width - defaults.width));
            y = Math.max(0, Math.min(Math.round(y / snap) * snap, pageRect.height - defaults.height));

            const newField: Omit<DocumentField, 'id'> = {
                type,
                page: pageNumber,
                x,
                y,
                width: defaults.width,
                height: defaults.height,
                required: false,
                label: defaults.label,
                placeholder: defaults.placeholder,
                ...(type === 'radio' && { groupId: `group-${Date.now()}`, options: [{ value: 'option1', label: 'Option 1' }] }),
                ...(type === 'dropdown' && {
                    options: [
                        { value: 'opt1', label: 'Option 1' },
                        { value: 'opt2', label: 'Option 2' },
                    ],
                }),
            };
            dispatch(addFieldToCurrentTemplate(newField));
        },
        [dispatch, t]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<DocumentField>) => dispatch(updateFieldInCurrentTemplate({ id: fieldId, ...updates })), [dispatch]);
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
                    dispatch(deleteFieldFromCurrentTemplate(fieldId));
                    toast.success(t('editor.messages.deleteSuccess') as string);
                }
            });
        },
        [dispatch, t]
    );
    const handleFieldSelect = useCallback((fieldId: string | null) => dispatch(setSelectedField(fieldId)), [dispatch]);

    if (!currentTemplate) return <div className="flex justify-center items-center h-full text-lg text-gray-600">{t('editor.loading')}</div>;
    if (pdfLoadError)
        return (
            <div className="flex flex-col justify-center items-center h-full text-lg text-red-500">
                <p className="mb-4">{pdfLoadError}</p>
            </div>
        );

    return (
        <div className="flex flex-col flex-grow overflow-hidden gap-4 h-full dark:bg-gray-900 bg-gray-50">
            <div className="flex-shrink-0 dark:bg-gray-900 bg-white/80 rounded-lg shadow-md p-2">
                <EditorToolbar />
            </div>
            <div className="flex flex-grow overflow-hidden gap-4 dark:bg-gray-900">
                <div className="flex-grow flex flex-col items-center dark:bg-gray-900 bg-white rounded-lg shadow-md p-4 overflow-auto">
                    <div className="pdf-viewer-pages space-y-8">
                        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                            const pageInfo = pageInfos[pageNumber - 1];
                            return (
                                <div
                                    key={`page-${pageNumber}`}
                                    ref={pageRefs.current[pageNumber - 1]}
                                    className="relative border dark:bg-gray-900 border-gray-300 shadow-sm bg-white flex-shrink-0"
                                    style={{ width: pageInfo ? `${pageInfo.width}px` : 'auto', height: pageInfo ? `${pageInfo.height}px` : 'auto' }}
                                    onDrop={(e) => handleDrop(e, pageNumber)}
                                    onDragOver={handleDragOver}
                                    onClick={() => handleFieldSelect(null)}
                                >
                                    <canvas ref={canvasRefs.current[pageNumber - 1]} className="block max-w-full h-auto" />
                                    {currentTemplate?.fields
                                        .filter((field) => field.page === pageNumber)
                                        .map((field) => (
                                            <FieldRenderer
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
                <div className="w-72 flex-shrink-0 dark:bg-gray-900 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:bg-gray-900 border-gray-200">{t('editor.properties.title')}</h3>
                    {selectedField ? (
                        <FieldPropertiesPanel field={selectedField} onUpdate={handleFieldUpdate} />
                    ) : (
                        <div className="text-center pt-10 text-gray-500">
                            <FiMousePointerTyped className="mx-auto text-4xl mb-4 text-gray-400" />
                            <p>{t('editor.properties.prompt')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentEditorStep;
