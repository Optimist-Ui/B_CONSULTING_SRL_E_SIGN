import React, { useCallback, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PackageField, AssignedUser, FieldRole, SignatureMethod, assignUserToField, removeUserFromField } from '../../store/slices/packageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../store';
import SearchableContactDropdown from '../common/SearchableContactDropdown'; // A new reusable contact dropdown
import AddEditContactModal from '../common/AddEditContactModal';
import { Contact } from '../../store/slices/contactSlice';
import { nanoid } from '@reduxjs/toolkit';
import { FiXCircle, FiPlusCircle } from 'react-icons/fi';
import { ComponentType } from 'react';

const FiPlusCircleTyped = FiPlusCircle as ComponentType<{ className?: string }>;
const FiXCircleTyped = FiXCircle as ComponentType<{ className?: string }>;

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

    const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('Email OTP');

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

    // Handler for adding a new user assignment to the field
    const handleAddAssignment = useCallback(() => {
        if (selectedContactForAssignment && selectedRoleForAssignment) {
            const newUserAssignment: Omit<AssignedUser, 'id'> = {
                contactId: selectedContactForAssignment._id,
                contactName: `${selectedContactForAssignment.firstName} ${selectedContactForAssignment.lastName}`,
                contactEmail: selectedContactForAssignment.email,
                role: selectedRoleForAssignment,
                ...(selectedRoleForAssignment === 'Signer' && { signatureMethod }),
            };
            dispatch(assignUserToField({ fieldId: field.id, user: newUserAssignment }));
            setSelectedContactForAssignment(null);
            setSelectedRoleForAssignment('');
            setSignatureMethod('Email OTP'); // Reset to default
        }
    }, [selectedContactForAssignment, selectedRoleForAssignment, signatureMethod, field.id, dispatch]);

    // Handler for removing an assigned user from the field
    const handleRemoveAssignment = useCallback(
        (assignmentId: string) => {
            dispatch(removeUserFromField({ fieldId: field.id, assignmentId })); // Dispatch to package slice
        },
        [field.id, dispatch]
    );

    return (
        <>
            <div className="space-y-4">
                {/* Display Field Type (Read-only) */}
                <div>
                    <label className="form-label text-gray-700">Field Type:</label>
                    <input
                        type="text"
                        className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500 read-only"
                        value={field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                        readOnly
                    />
                </div>
                {/* Label Input */}
                <div>
                    <label htmlFor={`label-${field.id}`} className="form-label text-gray-700">
                        Label:
                    </label>
                    <input
                        id={`label-${field.id}`}
                        name="label"
                        type="text"
                        className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500"
                        value={formik.values.label}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    {formik.touched.label && formik.errors.label ? <div className="text-red-500 mt-1 text-sm">{formik.errors.label}</div> : null}
                </div>
                {/* Placeholder (for text/textarea fields) */}
                {(field.type === 'text' || field.type === 'textarea') && (
                    <div>
                        <label htmlFor={`placeholder-${field.id}`} className="form-label text-gray-700">
                            Placeholder:
                        </label>
                        <input
                            id={`placeholder-${field.id}`}
                            name="placeholder"
                            type="text"
                            className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500"
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
                            <label htmlFor={`group-id-${field.id}`} className="form-label text-gray-700">
                                Radio Group ID:
                            </label>
                            <input
                                id={`group-id-${field.id}`}
                                name="groupId"
                                type="text"
                                className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500"
                                placeholder="Unique ID for this radio group"
                                value={formik.values.groupId}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.groupId && formik.errors.groupId ? <div className="text-red-500 mt-1 text-sm">{formik.errors.groupId}</div> : null}
                            <p className="text-sm text-gray-500 mt-1">All radio buttons with the same Group ID act as a single choice set.</p>
                        </div>
                        <div>
                            <label htmlFor={`radio-options-${field.id}`} className="form-label text-gray-700">
                                Options (comma-separated):
                            </label>
                            <input
                                id={`radio-options-${field.id}`}
                                name="radioOptions"
                                type="text"
                                className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500"
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
                        <label htmlFor={`dropdown-options-${field.id}`} className="form-label text-gray-700">
                            Options (comma-separated):
                        </label>
                        <input
                            id={`dropdown-options-${field.id}`}
                            name="dropdownOptions"
                            type="text"
                            className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500"
                            placeholder="Option 1, Option 2"
                            value={formik.values.dropdownOptions}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.dropdownOptions && formik.errors.dropdownOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.dropdownOptions}</div> : null}
                        <p className="text-sm text-gray-500 mt-1">Enter at least one option for the dropdown.</p>
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
                    <label htmlFor={`required-${field.id}`} className="form-label mb-0 text-gray-700">
                        Required
                    </label>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Role Assignment Section */}
                <div>
                    <h4 className="font-semibold mb-3 text-gray-800">Assign Users to Field</h4>
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
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Signature Method:</label>
                                <select className="form-select w-full" value={signatureMethod} onChange={(e) => setSignatureMethod(e.target.value as SignatureMethod)}>
                                    <option value="Email OTP">Via Email OTP Code</option>
                                    <option value="SMS OTP">Via SMS OTP Code</option>
                                </select>
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

                    <div className="mt-4 border p-3 rounded-md bg-gray-50 max-h-48 overflow-y-auto">
                        <p className="text-sm font-semibold mb-2 text-gray-700">Assigned to "{field.label}" Field:</p>
                        {field.assignedUsers && field.assignedUsers.length > 0 ? (
                            <ul className="space-y-2">
                                {field.assignedUsers.map((assignment) => (
                                    <li key={assignment.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-sm border border-gray-200">
                                        <span className="font-medium text-gray-800">
                                            {assignment.contactName}
                                            <span className="ml-2 text-blue-600 font-semibold text-xs">({assignment.role})</span>
                                            <span className="block text-gray-500 text-xs truncate">{assignment.contactEmail}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors"
                                            title="Remove assignment"
                                        >
                                            <FiXCircleTyped />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 text-sm py-4">No users assigned to this field.</p>
                        )}
                    </div>
                </div>
            </div>

            <AddEditContactModal
                isOpen={isAddContactModalOpen}
                onClose={() => setAddContactModalOpen(false)}
                onSaveSuccess={(newContact) => {
                    // This is the key part!
                    // Automatically select the new contact in the dropdown
                    setSelectedContactForAssignment(newContact);

                    // The modal will close itself via its internal `onClose` call,
                    // but you can also call it here if needed.
                    setAddContactModalOpen(false);
                }}
            />
        </>
    );
};

export default PackageFieldPropertiesPanel;
