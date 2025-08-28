import React from 'react';
import { DocumentField } from '../../store/slices/templateSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface FieldPropertiesPanelProps {
    field: DocumentField;
    onUpdate: (fieldId: string, updates: Partial<DocumentField>) => void;
}

const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({ field, onUpdate }) => {
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
            label: Yup.string().required('Label is required').min(1, 'Label cannot be empty'),
            placeholder: Yup.string().max(200, 'Placeholder too long'),
            radioOptions: Yup.string().test('at-least-two-radio-options', 'At least two comma-separated options are required for Radio Group', (value, context) => {
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
            dropdownOptions: Yup.string().test('at-least-one-dropdown-option', 'At least one option is required for Dropdown', (value, context) => {
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
                then: Yup.string().required('Group ID is required for radio buttons'),
                otherwise: Yup.string(),
            }),
        }),
        enableReinitialize: true,
        onSubmit: (values) => {
            let updatedFieldData: Partial<DocumentField> = {
                label: values.label,
                required: values.required,
            };

            if (field.type === 'text' || field.type === 'textarea') {
                updatedFieldData.placeholder = values.placeholder;
            } else if (field.type === 'radio') {
                updatedFieldData.groupId = values.groupId;
                updatedFieldData.options = values.radioOptions
                    .split(',')
                    .filter((o) => o.trim() !== '')
                    .map((label, index) => ({ value: `option${index + 1}`, label: label.trim() }));
            } else if (field.type === 'dropdown') {
                updatedFieldData.options = values.dropdownOptions
                    .split(',')
                    .filter((o) => o.trim() !== '')
                    .map((label, index) => ({ value: `opt${index + 1}`, label: label.trim() }));
            }
            onUpdate(field.id, updatedFieldData);
        },
    });

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formik.dirty && formik.isValid) {
                let updatedFieldData: Partial<DocumentField> = {
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
                        updatedFieldData.options = optionsArray.map((label, index) => ({ value: `option${index + 1}`, label }));
                    } else if (formik.values.radioOptions.trim() === '') {
                        updatedFieldData.options = [];
                    }
                } else if (field.type === 'dropdown') {
                    const optionsArray = formik.values.dropdownOptions
                        .split(',')
                        .filter((o) => o.trim() !== '')
                        .map((o) => o.trim());
                    if (optionsArray.length >= 1) {
                        updatedFieldData.options = optionsArray.map((label, index) => ({ value: `opt${index + 1}`, label }));
                    } else if (formik.values.dropdownOptions.trim() === '') {
                        updatedFieldData.options = [];
                    }
                }
                onUpdate(field.id, updatedFieldData);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [formik.values, field.type, field.id, onUpdate, formik.dirty, formik.isValid]);

    return (
        <div className="space-y-4">
            <div>
                <label className="form-label text-gray-700">Field Type:</label>
                <input
                    type="text"
                    className="form-input bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500 read-only"
                    value={field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                    readOnly
                />
            </div>
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
        </div>
    );
};

export default FieldPropertiesPanel;
