import React, { useState, useEffect, useCallback, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { FiFilePlus, FiTrash2, FiEdit, FiSave } from 'react-icons/fi';

// Redux Imports
import { AppDispatch, IRootState } from '../store';
import { DocumentTemplate, clearTemplateState } from '../store/slices/templateSlice';
import { fetchTemplates, deleteTemplate, saveTemplate, updateTemplate, getTemplateById } from '../store/thunk/templateThunks';

// Component Imports
import DocumentUploadStep from '../components/template-creator/DocumentUploadStep';
import DocumentEditorStep from '../components/template-creator/DocumentEditorStep';

const FiFilePlusTyped = FiFilePlus as ComponentType<{ className?: string }>;
const FiTrash2Typed = FiTrash2 as ComponentType<{ className?: string }>;
const FiEditTyped = FiEdit as ComponentType<{ className?: string }>;
const FiSaveTyped = FiSave as ComponentType<{ className?: string }>;

const TemplatesDashboard: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { currentTemplate, templates, loading, error } = useSelector((state: IRootState) => state.templates);
    const [step, setStep] = useState(0);

    const handleBackToList = useCallback(() => {
        dispatch(clearTemplateState());
        setStep(0);
        dispatch(fetchTemplates());
    }, [dispatch]);

    useEffect(() => {
        if (step === 0) dispatch(fetchTemplates());
    }, [dispatch, step]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    useEffect(() => {
        if (currentTemplate && step === 1) setStep(2);
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
            toast.error(t('templates.messages.invalidId') as string);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        Swal.fire({
            title: t('templates.deleteConfirm.title'),
            text: t('templates.deleteConfirm.text'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('templates.deleteConfirm.confirmButton'),
            cancelButtonText: t('templates.deleteConfirm.cancelButton'),
            customClass: { popup: 'bg-white text-gray-800' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await dispatch(deleteTemplate(templateId)).unwrap();
                    toast.success(t('templates.messages.deleteSuccess') as string);
                    Swal.fire({
                        title: t('templates.deleteSuccessAlert.title'),
                        text: t('templates.deleteSuccessAlert.text'),
                        icon: 'success',
                        customClass: { popup: 'bg-white text-gray-800' },
                    });
                } catch (err: any) {
                    const errorMessage = err || t('templates.messages.deleteFailed');
                    toast.error(errorMessage);
                    Swal.fire({
                        title: t('templates.deleteErrorAlert.title'),
                        text: errorMessage,
                        icon: 'error',
                        customClass: { popup: 'bg-white text-gray-800' },
                    });
                }
            }
        });
    };

    const handleSaveTemplate = useCallback(async () => {
        if (!currentTemplate) {
            toast.error(t('templates.messages.noTemplateToSave') as string);
            return;
        }
        if (!currentTemplate.name || currentTemplate.name.trim() === '') {
            toast.error(t('templates.messages.titleRequired') as string);
            return;
        }

        try {
            if (currentTemplate._id) {
                await dispatch(updateTemplate({ templateId: currentTemplate._id, name: currentTemplate.name, fields: currentTemplate.fields })).unwrap();
                toast.success(t('templates.messages.updateSuccess') as string);
            } else {
                if (!currentTemplate.fileUrl) {
                    toast.error(t('templates.messages.fileUrlMissing') as string);
                    return;
                }
                if (!currentTemplate.s3Key) {
                    toast.error(t('templates.messages.s3KeyMissing') as string);
                    return;
                }
                await dispatch(
                    saveTemplate({
                        attachment_uuid: currentTemplate.attachment_uuid,
                        name: currentTemplate.name,
                        fileUrl: currentTemplate.fileUrl,
                        s3Key: currentTemplate.s3Key,
                        fields: currentTemplate.fields,
                    })
                ).unwrap();
                toast.success(t('templates.messages.saveSuccess') as string);
            }
            handleBackToList();
        } catch (err: any) {
            toast.error(err.message || t('templates.messages.saveFailed'));
        }
    }, [currentTemplate, dispatch, handleBackToList, t]);

    if (step === 1) {
        return (
            <div className="p-6 dark:bg-gray-900 bg-gray-50 min-h-full">
                <button onClick={handleBackToList} className="btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-150 mb-4">
                    {t('templates.buttons.backToList')}
                </button>
                <DocumentUploadStep />
                {loading && <div className="text-center mt-4 text-gray-600">{t('templates.loading')}</div>}
            </div>
        );
    }

    if (step === 2 && currentTemplate) {
        return (
            <div className="p-4 md:p-6 flex flex-col h-full dark:bg-gray-900 bg-gray-50">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <button onClick={handleBackToList} className="btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-150">
                        {t('templates.buttons.backToList')}
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 text-center truncate px-4">{t('templates.editor.title', { templateName: currentTemplate.name })}</h1>
                    <button
                        onClick={handleSaveTemplate}
                        className="btn bg-blue-500 text-white hover:bg-blue-600 transition-all duration-150 gap-2 flex items-center"
                        disabled={loading || !currentTemplate.name.trim()}
                    >
                        {loading ? (
                            t('templates.buttons.saving')
                        ) : (
                            <>
                                <FiSaveTyped /> {t('templates.buttons.saveTemplate')}
                            </>
                        )}
                    </button>
                </div>
                <DocumentEditorStep />
            </div>
        );
    }

    return (
        <div className="p-6 dark:bg-gray-900 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('templates.header.title')}</h1>
                <button onClick={handleCreateNewTemplate} className="btn bg-blue-500 text-info-light hover:bg-blue-600 transition-all duration-150 gap-2 flex items-center">
                    <FiFilePlusTyped className="text-xl" />
                    {t('templates.buttons.createNew')}
                </button>
            </div>

            {loading && <div className="text-center text-gray-600">{t('templates.loadingTemplates')}</div>}

            {!loading && templates.length === 0 && (
                <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg mt-4 bg-white shadow-sm">
                    <FiFilePlusTyped className="mx-auto text-5xl text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('templates.emptyState.title')}</h3>
                    <p className="text-gray-600">{t('templates.emptyState.description')}</p>
                </div>
            )}

            {!loading && templates.length > 0 && (
                <div className="table-responsive bg-white rounded-lg shadow-md">
                    <table className="table table-hover w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="p-4 text-left">{t('templates.table.headers.name')}</th>
                                <th className="p-4 text-left">{t('templates.table.headers.uuid')}</th>
                                <th className="text-center p-4">{t('templates.table.headers.fields')}</th>
                                <th className="text-center p-4">{t('templates.table.headers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map((template, index) => (
                                <tr key={template._id} className={`border-b border-gray-200 last:border-b-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                    <td className="p-4">{template.name}</td>
                                    <td className="p-4">{template.attachment_uuid}</td>
                                    <td className="text-center p-4">{template.fields.length}</td>
                                    <td className="text-center p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm bg-white border border-gray-300 hover:bg-blue-100 hover:border-blue-300 transition-all duration-150"
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
