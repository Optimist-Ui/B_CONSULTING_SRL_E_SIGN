import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../store';
import DocumentUploadStep from '../components/template-creator/DocumentUploadStep';
import DocumentEditorStep from '../components/template-creator/DocumentEditorStep';
import { DocumentTemplate, clearTemplateState } from '../store/slices/templateSlice';
// --- FIX: Import the updateTemplate thunk ---
import { fetchTemplates, deleteTemplate, saveTemplate, updateTemplate, getTemplateById } from '../store/thunk/templateThunks';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ComponentType } from 'react';
import { FiFilePlus, FiTrash2, FiEdit, FiSave } from 'react-icons/fi';

const FiFilePlusTyped = FiFilePlus as ComponentType<{ className?: string }>;
const FiTrash2Typed = FiTrash2 as ComponentType<{ className?: string }>;
const FiEditTyped = FiEdit as ComponentType<{ className?: string }>;
const FiSaveTyped = FiSave as ComponentType<{ className?: string }>;

const TemplatesDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentTemplate, templates, loading, error } = useSelector((state: IRootState) => state.templates);
    const [step, setStep] = useState(0);

    const handleBackToList = useCallback(() => {
        dispatch(clearTemplateState());
        setStep(0);
        dispatch(fetchTemplates());
    }, [dispatch]);

    useEffect(() => {
        if (step === 0) {
            dispatch(fetchTemplates());
        }
    }, [dispatch, step]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    useEffect(() => {
        if (currentTemplate && step === 1) {
            setStep(2);
        }
    }, [currentTemplate, step]);

    const handleCreateNewTemplate = () => {
        dispatch(clearTemplateState());
        setStep(1);
    };

    const handleEditTemplate = async (template: DocumentTemplate) => {
        if (template._id) {
            await dispatch(getTemplateById(template._id)).unwrap();
            setStep(2);
        } else {
            toast.error('Invalid template ID.');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            customClass: {
                popup: 'bg-white text-gray-800',
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                await dispatch(deleteTemplate(templateId))
                    .unwrap()
                    .then(() => {
                        toast.success('Template deleted successfully!');
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Your template has been deleted.',
                            icon: 'success',
                            customClass: { popup: 'bg-white text-gray-800' },
                        });
                    })
                    .catch((err: string) => {
                        toast.error(err || 'Failed to delete template.');
                        Swal.fire({
                            title: 'Error!',
                            text: err || 'Failed to delete template.',
                            icon: 'error',
                            customClass: { popup: 'bg-white text-gray-800' },
                        });
                    });
            }
        });
    };

    // --- THIS IS THE FIX ---
    const handleSaveTemplate = useCallback(async () => {
        if (!currentTemplate) {
            toast.error('No template to save.');
            return;
        }

        if (!currentTemplate.name || currentTemplate.name.trim() === '') {
            toast.error('Template title cannot be empty.');
            return;
        }

        try {
            if (currentTemplate._id) {
                // If the template has an _id, it's an existing document. UPDATE it.
                await dispatch(
                    updateTemplate({
                        templateId: currentTemplate._id,
                        name: currentTemplate.name,
                        fields: currentTemplate.fields,
                    })
                ).unwrap();
                toast.success('Template updated successfully!');
            } else {
                // If there's no _id, it's a new document. CREATE it.
                if (!currentTemplate.fileUrl) {
                    // This check is more relevant for creation
                    toast.error('File URL is missing. Please upload a document.');
                    return;
                }
                await dispatch(
                    saveTemplate({
                        attachment_uuid: currentTemplate.attachment_uuid,
                        name: currentTemplate.name,
                        fileUrl: currentTemplate.fileUrl,
                        fields: currentTemplate.fields,
                    })
                ).unwrap();
                toast.success('Template saved successfully!');
            }

            // After either action, go back to the list and refresh.
            handleBackToList();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save template.');
        }
    }, [currentTemplate, dispatch, handleBackToList]);

    if (step === 1) {
        return (
            <div className="p-6 bg-gray-50 min-h-full">
                <button onClick={handleBackToList} className="btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-150 mb-4">
                    Back to Templates
                </button>
                <DocumentUploadStep />
                {loading && <div className="text-center mt-4 text-gray-600">Loading...</div>}
            </div>
        );
    }

    if (step === 2 && currentTemplate) {
        return (
            <div className="p-4 md:p-6 flex flex-col h-full bg-gray-50">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <button onClick={handleBackToList} className="btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-150">
                        Back to Templates
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 text-center truncate px-4">Editing: {currentTemplate.name}</h1>
                    <button
                        onClick={handleSaveTemplate}
                        className="btn bg-blue-500 text-white hover:bg-blue-600 transition-all duration-150 gap-2 flex items-center"
                        disabled={loading || !currentTemplate.name.trim()}
                    >
                        {loading ? (
                            'Saving...'
                        ) : (
                            <>
                                <FiSaveTyped /> Save Template
                            </>
                        )}
                    </button>
                </div>
                <DocumentEditorStep />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
                <button onClick={handleCreateNewTemplate} className="btn bg-blue-500 text-white hover:bg-blue-600 transition-all duration-150 gap-2 flex items-center">
                    <FiFilePlusTyped className="text-xl" />
                    Create New Template
                </button>
            </div>

            {loading && <div className="text-center text-gray-600">Loading templates...</div>}

            {!loading && templates.length === 0 && (
                <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg mt-4 bg-white shadow-sm">
                    <FiFilePlusTyped className="mx-auto text-5xl text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Templates Found</h3>
                    <p className="text-gray-600">Get started by creating your first document template.</p>
                </div>
            )}

            {!loading && templates.length > 0 && (
                <div className="table-responsive bg-white rounded-lg shadow-md">
                    <table className="table table-hover w-full">
                        <thead>
                            <tr className="text-gray-700 border-b border-gray-200">
                                <th className="p-4 text-left">Name</th>
                                <th className="p-4 text-left">Attachment UUID</th>
                                <th className="text-center p-4">Fields</th>
                                <th className="text-center p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map((template, index) => (
                                <tr key={template._id} className={`border-b border-gray-200 last:border-b-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                    <td className="p-4 text-gray-800">{template.name}</td>
                                    <td className="p-4 text-gray-600">{template.attachment_uuid}</td>
                                    <td className="text-center p-4 text-gray-800">{template.fields.length}</td>
                                    <td className="text-center p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-150"
                                                onClick={() => handleEditTemplate(template)}
                                            >
                                                <FiEditTyped />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm bg-white border border-gray-300 text-red-500 hover:bg-red-100 hover:border-red-300 transition-all duration-150"
                                                onClick={() => handleDeleteTemplate(template._id!)}
                                            >
                                                <FiTrash2Typed />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TemplatesDashboard;
