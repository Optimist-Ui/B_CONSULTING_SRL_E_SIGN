import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AppDispatch, IRootState } from '../../store';
import { setTemplateTitle } from '../../store/slices/templateSlice';
import { uploadDocument } from '../../store/thunk/templateThunks';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import IconFile from '../Icon/IconFile';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

const DocumentUploadStep: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, currentTemplate } = useSelector((state: IRootState) => state.templates);

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [previewPage, setPreviewPage] = useState<number>(1);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const pdfDocumentRef = React.useRef<PDFDocumentProxy | null>(null);

    const validationSchema = Yup.object({
        documentTitle: Yup.string().required('Document title is required').min(3, 'Title must be at least 3 characters'),
    });

    const formik = useFormik({
        initialValues: {
            documentTitle: currentTemplate?.name || '',
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            if (pdfFile) {
                try {
                    await dispatch(uploadDocument(pdfFile)).unwrap();
                    dispatch(setTemplateTitle(values.documentTitle));
                    if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(pdfPreviewUrl);
                    }
                } catch (error: any) {
                    toast.error(error || 'Failed to upload document.');
                }
            } else if (currentTemplate && currentTemplate.fileUrl) {
                dispatch(setTemplateTitle(values.documentTitle));
                if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(pdfPreviewUrl);
                }
            } else {
                toast.error('Please upload a PDF document.');
            }
        },
    });

    const renderPdfPreview = async (template: typeof currentTemplate) => {
        if (!canvasRef.current || !template) return;

        setRenderError(null);

        try {
            let pdf: PDFDocumentProxy;

            // Priority 1: Use in-memory fileData (for newly uploaded files)
            if (template.fileData && template.fileData.byteLength > 0) {
                const clonedFileData = template.fileData.slice(0);
                pdf = await loadPdfDocument(clonedFileData);
            }
            // Priority 2: Use downloadUrl (signed URL from S3)
            else if (template.downloadUrl) {
                console.log('Fetching PDF preview from signed URL');
                const response = await fetch(template.downloadUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                pdf = await loadPdfDocument(arrayBuffer);
            }
            // Priority 3: Fallback to fileUrl (for backward compatibility with local files)
            else if (template.fileUrl && !template.fileUrl.startsWith('blob:')) {
                const fullUrl = `${BACKEND_URL}${template.fileUrl}`;
                console.log('Fetching PDF preview from fileUrl:', fullUrl);
                const response = await fetch(fullUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                pdf = await loadPdfDocument(arrayBuffer);
            } else {
                throw new Error('No valid PDF data or non-blob URL provided.');
            }

            pdfDocumentRef.current = pdf;
            await renderPdfPageToCanvas(pdf, previewPage, canvasRef.current, 0.8);
        } catch (error: any) {
            console.error('Error rendering PDF preview:', error);
            setRenderError(`Failed to render PDF preview: ${error.message}`);
            setPdfPreviewUrl(null);
        }
    };

    useEffect(() => {
        if (currentTemplate && currentTemplate.name) {
            formik.setFieldValue('documentTitle', currentTemplate.name);
            setPdfPreviewUrl(currentTemplate.fileUrl);
            if (currentTemplate.fileData || (currentTemplate.fileUrl && !currentTemplate.fileUrl.startsWith('blob:'))) {
                const timer = setTimeout(() => renderPdfPreview(currentTemplate), 100);
                return () => clearTimeout(timer);
            }
        }
    }, [currentTemplate]);

    const handleFile = async (file: File) => {
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
            setRenderError(null);

            const url = URL.createObjectURL(file);
            setPdfPreviewUrl(url);
            const arrayBuffer = await file.arrayBuffer();
            await renderPdfPreview({ fileData: arrayBuffer, fileUrl: url, name: file.name, attachment_uuid: '', fields: [] });
        } else {
            setPdfFile(null);
            setPdfPreviewUrl(null);
            setRenderError(null);
            toast.error('Please select a valid PDF file.');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Upload Document & Set Title</h2>

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upload Section */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload PDF Document</label>

                            <div
                                className={`
                                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                                    transition-all duration-200 hover:border-blue-400
                                    ${
                                        isDragging
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : pdfFile
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                `}
                                onClick={() => document.getElementById('fileInput')?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                            >
                                <input id="fileInput" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />

                                <IconFile
                                    className={`
                                    mx-auto mb-4 text-5xl
                                    ${pdfFile ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}
                                `}
                                />

                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{pdfFile ? 'PDF Uploaded' : 'Drop PDF here or click to browse'}</h3>

                                {pdfFile ? (
                                    <p className="text-sm text-green-600 dark:text-green-400">{pdfFile.name}</p>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Supports PDF files up to 50MB</p>
                                )}

                                {loading && (
                                    <div className="mt-4 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-blue-600">Processing...</span>
                                    </div>
                                )}
                            </div>

                            {/* Title Input */}
                            <div>
                                <label htmlFor="documentTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Document Title
                                </label>
                                <input
                                    type="text"
                                    id="documentTitle"
                                    name="documentTitle"
                                    placeholder="e.g., Confidentiality Agreement"
                                    className={`
                                        w-full px-3 py-2 border rounded-md shadow-sm
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                        dark:bg-gray-700 dark:border-gray-600 dark:text-white
                                        ${formik.touched.documentTitle && formik.errors.documentTitle ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
                                    `}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.documentTitle}
                                />
                                {formik.touched.documentTitle && formik.errors.documentTitle && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.documentTitle}</p>}
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Preview</label>

                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[400px] flex items-center justify-center">
                                {renderError ? (
                                    <div className="text-center">
                                        <div className="text-red-500 text-4xl mb-2">⚠</div>
                                        <p className="text-red-600 dark:text-red-400 text-sm">{renderError}</p>
                                    </div>
                                ) : pdfPreviewUrl ? (
                                    <div className="w-full">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">Page {previewPage}</div>
                                        <canvas ref={canvasRef} className="max-w-full h-auto mx-auto bg-white shadow-sm rounded" />
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-gray-400 text-4xl mb-2">📄</div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Preview will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading || (!pdfFile && !currentTemplate) || !formik.values.documentTitle || !!formik.errors.documentTitle || !!renderError}
                            className={`
                                px-6 py-2 rounded-md font-medium transition-colors
                                ${
                                    loading || (!pdfFile && !currentTemplate) || !formik.values.documentTitle || !!formik.errors.documentTitle || !!renderError
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                }
                            `}
                        >
                            {loading ? 'Processing...' : 'Proceed to Editor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentUploadStep;
