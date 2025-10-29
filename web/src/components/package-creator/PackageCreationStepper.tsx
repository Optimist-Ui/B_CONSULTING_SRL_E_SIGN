import React, { ComponentType, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { FiSave, FiArrowLeft, FiArrowRight, FiCheck, FiLayers, FiFileText } from 'react-icons/fi';

// Redux Imports
import { AppDispatch, IRootState } from '../../store';
import { clearPackageState, setPackageActiveStep, setPackageError } from '../../store/slices/packageSlice';
import { saveOrUpdateTemplateFromPackage } from '../../store/thunk/templateThunks';
import { savePackage } from '../../store/thunk/packageThunks';

// Component Imports
import Step1_DocumentSelection from './Step1_DocumentSelection';
import Step2_FieldAssignment from './Step2_FieldAssignment';
import Step3_PackageReview from './Step3_PackageReview';

const FiSaveTyped = FiSave as ComponentType<{ className?: string }>;
const FiArrowLeftTyped = FiArrowLeft as ComponentType<{ className?: string }>;
const FiArrowRightTyped = FiArrowRight as ComponentType<{ className?: string }>;
const FiCheckTyped = FiCheck as ComponentType<{ className?: string }>;
const FiLayersTyped = FiLayers as ComponentType<{ className?: string }>;
const FiFileTextTyped = FiFileText as ComponentType<{ className?: string }>;

interface StepperStepProps {
    onNext: () => void;
    onPrevious: () => void;
    onConfirm: () => void;
}

const PackageCreationStepper: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { activeStep, currentPackage, loading, error } = useSelector((state: IRootState) => state.packages);

    const steps = [
        { labelKey: 'stepper.steps.documentSelection', shortLabelKey: 'stepper.steps.select', component: Step1_DocumentSelection },
        { labelKey: 'stepper.steps.fieldAssignment', shortLabelKey: 'stepper.steps.assign', component: Step2_FieldAssignment },
        { labelKey: 'stepper.steps.reviewAndConfirm', shortLabelKey: 'stepper.steps.review', component: Step3_PackageReview },
    ];

    const CurrentStepComponent = steps[activeStep].component;

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(setPackageError(null));
        }
    }, [error, dispatch]);

    const handleNext = () => {
        if (activeStep < steps.length - 1) dispatch(setPackageActiveStep(activeStep + 1));
    };

    const handlePrevious = () => {
        if (activeStep > 0) dispatch(setPackageActiveStep(activeStep - 1));
        else dispatch(clearPackageState());
    };

    const extractTemplateId = (templateId: string | { _id: string; [key: string]: any } | undefined): string | undefined => {
        if (!templateId) return undefined;
        return typeof templateId === 'object' ? templateId._id : templateId;
    };

    const handleSaveDraft = async () => {
        if (!currentPackage) {
            toast.error(t('stepper.messages.noPackageToSave') as string);
            return;
        }
        toast.info(t('stepper.messages.savingDraft') as string);
        try {
            await dispatch(
                savePackage({
                    _id: currentPackage._id,
                    attachment_uuid: currentPackage.attachment_uuid,
                    name: currentPackage.name,
                    fileUrl: currentPackage.fileUrl,
                    s3Key: currentPackage.s3Key,
                    fields: currentPackage.fields,
                    receivers: currentPackage.receivers,
                    options: currentPackage.options,
                    templateId: extractTemplateId(currentPackage.templateId),
                    customMessage: currentPackage.customMessage,
                    status: 'Draft',
                })
            ).unwrap();
            toast.success(t('stepper.messages.draftSaved') as string);
            dispatch(clearPackageState());
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err || t('stepper.messages.draftFailed'));
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!currentPackage) {
            toast.error(t('stepper.messages.noPackageForTemplate') as string);
            return;
        }
        try {
            await dispatch(saveOrUpdateTemplateFromPackage(currentPackage)).unwrap();
            dispatch(clearPackageState());
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err || t('stepper.messages.templateSaveFailed'));
        }
    };

    const handleConfirmPackage = async () => {
        if (!currentPackage) {
            toast.error(t('stepper.messages.noPackageToConfirm') as string);
            return;
        }
        if (!currentPackage.name.trim()) {
            toast.error(t('stepper.messages.titleRequired') as string);
            dispatch(setPackageActiveStep(0));
            return;
        }
        if (!currentPackage.fileUrl && !currentPackage.fileData) {
            toast.error(t('stepper.messages.documentRequired') as string);
            dispatch(setPackageActiveStep(0));
            return;
        }
        const unassignedRequiredFields = currentPackage.fields.filter((f) => f.required && (!f.assignedUsers || f.assignedUsers.length === 0));
        if (unassignedRequiredFields.length > 0) {
            const fieldLabels = unassignedRequiredFields.map((f) => f.label || f.type).join(', ');
            toast.error(`${t('stepper.messages.unassignedFields')}: ${fieldLabels}`);
            dispatch(setPackageActiveStep(1));
            return;
        }
        try {
            await dispatch(
                savePackage({
                    _id: currentPackage._id,
                    attachment_uuid: currentPackage.attachment_uuid,
                    name: currentPackage.name,
                    fileUrl: currentPackage.fileUrl,
                    s3Key: currentPackage.s3Key || '',
                    fields: currentPackage.fields,
                    receivers: currentPackage.receivers,
                    options: currentPackage.options,
                    templateId: extractTemplateId(currentPackage.templateId),
                    customMessage: currentPackage.customMessage,
                    status: 'Sent',
                    saveAsTemplate: false,
                })
            ).unwrap();
            toast.success(t('stepper.messages.packageSent') as string);
            dispatch(clearPackageState());
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err || t('stepper.messages.packageSaveFailed'));
        }
    };

    const stepProps: StepperStepProps = { onNext: handleNext, onPrevious: handlePrevious, onConfirm: handleConfirmPackage };
    const canGoNext = () => {
        if (!currentPackage) return false;
        if (activeStep === 0) return !!(currentPackage.name.trim() && (currentPackage.fileUrl || currentPackage.fileData) && currentPackage.attachment_uuid);
        if (activeStep === 1) return currentPackage.fields.length > 0;
        return true;
    };
    const canGoPrevious = () => true;
    const isEditingDraft = currentPackage?._id && /^[a-f\d]{24}$/i.test(currentPackage._id);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
                    <div className="text-center mb-2 hidden sm:block">
                        <h1 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                            {isEditingDraft ? t('stepper.header.editTitle') : t('stepper.header.createTitle')}
                        </h1>
                    </div>
                    <div className="flex justify-center overflow-x-auto">
                        <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-max px-2">
                            {steps.map((step, index) => (
                                <React.Fragment key={index}>
                                    <div className="flex items-center">
                                        <div
                                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                                                activeStep >= index ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                            onClick={() => {
                                                if (index <= activeStep) dispatch(setPackageActiveStep(index));
                                            }}
                                        >
                                            {activeStep > index ? <FiCheckTyped className="w-3 h-3 sm:w-4 sm:h-4" /> : index + 1}
                                        </div>
                                        <span
                                            className={`ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                                                activeStep >= index ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            <span className="hidden md:inline">{t(step.labelKey)}</span>
                                            <span className="md:hidden">{t(step.shortLabelKey)}</span>
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && <div className={`w-8 sm:w-12 md:w-16 h-px flex-shrink-0 ${activeStep > index ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative">
                <div className="pl-20">
                    <CurrentStepComponent {...stepProps} />
                </div>
                <div className="fixed left-1/8 top-1/2 transform -translate-y-1/2 z-50">
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={loading || !canGoPrevious()}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                canGoPrevious() && !loading
                                    ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-xl'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                            }`}
                            title={activeStep === 0 ? t('stepper.buttons.backToDashboard') : t('stepper.buttons.previousStep')}
                        >
                            <FiArrowLeftTyped className="w-5 h-5" />
                        </button>
                        {activeStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={loading || !canGoNext()}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                    canGoNext() && !loading ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                                title={t('stepper.buttons.nextStep')}
                            >
                                <FiArrowRightTyped className="w-5 h-5" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-xl"
                                    title={t('stepper.buttons.saveDraft')}
                                >
                                    <FiFileTextTyped className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSaveAsTemplate}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl"
                                    title={t('stepper.buttons.saveAsTemplate')}
                                >
                                    <FiLayersTyped className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleConfirmPackage}
                                    disabled={loading || !canGoNext()}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                        canGoNext() && !loading ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                    title={loading ? t('stepper.buttons.savingPackage') : t('stepper.buttons.confirmPackage')}
                                >
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FiCheckTyped className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageCreationStepper;
