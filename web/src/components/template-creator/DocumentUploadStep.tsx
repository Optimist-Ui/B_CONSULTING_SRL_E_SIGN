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

const BACKEND_URL = import.meta.env.VITE_BASE_URL; // Use environment variable in production

const DocumentUploadStep: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, currentTemplate } = useSelector((state: IRootState) => state.templates);

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [previewPage, setPreviewPage] = useState<number>(1);
    const [renderError, setRenderError] = useState<string | null>(null);
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
            if (template.fileData && template.fileData.byteLength > 0) {
                const clonedFileData = template.fileData.slice(0);
                pdf = await loadPdfDocument(clonedFileData);
            } else if (template.fileUrl && !template.fileUrl.startsWith('blob:')) {
                const fullUrl = `${BACKEND_URL}${template.fileUrl}`;
                console.log('Fetching PDF preview from:', fullUrl); // Debugging
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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
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

    return (
        <div className="panel p-6">
            <h2 className="text-xl font-bold mb-5 dark:text-white">Upload Document & Set Title</h2>
            <form onSubmit={formik.handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="pdfFile" className="form-label text-sm dark:text-gray-300">
                        Upload PDF Document:
                    </label>
                    <div
                        className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer transition-colors duration-200 hover:border-blue-500 dark:border-gray-600 dark:text-gray-400"
                        onClick={() => document.getElementById('fileInput')?.click()}
                    >
                        <input id="fileInput" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                        <div className="flex flex-col centralize items-center">
                            <IconFile className="text-4xl mb-2 text-gray-500 dark:text-gray-400" />
                            <p className="font-semibold text-lg">Drag & drop your PDF here, or click to browse</p>
                            {pdfFile && <p className="text-sm mt-2 text-green-600 dark:text-green-400">Selected: {pdfFile.name}</p>}
                        </div>
                    </div>
                </div>

                {renderError && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-300">{renderError}</div>}

                {pdfPreviewUrl && !renderError && (
                    <div className="mb-6 flex flex-col items-center">
                        <label className="form-label mb-2 dark:text-gray-300">Document Preview (Page {previewPage}):</label>
                        <div className="border border-gray-300 shadow-md p-2 rounded-md bg-white dark:bg-gray-800">
                            <canvas ref={canvasRef} className="max-w-full h-auto bg-gray-50 dark:bg-gray-900 shadow"></canvas>
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="documentTitle" className="form-label dark:text-gray-300">
                        Document Title:
                    </label>
                    <input
                        type="text"
                        id="documentTitle"
                        name="documentTitle"
                        placeholder="e.g., Confidentiality Agreement"
                        className="form-input"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.documentTitle}
                    />
                    {formik.touched.documentTitle && formik.errors.documentTitle ? <div className="text-danger mt-1 text-sm">{formik.errors.documentTitle}</div> : null}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || (!pdfFile && !currentTemplate) || !formik.values.documentTitle || !!formik.errors.documentTitle || !!renderError}
                    >
                        {loading ? 'Processing...' : 'Proceed to Editor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DocumentUploadStep;
