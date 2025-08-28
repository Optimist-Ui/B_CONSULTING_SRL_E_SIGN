import React, { useState, useEffect, useCallback, useRef, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AppDispatch, IRootState } from '../../store';
import { DocumentTemplate } from '../../store/slices/templateSlice';
import { fetchTemplates, getTemplateById } from '../../store/thunk/templateThunks'; // Updated import
import { uploadPackageDocument } from '../../store/thunk/packageThunks'; // Keep this import
import { startPackageCreation, setPackageTitle, setPackageLoading, setPackageError } from '../../store/slices/packageSlice';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { toast } from 'react-toastify';
import { FiUploadCloud, FiFile, FiEdit3 } from 'react-icons/fi';

const FiUploadCloudTyped = FiUploadCloud as ComponentType<{ className?: string }>;
const FiFileTyped = FiFile as ComponentType<{ className?: string }>;
const FiEdit3Typed = FiEdit3 as ComponentType<{ className?: string }>;

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

interface StepProps {
    onNext: () => void;
    onPrevious: () => void;
    onConfirm: () => void;
}

const Step1_DocumentSelection: React.FC<StepProps> = ({ onNext }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { templates, loading: templatesLoading, error: templatesError } = useSelector((state: IRootState) => state.templates);
    const { currentPackage, loading: packageLoading, error: packageError } = useSelector((state: IRootState) => state.packages);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (templates.length === 0) {
            dispatch(fetchTemplates());
        }
    }, [dispatch, templates.length]);

    useEffect(() => {
        const anyError = templatesError || packageError;
        if (anyError) {
            toast.error(anyError);
            dispatch(setPackageError(null));
        }
    }, [templatesError, packageError, dispatch]);

    const renderPdfPreview = useCallback(async (documentSource: { fileData?: ArrayBuffer; fileUrl?: string }) => {
        if (!canvasRef.current) return;
        setRenderError(null);

        try {
            let pdf: PDFDocumentProxy;
            if (documentSource.fileData && documentSource.fileData.byteLength > 0) {
                pdf = await loadPdfDocument(documentSource.fileData.slice(0));
            } else if (documentSource.fileUrl && !documentSource.fileUrl.startsWith('blob:')) {
                const correctedFileUrl = documentSource.fileUrl.startsWith('/public') ? documentSource.fileUrl : `/public${documentSource.fileUrl}`;
                const fullUrl = `${BACKEND_URL}${correctedFileUrl}`;
                const response = await fetch(fullUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                pdf = await loadPdfDocument(arrayBuffer);
            } else if (documentSource.fileUrl?.startsWith('blob:')) {
                const response = await fetch(documentSource.fileUrl);
                if (!response.ok) throw new Error(`Fetch failed for blob: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                pdf = await loadPdfDocument(arrayBuffer);
            } else {
                return;
            }
            await renderPdfPageToCanvas(pdf, 1, canvasRef.current, 0.8);
        } catch (error: any) {
            console.error('Error rendering PDF preview:', error);
            setRenderError(`Failed to render PDF preview: ${error.message}`);
            toast.error(`Failed to render PDF preview: ${error.message}`);
        }
    }, []);

    const formik = useFormik({
        initialValues: {
            documentTitle: currentPackage?.name || '',
        },
        validationSchema: Yup.object({
            documentTitle: Yup.string().required('Package title is required').min(3, 'Title must be at least 3 characters'),
        }),
        onSubmit: async (values) => {
            if (!currentPackage || (!currentPackage.fileUrl && !currentPackage.fileData)) {
                toast.error('Please select a document before proceeding.');
                return;
            }
            if (currentPackage.name !== values.documentTitle) {
                dispatch(setPackageTitle(values.documentTitle));
            }
            onNext();
        },
        enableReinitialize: true,
    });

    // This effect synchronizes the Formik state with the Redux store in real-time.
    const { documentTitle } = formik.values;
    useEffect(() => {
        // If there's a current package and its name in Redux differs from the form's name...
        if (currentPackage && documentTitle !== currentPackage.name) {
            // ...update the Redux store to match the form.
            dispatch(setPackageTitle(documentTitle));
        }
    }, [documentTitle, currentPackage, dispatch]); // Dependency array ensures this runs whenever the title changes.

    useEffect(() => {
        if (currentPackage) {
            setSelectedTemplateId(currentPackage.templateId || null);
            if (currentPackage.fileData || currentPackage.fileUrl) {
                renderPdfPreview(currentPackage);
            }
        } else {
            formik.resetForm();
            setSelectedTemplateId(null);
            if (canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [currentPackage, renderPdfPreview]);

    const handleFileChange = async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            toast.error('Please select a valid PDF file.');
            return;
        }

        dispatch(setPackageLoading(true));
        try {
            const resultAction = await dispatch(uploadPackageDocument(file)).unwrap();
            const fileData = await file.arrayBuffer();

            dispatch(
                startPackageCreation({
                    name: file.name.replace(/\.pdf$/, ''),
                    attachment_uuid: resultAction.attachment_uuid,
                    fileUrl: resultAction.fileUrl,
                    fileData: fileData,
                    fields: [],
                    templateId: undefined,
                })
            );
            formik.setFieldValue('documentTitle', file.name.replace(/\.pdf$/, ''));
        } catch (err: any) {
            toast.error(err || 'Failed to upload document.');
            dispatch(setPackageError(err || 'Upload failed'));
        } finally {
            dispatch(setPackageLoading(false));
        }
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileChange(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileChange(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleTemplateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        if (!templateId) {
            dispatch(startPackageCreation({ name: 'New Package' }));
            setSelectedTemplateId(null);
            return;
        }

        dispatch(setPackageLoading(true));
        setRenderError(null);
        try {
            const template = await dispatch(getTemplateById(templateId)).unwrap();
            const correctedFileUrl = template.fileUrl.startsWith('/public') ? template.fileUrl : `/public${template.fileUrl}`;
            const fullUrl = `${BACKEND_URL}${correctedFileUrl}`;
            const response = await fetch(fullUrl, { mode: 'cors' });
            if (!response.ok) throw new Error(`Failed to fetch template PDF: ${response.statusText}`);
            const fileData = await response.arrayBuffer();

            dispatch(
                startPackageCreation({
                    name: template.name,
                    attachment_uuid: template.attachment_uuid,
                    fileUrl: template.fileUrl,
                    fileData: fileData,
                    templateId: template._id,
                    fields: template.fields.map((f) => ({ ...f, assignedUsers: [] })),
                })
            );
            formik.setFieldValue('documentTitle', template.name);
            setSelectedTemplateId(templateId);
        } catch (err: any) {
            toast.error(err || 'Failed to load selected template.');
            dispatch(setPackageError(err || 'Template load failed.'));
            dispatch(startPackageCreation({ name: 'New Package' }));
            setSelectedTemplateId(null);
        } finally {
            dispatch(setPackageLoading(false));
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Document Selection */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Document Source</h2>
                            <p className="text-gray-600">Select an existing template or upload a new PDF document</p>
                        </div>

                        {/* Template Selection */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FiFileTyped className="text-blue-600" />
                                Use Existing Template
                            </h3>
                            <select
                                id="selectTemplate"
                                name="selectTemplate"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                value={selectedTemplateId || ''}
                                onChange={handleTemplateSelect}
                                disabled={templatesLoading || packageLoading}
                            >
                                <option value="">-- Select an Existing Template --</option>
                                {templates.map((tpl) => (
                                    <option key={tpl._id} value={tpl._id}>
                                        {tpl.name}
                                    </option>
                                ))}
                            </select>
                            {templatesLoading && (
                                <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Loading templates...
                                </div>
                            )}
                        </div>

                        {/* PDF Upload */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FiUploadCloudTyped className="text-green-600" />
                                Upload New PDF
                            </h3>
                            <div
                                className={`
                                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
                                    ${isDragOver ? 'border-green-500 bg-green-100' : 'border-green-300 hover:border-green-500 hover:bg-green-50'}
                                `}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileInputChange} className="hidden" />
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 transition-colors duration-300 ${
                                            isDragOver ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
                                        }`}
                                    >
                                        <FiUploadCloudTyped />
                                    </div>
                                    <h4 className="font-semibold text-lg text-gray-900 mb-2">{isDragOver ? 'Drop your PDF here' : 'Drag & Drop PDF or Click to Browse'}</h4>
                                    <p className="text-gray-600 text-sm">Supports PDF files up to 10MB</p>
                                </div>
                                {packageLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                                        <div className="flex items-center gap-3 text-green-600">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                            <span className="font-medium">Uploading...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Package Title */}
                        {(currentPackage?.fileUrl || currentPackage?.fileData) && (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <label htmlFor="documentTitle" className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FiEdit3Typed className="text-gray-600" />
                                    Package Title
                                </label>
                                <input
                                    type="text"
                                    id="documentTitle"
                                    name="documentTitle"
                                    placeholder="e.g., Onboarding Document for John Doe"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.documentTitle}
                                />
                                {formik.touched.documentTitle && formik.errors.documentTitle && (
                                    <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <span>⚠️</span>
                                        {formik.errors.documentTitle}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Document Preview */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h3>
                        {renderError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <div className="text-red-600 text-4xl mb-2">❌</div>
                                <p className="text-red-700 font-medium">{renderError}</p>
                            </div>
                        )}
                        {(currentPackage?.fileUrl || currentPackage?.fileData) && !renderError ? (
                            <div className="flex justify-center">
                                <div className="bg-white rounded-lg shadow-lg p-4 max-w-full">
                                    <canvas ref={canvasRef} className="max-w-full h-auto rounded shadow-sm" style={{ maxHeight: '500px' }} />
                                </div>
                            </div>
                        ) : (
                            !renderError && (
                                <div className="text-center py-16">
                                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Document Selected</h4>
                                    <p className="text-gray-500">Choose a template or upload a PDF to see the preview</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
                <form onSubmit={formik.handleSubmit}>
                    <button type="submit" className="hidden"></button>
                </form>
            </div>
        </div>
    );
};

export default Step1_DocumentSelection;
