import React, { useCallback, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PackageField, AssignedUser, FieldRole, assignUserToField, removeUserFromField, ConcreteSignatureMethod } from '../../store/slices/packageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../store';
import SearchableContactDropdown from '../common/SearchableContactDropdown';
import AddEditContactModal from '../common/AddEditContactModal';
import { Contact } from '../../store/slices/contactSlice';
import { nanoid } from '@reduxjs/toolkit';
import { FiXCircle, FiPlusCircle, FiAlertCircle, FiMail, FiSmartphone } from 'react-icons/fi';
import { ComponentType } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const FiPlusCircleTyped = FiPlusCircle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;
const FiAlertCircleTyped = FiAlertCircle as ComponentType<{ className?: string }>;
const FiMailTyped = FiMail as ComponentType<{ className?: string }>;
const FiSmartphoneTyped = FiSmartphone as ComponentType<{ className?: string }>;

interface PackageFieldPropertiesPanelProps {
    field: PackageField;
    onUpdate: (fieldId: string, updates: Partial<PackageField>) => void;
}

const PackageFieldPropertiesPanel: React.FC<PackageFieldPropertiesPanelProps> = ({ field, onUpdate }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const dispatch = useDispatch<AppDispatch>();
    const { contacts } = useSelector((state: IRootState) => state.contacts);

    const [selectedContactForAssignment, setSelectedContactForAssignment] = useState<Contact | null>(null);
    const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<FieldRole | ''>('');
    const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
    const [signatureMethodsForNewSigner, setSignatureMethodsForNewSigner] = useState<ConcreteSignatureMethod[]>(['Email OTP']);

    // Determine if this is a signature field
    const isSignatureField = field.type === 'signature';

    // Check if signature field already has a signer
    const hasSignerAssigned = field.assignedUsers?.some((u) => u.role === 'Signer');

    // Get available roles based on field type
    const availableRoles: FieldRole[] = useMemo(() => {
        if (isSignatureField) {
            return ['Signer']; // Only Signer for signature fields
        }
        return ['FormFiller', 'Approver']; // No Signer for other fields
    }, [isSignatureField]);

    const formik = useFormik({
        initialValues: {
            label: field.label,
            required: field.required,
            placeholder: field.type === 'text' || field.type === 'textarea' ? field.placeholder || '' : '',
            radioOptions: field.type === 'radio' && field.options ? field.options.map((opt) => opt.label).join(',') : '',
            dropdownOptions: field.type === 'dropdown' && field.options ? field.options.map((opt) => opt.label).join(',') : '',
            groupId: field.type === 'radio' ? field.groupId || '' : '',
        },
        validationSchema: Yup.object({
            label: Yup.string().required(t('packageFieldPropertiesPanel.errors.labelRequired')).min(1, t('packageFieldPropertiesPanel.errors.labelEmpty')),
            placeholder: Yup.string().max(200, t('packageFieldPropertiesPanel.errors.placeholderTooLong')),
            radioOptions: Yup.string().test('at-least-two-radio-options', t('packageFieldPropertiesPanel.errors.radioOptionsMin'), (value) => {
                if (field.type === 'radio') {
                    const optionsArray = value
                        ? value
                              .split(',')
                              .filter((o) => o.trim() !== '')
                              .map((o) => o.trim())
                        : [];
                    return optionsArray.length >= 2;
                }
                return true;
            }),
            dropdownOptions: Yup.string().test('at-least-one-dropdown-option', t('packageFieldPropertiesPanel.errors.dropdownOptionsMin'), (value) => {
                if (field.type === 'dropdown') {
                    const optionsArray = value
                        ? value
                              .split(',')
                              .filter((o) => o.trim() !== '')
                              .map((o) => o.trim())
                        : [];
                    return optionsArray.length >= 1;
                }
                return true;
            }),
            groupId: Yup.string().when('type', {
                is: () => field.type === 'radio',
                then: Yup.string().required(t('packageFieldPropertiesPanel.errors.groupIdRequired')),
                otherwise: Yup.string(),
            }),
        }),
        enableReinitialize: true,
        onSubmit: (values) => {},
    });

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formik.dirty && formik.isValid) {
                let updatedFieldData: Partial<PackageField> = {
                    label: formik.values.label,
                    required: formik.values.required,
                };

                if (field.type === 'text' || field.type === 'textarea') {
                    updatedFieldData.placeholder = formik.values.placeholder;
                } else if (field.type === 'radio') {
                    updatedFieldData.groupId = formik.values.groupId;
                    const optionsArray = formik.values.radioOptions
                        .split(',')
                        .filter((o) => o.trim() !== '')
                        .map((o) => o.trim());
                    if (optionsArray.length >= 2) {
                        updatedFieldData.options = optionsArray.map((label) => ({ value: nanoid(5), label }));
                    } else if (formik.values.radioOptions.trim() === '') {
                        updatedFieldData.options = [];
                    }
                } else if (field.type === 'dropdown') {
                    const optionsArray = formik.values.dropdownOptions
                        .split(',')
                        .filter((o) => o.trim() !== '')
                        .map((o) => o.trim());
                    if (optionsArray.length >= 1) {
                        updatedFieldData.options = optionsArray.map((label) => ({ value: nanoid(5), label }));
                    } else if (formik.values.dropdownOptions.trim() === '') {
                        updatedFieldData.options = [];
                    }
                }
                onUpdate(field.id, updatedFieldData);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [formik.values, field.type, field.id, onUpdate, formik.dirty, formik.isValid, formik.touched.radioOptions, formik.touched.dropdownOptions, formik.touched.label]);

    const handleNewSignerMethodChange = (method: ConcreteSignatureMethod) => {
        setSignatureMethodsForNewSigner((prev) => {
            let newMethods: ConcreteSignatureMethod[];
            if (prev.includes(method)) {
                newMethods = prev.filter((m) => m !== method);
            } else {
                newMethods = [...prev, method];
            }
            if (newMethods.length === 0) {
                toast.error(t('packageFieldPropertiesPanel.errors.noAuthMethod') as string);
                return prev;
            }
            return newMethods;
        });
    };

    const handleAddAssignment = useCallback(() => {
        if (selectedContactForAssignment && selectedRoleForAssignment) {
            // Check if signature field already has a signer
            if (isSignatureField && hasSignerAssigned) {
                toast.error(t('packageFieldPropertiesPanel.errors.signatureFieldHasSigner') as string);
                return;
            }

            const newUserAssignment: Omit<AssignedUser, 'id'> = {
                contactId: selectedContactForAssignment._id,
                contactName: `${selectedContactForAssignment.firstName} ${selectedContactForAssignment.lastName}`,
                contactEmail: selectedContactForAssignment.email,
                role: selectedRoleForAssignment,
                ...(selectedRoleForAssignment === 'Signer' && { signatureMethods: signatureMethodsForNewSigner }),
            };
            dispatch(assignUserToField({ fieldId: field.id, user: newUserAssignment }));
            toast.success(
                t('packageFieldPropertiesPanel.messages.userAssigned', {
                    name: `${selectedContactForAssignment.firstName} ${selectedContactForAssignment.lastName}`,
                    role: selectedRoleForAssignment,
                }) as string
            );

            setSelectedContactForAssignment(null);
            setSelectedRoleForAssignment('');
            setSignatureMethodsForNewSigner(['Email OTP']);
        }
    }, [selectedContactForAssignment, selectedRoleForAssignment, signatureMethodsForNewSigner, field.id, dispatch, isSignatureField, hasSignerAssigned, t]);

    const handleRemoveAssignment = useCallback(
        (assignmentId: string) => {
            dispatch(removeUserFromField({ fieldId: field.id, assignmentId }));
            toast.success(t('packageFieldPropertiesPanel.messages.userAssignmentRemoved') as string);
        },
        [field.id, dispatch, t]
    );

    const handleExistingUserMethodChange = (assignmentId: string, method: ConcreteSignatureMethod) => {
        const userToUpdate = field.assignedUsers?.find((u) => u.id === assignmentId);
        if (!userToUpdate) return;

        const currentMethods = userToUpdate.signatureMethods || [];
        let newMethods: ConcreteSignatureMethod[];

        if (currentMethods.includes(method)) {
            newMethods = currentMethods.filter((m) => m !== method);
        } else {
            newMethods = [...currentMethods, method];
        }

        if (newMethods.length === 0) {
            toast.error(t('packageFieldPropertiesPanel.errors.noAuthMethod') as string);
            return;
        }

        const updatedUsers = field.assignedUsers?.map((user) => (user.id === assignmentId ? { ...user, signatureMethods: newMethods } : user));

        onUpdate(field.id, { assignedUsers: updatedUsers });
    };

    return (
        <>
            <div className="space-y-4 dark:bg-gray-900">
                {/* Display Field Type (Read-only) */}
                <div>
                    <label className="form-label">{t('packageFieldPropertiesPanel.labels.fieldType')}</label>
                    <input
                        type="text"
                        className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500 read-only"
                        value={t(`packageFieldPropertiesPanel.fieldTypes.${field.type}`)}
                        readOnly
                    />
                </div>

                {/* Label Input */}
                <div>
                    <label htmlFor={`label-${field.id}`} className="form-label">
                        {t('packageFieldPropertiesPanel.labels.label')}
                    </label>
                    <input
                        id={`label-${field.id}`}
                        name="label"
                        type="text"
                        className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        value={formik.values.label}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isSignatureField}
                    />
                    {isSignatureField && <p className="text-xs text-gray-500 mt-1">{t('packageFieldPropertiesPanel.messages.signatureLabelFixed')}</p>}
                    {formik.touched.label && formik.errors.label ? <div className="text-red-500 mt-1 text-sm">{formik.errors.label}</div> : null}
                </div>

                {/* Placeholder (for text/textarea fields) */}
                {(field.type === 'text' || field.type === 'textarea') && (
                    <div>
                        <label htmlFor={`placeholder-${field.id}`} className="form-label">
                            {t('packageFieldPropertiesPanel.labels.placeholder')}
                        </label>
                        <input
                            id={`placeholder-${field.id}`}
                            name="placeholder"
                            type="text"
                            className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            value={formik.values.placeholder}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder={t('packageFieldPropertiesPanel.placeholders.placeholder')}
                        />
                        {formik.touched.placeholder && formik.errors.placeholder ? <div className="text-red-500 mt-1 text-sm">{formik.errors.placeholder}</div> : null}
                    </div>
                )}

                {/* Radio Button Options and Group ID */}
                {field.type === 'radio' && (
                    <>
                        <div>
                            <label htmlFor={`group-id-${field.id}`} className="form-label">
                                {t('packageFieldPropertiesPanel.labels.radioGroupId')}
                            </label>
                            <input
                                id={`group-id-${field.id}`}
                                name="groupId"
                                type="text"
                                className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                placeholder={t('packageFieldPropertiesPanel.placeholders.radioGroupId')}
                                value={formik.values.groupId}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.groupId && formik.errors.groupId ? <div className="text-red-500 mt-1 text-sm">{formik.errors.groupId}</div> : null}
                            <p className="text-sm text-gray-500 mt-1">{t('packageFieldPropertiesPanel.messages.radioGroupIdNote')}</p>
                        </div>
                        <div>
                            <label htmlFor={`radio-options-${field.id}`} className="form-label">
                                {t('packageFieldPropertiesPanel.labels.radioOptions')}
                            </label>
                            <input
                                id={`radio-options-${field.id}`}
                                name="radioOptions"
                                type="text"
                                className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                placeholder={t('packageFieldPropertiesPanel.placeholders.radioOptions')}
                                value={formik.values.radioOptions}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.radioOptions && formik.errors.radioOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.radioOptions}</div> : null}
                            <p className="text-sm text-gray-500 mt-1">{t('packageFieldPropertiesPanel.messages.radioOptionsNote')}</p>
                        </div>
                    </>
                )}

                {/* Dropdown Options */}
                {field.type === 'dropdown' && (
                    <div>
                        <label htmlFor={`dropdown-options-${field.id}`} className="form-label">
                            {t('packageFieldPropertiesPanel.labels.dropdownOptions')}
                        </label>
                        <input
                            id={`dropdown-options-${field.id}`}
                            name="dropdownOptions"
                            type="text"
                            className="form-input dark:bg-gray-900 border-gray-300 focus:ring-blue-500"
                            placeholder={t('packageFieldPropertiesPanel.placeholders.dropdownOptions')}
                            value={formik.values.dropdownOptions}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.dropdownOptions && formik.errors.dropdownOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.dropdownOptions}</div> : null}
                        <p className="text-sm mt-1">{t('packageFieldPropertiesPanel.messages.dropdownOptionsNote')}</p>
                    </div>
                )}

                {/* Required Checkbox */}
                <div className="flex items-center space-x-2">
                    <input
                        id={`required-${field.id}`}
                        name="required"
                        type="checkbox"
                        className="form-checkbox text-blue-500 focus:ring-blue-500"
                        checked={formik.values.required}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    <label htmlFor={`required-${field.id}`} className="form-label mb-0">
                        {t('packageFieldPropertiesPanel.labels.required')}
                    </label>
                </div>

                <hr className="my-6 dark:bg-gray-900 border-gray-200" />

                {/* Role Assignment Section */}
                <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        {t('packageFieldPropertiesPanel.labels.assignUsers')}
                        {isSignatureField && hasSignerAssigned && (
                            <span className="text-xs font-normal text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">
                                {t('packageFieldPropertiesPanel.messages.oneSignerMax')}
                            </span>
                        )}
                    </h4>

                    {/* Info Banner */}
                    {isSignatureField && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-start gap-2">
                            <FiAlertCircleTyped className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">{t('packageFieldPropertiesPanel.messages.signatureFieldNote')}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mb-4">
                        <SearchableContactDropdown
                            contacts={contacts}
                            selectedContact={selectedContactForAssignment}
                            onSelectContact={setSelectedContactForAssignment}
                            onAddNewContact={() => setAddContactModalOpen(true)}
                        />
                        <div>
                            <select className="form-select w-full" value={selectedRoleForAssignment} onChange={(e) => setSelectedRoleForAssignment(e.target.value as FieldRole)}>
                                <option value="">{t('packageFieldPropertiesPanel.placeholders.selectRole')}</option>
                                {availableRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {t(`packageFieldPropertiesPanel.roles.${role}`)}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isSignatureField ? t('packageFieldPropertiesPanel.messages.signatureRoleNote') : t('packageFieldPropertiesPanel.messages.nonSignatureRoleNote')}
                            </p>
                        </div>

                        {selectedRoleForAssignment === 'Signer' && (
                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">{t('packageFieldPropertiesPanel.labels.signatureMethods')}</label>
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                                            checked={signatureMethodsForNewSigner.includes('Email OTP')}
                                            onChange={() => handleNewSignerMethodChange('Email OTP')}
                                        />
                                        <FiMailTyped className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="dark:text-gray-200">{t('packageFieldPropertiesPanel.signatureMethods.emailOTP')}</span>
                                    </label>
                                    <label className="flex items-center text-sm gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                                            checked={signatureMethodsForNewSigner.includes('SMS OTP')}
                                            onChange={() => handleNewSignerMethodChange('SMS OTP')}
                                        />
                                        <FiSmartphoneTyped className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <span className="dark:text-gray-200">{t('packageFieldPropertiesPanel.signatureMethods.smsOTP')}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleAddAssignment}
                            disabled={!selectedContactForAssignment || !selectedRoleForAssignment || (isSignatureField && hasSignerAssigned)}
                            className="btn btn-sm btn-outline-success gap-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiPlusCircleTyped /> {t('packageFieldPropertiesPanel.buttons.addAssignment')}
                        </button>
                    </div>

                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                        <p className="text-sm font-semibold mb-2">{t('packageFieldPropertiesPanel.labels.assignedUsers')}</p>
                        {field.assignedUsers && field.assignedUsers.length > 0 ? (
                            field.assignedUsers.map((assignment) => (
                                <div key={assignment.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium dark:text-white">
                                            {assignment.contactName}
                                            <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold text-xs">({t(`packageFieldPropertiesPanel.roles.${assignment.role}`)})</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title={t('packageFieldPropertiesPanel.titles.removeAssignment')}
                                        >
                                            <FiXCircleTyped />
                                        </button>
                                    </div>

                                    {assignment.role === 'Signer' && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">{t('packageFieldPropertiesPanel.labels.allowedMethods')}</label>
                                            <div className="space-y-2">
                                                <label className="flex items-center text-sm gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                                                        checked={assignment.signatureMethods?.includes('Email OTP')}
                                                        onChange={() => handleExistingUserMethodChange(assignment.id, 'Email OTP')}
                                                    />
                                                    <FiMailTyped className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="dark:text-gray-300">{t('packageFieldPropertiesPanel.signatureMethods.emailOTP')}</span>
                                                </label>
                                                <label className="flex items-center text-sm gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                                                        checked={assignment.signatureMethods?.includes('SMS OTP')}
                                                        onChange={() => handleExistingUserMethodChange(assignment.id, 'SMS OTP')}
                                                    />
                                                    <FiSmartphoneTyped className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="dark:text-gray-300">{t('packageFieldPropertiesPanel.signatureMethods.smsOTP')}</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">{t('packageFieldPropertiesPanel.messages.noUsersAssigned')}</p>
                        )}
                    </div>
                </div>
            </div>

            <AddEditContactModal
                isOpen={isAddContactModalOpen}
                onClose={() => setAddContactModalOpen(false)}
                onSaveSuccess={(newContact) => {
                    setSelectedContactForAssignment(newContact);
                    setAddContactModalOpen(false);
                }}
            />
        </>
    );
};

export default PackageFieldPropertiesPanel;
