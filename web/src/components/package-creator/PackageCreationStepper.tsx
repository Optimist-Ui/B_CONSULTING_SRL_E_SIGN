import React, { ComponentType, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../store';
import Step1_DocumentSelection from './Step1_DocumentSelection';
import Step2_FieldAssignment from './Step2_FieldAssignment';
import Step3_PackageReview from './Step3_PackageReview';
import { clearPackageState, setPackageActiveStep, setPackageError } from '../../store/slices/packageSlice';
import { saveOrUpdateTemplateFromPackage } from '../../store/thunk/templateThunks';
import { savePackage } from '../../store/thunk/packageThunks';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft, FiArrowRight, FiCheck, FiLayers, FiFileText } from 'react-icons/fi';

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
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { activeStep, currentPackage, loading, error } = useSelector((state: IRootState) => state.packages);

    const steps = [
        { label: 'Document Selection', component: Step1_DocumentSelection },
        { label: 'Field Assignment', component: Step2_FieldAssignment },
        { label: 'Review & Confirm', component: Step3_PackageReview },
    ];

    const CurrentStepComponent = steps[activeStep].component;

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(setPackageError(null));
        }
    }, [error, dispatch]);

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            dispatch(setPackageActiveStep(activeStep + 1));
        }
    };

    const handlePrevious = () => {
        if (activeStep > 0) {
            dispatch(setPackageActiveStep(activeStep - 1));
        } else {
            dispatch(clearPackageState());
        }
    };

    const handleSaveDraft = async () => {
        if (!currentPackage) {
            toast.error('No package to save.');
            return;
        }
        toast.info('Saving draft...');
        try {
            await dispatch(
                savePackage({
                    ...currentPackage,
                    status: 'Draft',
                })
            ).unwrap();
            toast.success('Draft saved successfully!');
            dispatch(clearPackageState());
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err || 'Failed to save draft.');
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!currentPackage) {
            toast.error('Cannot save as template: No package data available.');
            return;
        }
        try {
            await dispatch(saveOrUpdateTemplateFromPackage(currentPackage)).unwrap();
            dispatch(clearPackageState());
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err || 'Failed to save as template.');
        }
    };

    const handleConfirmPackage = async () => {
        if (!currentPackage) {
            toast.error('No package to confirm.');
            return;
        }
        if (!currentPackage.name.trim()) {
            toast.error('Package title cannot be empty.');
            dispatch(setPackageActiveStep(0));
            return;
        }
        if (!currentPackage.fileUrl && !currentPackage.fileData) {
            toast.error('Please upload or select a document.');
            dispatch(setPackageActiveStep(0));
            return;
        }
        const unassignedRequiredFields = currentPackage.fields.filter((field) => field.required && (!field.assignedUsers || field.assignedUsers.length === 0));
        if (unassignedRequiredFields.length > 0) {
            const fieldLabels = unassignedRequiredFields.map((f) => f.label || f.type).join(', ');
            toast.error(`Please assign users to required fields: ${fieldLabels}`);
            dispatch(setPackageActiveStep(1));
            return;
        }
        try {
            await dispatch(
                savePackage({
                    attachment_uuid: currentPackage.attachment_uuid,
                    name: currentPackage.name,
                    fileUrl: currentPackage.fileUrl,
                    s3Key: currentPackage.s3Key || '',
                    fields: currentPackage.fields,
                    receivers: currentPackage.receivers,
                    options: currentPackage.options,
                    templateId: currentPackage.templateId,
                    customMessage: currentPackage.customMessage,
                    status: 'Sent',
                    saveAsTemplate: false,
                })
            ).unwrap();
            toast.success('Package saved and sent successfully!');
            dispatch(clearPackageState());
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err || 'Failed to save package.');
        }
    };

    const stepProps: StepperStepProps = {
        onNext: handleNext,
        onPrevious: handlePrevious,
        onConfirm: handleConfirmPackage,
    };

    const canGoNext = () => {
        if (!currentPackage) return false;
        if (activeStep === 0) {
            return !!(currentPackage.name.trim() && (currentPackage.fileUrl || currentPackage.fileData) && currentPackage.attachment_uuid);
        }
        return true;
    };

    const canGoPrevious = () => {
        return true;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with Stepper */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-6 ">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create Document Package</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Configure your document for signature collection</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-center">
                        <div className="flex items-center space-x-8">
                            {steps.map((step, index) => (
                                <React.Fragment key={index}>
                                    <div className="flex items-center">
                                        <div
                                            className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium 
                        transition-colors duration-200 cursor-pointer
                        ${activeStep >= index ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'}
                      `}
                                            onClick={() => {
                                                if (index <= activeStep) dispatch(setPackageActiveStep(index));
                                            }}
                                        >
                                            {activeStep > index ? <FiCheckTyped className="w-4 h-4" /> : index + 1}
                                        </div>
                                        <span
                                            className={`
                      ml-3 text-sm font-medium
                      ${activeStep >= index ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                    `}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`
                      w-16 h-px 
                      ${activeStep > index ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content with Fixed Left Actions */}
            <div className="relative">
                {/* Content with left padding to avoid overlap */}
                <div className="pl-20">
                    <CurrentStepComponent {...stepProps} />
                </div>

                {/* Fixed Action Buttons - Left Center */}
                <div className="fixed left-1/8 top-1/2 transform -translate-y-1/2 z-50">
                    <div className="flex flex-col items-center gap-4">
                        {/* Previous Button */}
                        <button
                            onClick={handlePrevious}
                            disabled={loading || !canGoPrevious()}
                            className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                ${
                    canGoPrevious() && !loading
                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-xl'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                }
              `}
                            title={activeStep === 0 ? 'Back to Dashboard' : 'Previous Step'}
                        >
                            <FiArrowLeftTyped className="w-5 h-5" />
                        </button>

                        {/* Next/Action Buttons */}
                        {activeStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={loading || !canGoNext()}
                                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                  ${canGoNext() && !loading ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}
                `}
                                title="Next Step"
                            >
                                <FiArrowRightTyped className="w-5 h-5" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-xl"
                                    title="Save as Draft"
                                >
                                    <FiFileTextTyped className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSaveAsTemplate}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl"
                                    title="Save as Template"
                                >
                                    <FiLayersTyped className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleConfirmPackage}
                                    disabled={loading || !canGoNext()}
                                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                    ${canGoNext() && !loading ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}
                  `}
                                    title={loading ? 'Saving Package...' : 'Confirm & Send Package'}
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
