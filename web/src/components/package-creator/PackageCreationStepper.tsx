import React, { ComponentType, useEffect } from 'react';
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
                    ...currentPackage, // Pass the whole currentPackage object
                    status: 'Draft',
                })
            ).unwrap();
            toast.success('Draft saved successfully!');
            dispatch(clearPackageState());
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
            // Use the new thunk which handles both create and update logic
            await dispatch(saveOrUpdateTemplateFromPackage(currentPackage)).unwrap();
            // The success toast is now handled within the thunk itself.
            dispatch(clearPackageState()); // Go back to dashboard on success
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
                    fields: currentPackage.fields,
                    receivers: currentPackage.receivers,
                    options: currentPackage.options,
                    templateId: currentPackage.templateId,
                    status: 'Sent', // Set for confirmation
                    saveAsTemplate: false,
                })
            ).unwrap();
            toast.success('Package saved and sent successfully!');
            dispatch(clearPackageState());
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
        return true; // Always allow going back, even from step 0 to dashboard
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header with Stepper */}
            <div className="border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 pt-6 pb-6">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Create Document Package</h1>
                        <p className="text-slate-600 text-sm">Configure your document for signature collection</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="flex items-center">
                            {steps.map((step, index) => (
                                <React.Fragment key={index}>
                                    <div className="flex items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 cursor-pointer ${
                                                activeStep >= index ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                            }`}
                                            onClick={() => {
                                                if (index <= activeStep) dispatch(setPackageActiveStep(index));
                                            }}
                                        >
                                            {activeStep > index ? <FiCheckTyped className="w-4 h-4" /> : index + 1}
                                        </div>
                                        <span className={`ml-3 text-sm font-medium ${activeStep >= index ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</span>
                                    </div>
                                    {index < steps.length - 1 && <div className={`w-16 h-px mx-6 ${activeStep > index ? 'bg-slate-800' : 'bg-slate-200'}`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content with Vertical Navigation */}
            <div className="flex min-h-[calc(100vh-220px)]">
                <div className="flex-shrink-0 flex items-center justify-center px-4" style={{ width: '5%' }}>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={loading || !canGoPrevious()}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                canGoPrevious() && !loading
                                    ? 'text-slate-700 bg-white border border-slate-300 hover:border-slate-400 hover:shadow-xl hover:-translate-y-1'
                                    : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
                            }`}
                            title={activeStep === 0 ? 'Back to Dashboard' : 'Previous Step'}
                        >
                            <FiArrowLeftTyped className="w-5 h-5" />
                        </button>
                        {activeStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={loading || !canGoNext()}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                    canGoNext() && !loading ? 'text-white bg-slate-800 hover:bg-slate-900 hover:shadow-xl hover:-translate-y-1' : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                                }`}
                                title="Next Step"
                            >
                                <FiArrowRightTyped className="w-5 h-5" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg text-slate-700 bg-white border border-slate-300 hover:border-slate-400 hover:shadow-xl hover:-translate-y-1"
                                    title="Save as Draft"
                                >
                                    <FiFileTextTyped className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSaveAsTemplate}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1"
                                    title="Save as Template"
                                >
                                    <FiLayersTyped className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleConfirmPackage}
                                    disabled={loading || !canGoNext()}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                        canGoNext() && !loading
                                            ? 'text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1'
                                            : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                                    }`}
                                    title={loading ? 'Saving Package...' : 'Confirm & Send Package'}
                                >
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FiCheckTyped className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex-1" style={{ width: '95%' }}>
                    <CurrentStepComponent {...stepProps} />
                </div>
            </div>
        </div>
    );
};

export default PackageCreationStepper;
