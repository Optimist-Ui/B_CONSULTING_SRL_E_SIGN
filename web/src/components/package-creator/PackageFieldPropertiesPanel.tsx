import React, { useCallback, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PackageField, AssignedUser, FieldRole, SignatureMethod, assignUserToField, removeUserFromField, ConcreteSignatureMethod } from '../../store/slices/packageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../store';
import SearchableContactDropdown from '../common/SearchableContactDropdown'; // A new reusable contact dropdown
import AddEditContactModal from '../common/AddEditContactModal';
import { Contact } from '../../store/slices/contactSlice';
import { nanoid } from '@reduxjs/toolkit';
import { FiXCircle, FiPlusCircle, FiMail, FiSmartphone } from 'react-icons/fi';
import { ComponentType } from 'react';
import { toast } from 'react-toastify';

const FiPlusCircleTyped = FiPlusCircle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;
const FiMailTyped = FiMail as ComponentType<{ className?: string }>;
const FiSmartphoneTyped = FiSmartphone as ComponentType<{ className?: string }>;

interface PackageFieldPropertiesPanelProps {
    field: PackageField;
    onUpdate: (fieldId: string, updates: Partial<PackageField>) => void;
}

// Define the available roles for assignment dropdown
const FieldRoleOptions: FieldRole[] = ['Signer', 'FormFiller', 'Approver'];

const PackageFieldPropertiesPanel: React.FC<PackageFieldPropertiesPanelProps> = ({ field, onUpdate }) => {
    const dispatch = useDispatch<AppDispatch>();
    // Get all contacts from Redux state for the searchable dropdown
    const { contacts } = useSelector((state: IRootState) => state.contacts);

    // State for the new assignment selection
    const [selectedContactForAssignment, setSelectedContactForAssignment] = useState<Contact | null>(null);
    const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<FieldRole | ''>('');
    const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);

    const [signatureMethodsForNewSigner, setSignatureMethodsForNewSigner] = useState<ConcreteSignatureMethod[]>(['Email OTP']);

    // Formik for managing general field properties (label, required, placeholder, options)
    const formik = useFormik({
        initialValues: {
            label: field.label,
            required: field.required,
            placeholder: field.type === 'text' || field.type === 'textarea' ? field.placeholder || '' : '',
            // Join options by comma for string input
            radioOptions: field.type === 'radio' && field.options ? field.options.map((opt) => opt.label).join(',') : '',
            dropdownOptions: field.type === 'dropdown' && field.options ? field.options.map((opt) => opt.label).join(',') : '',
            groupId: field.type === 'radio' ? field.groupId || '' : '',
        },
        validationSchema: Yup.object({
            label: Yup.string().required('Label is required').min(1, 'Label cannot be empty'),
            placeholder: Yup.string().max(200, 'Placeholder too long'),
            // Custom validation for radio options (at least two)
            radioOptions: Yup.string().test('at-least-two-radio-options', 'At least two comma-separated options are required for Radio Group', (value) => {
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
            // Custom validation for dropdown options (at least one)
            dropdownOptions: Yup.string().test('at-least-one-dropdown-option', 'At least one option is required for Dropdown', (value) => {
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
            // Group ID is required for radio buttons
            groupId: Yup.string().when('type', {
                is: () => field.type === 'radio',
                then: Yup.string().required('Group ID is required for radio buttons'),
                otherwise: Yup.string(),
            }),
        }),
        enableReinitialize: true, // Re-initialize formik values when `field` prop changes
        onSubmit: (values) => {
            // onSubmit in a debounce setting usually just means local update.
            // Actual Redux update happens in the useEffect hook with debounce.
        },
    });

    // Debounced update to Redux on form changes to prevent excessive dispatches
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only update if formik state is dirty (has changes) AND valid
            if (formik.dirty && formik.isValid) {
                let updatedFieldData: Partial<PackageField> = {
                    label: formik.values.label,
                    required: formik.values.required,
                };

                // Update type-specific properties
                if (field.type === 'text' || field.type === 'textarea') {
                    updatedFieldData.placeholder = formik.values.placeholder;
                } else if (field.type === 'radio') {
                    updatedFieldData.groupId = formik.values.groupId;
                    const optionsArray = formik.values.radioOptions
                        .split(',')
                        .filter((o) => o.trim() !== '')
                        .map((o) => o.trim());
                    if (optionsArray.length >= 2) {
                        // Only set options if valid
                        updatedFieldData.options = optionsArray.map((label) => ({ value: nanoid(5), label })); // Assign unique value to options
                    } else if (formik.values.radioOptions.trim() === '') {
                        updatedFieldData.options = []; // Clear options if input is empty
                    }
                } else if (field.type === 'dropdown') {
                    const optionsArray = formik.values.dropdownOptions
                        .split(',')
                        .filter((o) => o.trim() !== '')
                        .map((o) => o.trim());
                    if (optionsArray.length >= 1) {
                        // Only set options if valid
                        updatedFieldData.options = optionsArray.map((label) => ({ value: nanoid(5), label })); // Assign unique value to options
                    } else if (formik.values.dropdownOptions.trim() === '') {
                        updatedFieldData.options = []; // Clear options if input is empty
                    }
                }
                // Dispatch update to the current package field in Redux
                onUpdate(field.id, updatedFieldData);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId); // Cleanup timeout on unmount or re-render
    }, [formik.values, field.type, field.id, onUpdate, formik.dirty, formik.isValid, formik.touched.radioOptions, formik.touched.dropdownOptions, formik.touched.label]); // Re-run on form value/dirty state change

    // --- NEW: Handler for the checkboxes for a NEW assignment ---
    const handleNewSignerMethodChange = (method: ConcreteSignatureMethod) => {
        setSignatureMethodsForNewSigner((prev) => {
            let newMethods: ConcreteSignatureMethod[]; // This is the fix for the error on line 189
            if (prev.includes(method)) {
                newMethods = prev.filter((m) => m !== method); // Remove method
            } else {
                newMethods = [...prev, method]; // Add method
            }
            // Ensure at least one method is always selected
            if (newMethods.length === 0) {
                toast.error('A signer must have at least one authentication method.');
                return prev; // Return original state
            }
            return newMethods;
        });
    };

    // Handler for adding a new user assignment to the field
    const handleAddAssignment = useCallback(() => {
        if (selectedContactForAssignment && selectedRoleForAssignment) {
            const newUserAssignment: Omit<AssignedUser, 'id'> = {
                contactId: selectedContactForAssignment._id,
                contactName: `${selectedContactForAssignment.firstName} ${selectedContactForAssignment.lastName}`,
                contactEmail: selectedContactForAssignment.email,
                role: selectedRoleForAssignment,
                // Use the array if the role is Signer
                ...(selectedRoleForAssignment === 'Signer' && { signatureMethods: signatureMethodsForNewSigner }),
            };
            dispatch(assignUserToField({ fieldId: field.id, user: newUserAssignment }));

            // Reset form state
            setSelectedContactForAssignment(null);
            setSelectedRoleForAssignment('');
            setSignatureMethodsForNewSigner(['Email OTP']); // Reset to default
        }
    }, [selectedContactForAssignment, selectedRoleForAssignment, signatureMethodsForNewSigner, field.id, dispatch]);

    // Handler for removing an assigned user from the field
    const handleRemoveAssignment = useCallback(
        (assignmentId: string) => {
            dispatch(removeUserFromField({ fieldId: field.id, assignmentId })); // Dispatch to package slice
        },
        [field.id, dispatch]
    );
    const handleExistingUserMethodChange = (assignmentId: string, method: ConcreteSignatureMethod) => {
        const userToUpdate = field.assignedUsers?.find((u) => u.id === assignmentId);
        if (!userToUpdate) return;

        const currentMethods = userToUpdate.signatureMethods || [];
        let newMethods: ConcreteSignatureMethod[]; // This is the fix

        if (currentMethods.includes(method)) {
            newMethods = currentMethods.filter((m) => m !== method);
        } else {
            newMethods = [...currentMethods, method];
        }

        if (newMethods.length === 0) {
            toast.error('A signer must have at least one authentication method.');
            return;
        }

        const updatedUsers = field.assignedUsers?.map((user) => (user.id === assignmentId ? { ...user, signatureMethods: newMethods } : user));

        onUpdate(field.id, { assignedUsers: updatedUsers });
    };

    return (
        <>
            <div className="space-y-4 dark:bg-gray-900 ">
                {/* Display Field Type (Read-only) */}
                <div>
                    <label className="form-label">Field Type:</label>
                    <input
                        type="text"
                        className="form-input dark:bg-gray-900  bg-gray-100 border-gray-300 focus:ring-blue-500 read-only"
                        value={field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                        readOnly
                    />
                </div>
                {/* Label Input */}
                <div>
                    <label htmlFor={`label-${field.id}`} className="form-label">
                        Label:
                    </label>
                    <input
                        id={`label-${field.id}`}
                        name="label"
                        type="text"
                        className="form-input dark:bg-gray-900  bg-gray-100 border-gray-300 focus:ring-blue-500"
                        value={formik.values.label}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    {formik.touched.label && formik.errors.label ? <div className="text-red-500 mt-1 text-sm">{formik.errors.label}</div> : null}
                </div>
                {/* Placeholder (for text/textarea fields) */}
                {(field.type === 'text' || field.type === 'textarea') && (
                    <div>
                        <label htmlFor={`placeholder-${field.id}`} className="form-label">
                            Placeholder:
                        </label>
                        <input
                            id={`placeholder-${field.id}`}
                            name="placeholder"
                            type="text"
                            className="form-input dark:bg-gray-900  bg-gray-100 border-gray-300 focus:ring-blue-500"
                            value={formik.values.placeholder}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.placeholder && formik.errors.placeholder ? <div className="text-red-500 mt-1 text-sm">{formik.errors.placeholder}</div> : null}
                    </div>
                )}
                {/* Radio Button Options and Group ID */}
                {field.type === 'radio' && (
                    <>
                        <div>
                            <label htmlFor={`group-id-${field.id}`} className="form-label ">
                                Radio Group ID:
                            </label>
                            <input
                                id={`group-id-${field.id}`}
                                name="groupId"
                                type="text"
                                className="form-input dark:bg-gray-900  bg-gray-100 border-gray-300 focus:ring-blue-500"
                                placeholder="Unique ID for this radio group"
                                value={formik.values.groupId}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.groupId && formik.errors.groupId ? <div className="text-red-500 mt-1 text-sm">{formik.errors.groupId}</div> : null}
                            <p className="text-sm text-gray-500 mt-1">All radio buttons with the same Group ID act as a single choice set.</p>
                        </div>
                        <div>
                            <label htmlFor={`radio-options-${field.id}`} className="form-label ">
                                Options (comma-separated):
                            </label>
                            <input
                                id={`radio-options-${field.id}`}
                                name="radioOptions"
                                type="text"
                                className="form-input dark:bg-gray-900  bg-gray-100 border-gray-300 focus:ring-blue-500"
                                placeholder="Option 1, Option 2"
                                value={formik.values.radioOptions}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.radioOptions && formik.errors.radioOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.radioOptions}</div> : null}
                            <p className="text-sm text-gray-500 mt-1">Enter at least two options for a meaningful radio group.</p>
                        </div>
                    </>
                )}
                {/* Dropdown Options */}
                {field.type === 'dropdown' && (
                    <div>
                        <label htmlFor={`dropdown-options-${field.id}`} className="form-label ">
                            Options (comma-separated):
                        </label>
                        <input
                            id={`dropdown-options-${field.id}`}
                            name="dropdownOptions"
                            type="text"
                            className="form-input dark:bg-gray-900   border-gray-300 focus:ring-blue-500"
                            placeholder="Option 1, Option 2"
                            value={formik.values.dropdownOptions}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.dropdownOptions && formik.errors.dropdownOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.dropdownOptions}</div> : null}
                        <p className="text-sm  mt-1">Enter at least one option for the dropdown.</p>
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
                        Required
                    </label>
                </div>

                <hr className="my-6 dark:bg-gray-900  border-gray-200" />

                {/* Role Assignment Section */}
                <div>
                    <h4 className="font-semibold mb-3">Assign Users to Field</h4>
                    <div className="flex flex-col gap-3 mb-4">
                        <SearchableContactDropdown // Reusable contact selection
                            contacts={contacts}
                            selectedContact={selectedContactForAssignment}
                            onSelectContact={setSelectedContactForAssignment}
                            onAddNewContact={() => setAddContactModalOpen(true)}
                        />
                        <select className="form-select w-full" value={selectedRoleForAssignment} onChange={(e) => setSelectedRoleForAssignment(e.target.value as FieldRole)}>
                            <option value="">-- Select Role --</option>
                            {FieldRoleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                        {/* NEW: Conditional Signature Method Dropdown */}
                        {selectedRoleForAssignment === 'Signer' && (
                            <div className="p-2 border rounded-md bg-white">
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Signature Method(s):</label>
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            checked={signatureMethodsForNewSigner.includes('Email OTP')}
                                            onChange={() => handleNewSignerMethodChange('Email OTP')}
                                        />
                                        <span>Via Email OTP</span>
                                    </label>
                                    <label className="flex items-center text-sm gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            checked={signatureMethodsForNewSigner.includes('SMS OTP')}
                                            onChange={() => handleNewSignerMethodChange('SMS OTP')}
                                        />
                                        <span>Via SMS OTP</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleAddAssignment}
                            disabled={!selectedContactForAssignment || !selectedRoleForAssignment}
                            className="btn btn-sm btn-outline-success gap-2 flex items-center justify-center"
                        >
                            <FiPlusCircleTyped /> Add Assignment
                        </button>
                    </div>

                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                        <p className="text-sm font-semibold mb-2">Assigned Users:</p>
                        {field.assignedUsers && field.assignedUsers.length > 0 ? (
                            field.assignedUsers.map((assignment) => (
                                <div key={assignment.id} className="bg-white p-3 rounded shadow-sm border">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium">
                                            {assignment.contactName}
                                            <span className="ml-2 text-blue-600 font-semibold text-xs">({assignment.role})</span>
                                        </span>
                                        <button type="button" onClick={() => handleRemoveAssignment(assignment.id)} className="text-red-500 hover:text-red-700 p-1" title="Remove assignment">
                                            <FiXCircleTyped />
                                        </button>
                                    </div>

                                    {/* --- MODIFICATION: Edit Existing User's Methods --- */}
                                    {assignment.role === 'Signer' && (
                                        <div className="mt-2 pt-2 border-t">
                                            <label className="text-xs font-semibold text-gray-600 block mb-2">Allowed Methods:</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center text-sm gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox"
                                                        checked={assignment.signatureMethods?.includes('Email OTP')}
                                                        onChange={() => handleExistingUserMethodChange(assignment.id, 'Email OTP')}
                                                    />
                                                    <span>Email</span>
                                                </label>
                                                <label className="flex items-center text-sm gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox"
                                                        checked={assignment.signatureMethods?.includes('SMS OTP')}
                                                        onChange={() => handleExistingUserMethodChange(assignment.id, 'SMS OTP')}
                                                    />
                                                    <span>SMS</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 text-sm py-4">No users assigned.</p>
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
