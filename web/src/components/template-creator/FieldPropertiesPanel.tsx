import React, { useState, useEffect } from 'react';
import { DocumentField } from '../../store/slices/templateSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

interface FieldPropertiesPanelProps {
    field: DocumentField;
    onUpdate: (fieldId: string, updates: Partial<DocumentField>) => void;
}

const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({ field, onUpdate }) => {
    const { t } = useTranslation();

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
            label: Yup.string().required(t('fieldPropertiesPanel.errors.labelRequired')).min(1, t('fieldPropertiesPanel.errors.labelEmpty')),
            placeholder: Yup.string().max(200, t('fieldPropertiesPanel.errors.placeholderTooLong')),
            radioOptions: Yup.string().test('at-least-two-radio-options', t('fieldPropertiesPanel.errors.radioOptionsMin'), (value, context) => {
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
            dropdownOptions: Yup.string().test('at-least-one-dropdown-option', t('fieldPropertiesPanel.errors.dropdownOptionsMin'), (value, context) => {
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
                then: Yup.string().required(t('fieldPropertiesPanel.errors.groupIdRequired')),
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
                <label className="form-label text-gray-700">{t('fieldPropertiesPanel.fieldType')}</label>
                <input
                    type="text"
                    className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500 read-only"
                    value={t(`fieldPropertiesPanel.fieldTypes.${field.type}`)}
                    readOnly
                />
            </div>
            <div>
                <label htmlFor={`label-${field.id}`} className="form-label text-gray-700">
                    {t('fieldPropertiesPanel.label')}
                </label>
                <input
                    id={`label-${field.id}`}
                    name="label"
                    type="text"
                    className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    value={formik.values.label}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />
                {formik.touched.label && formik.errors.label ? <div className="text-red-500 mt-1 text-sm">{formik.errors.label}</div> : null}
            </div>
            {(field.type === 'text' || field.type === 'textarea') && (
                <div>
                    <label htmlFor={`placeholder-${field.id}`} className="form-label text-gray-700">
                        {t('fieldPropertiesPanel.placeholder')}
                    </label>
                    <input
                        id={`placeholder-${field.id}`}
                        name="placeholder"
                        type="text"
                        className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
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
                            {t('fieldPropertiesPanel.radioGroupId')}
                        </label>
                        <input
                            id={`group-id-${field.id}`}
                            name="groupId"
                            type="text"
                            className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            placeholder={t('fieldPropertiesPanel.radioGroupIdPlaceholder')}
                            value={formik.values.groupId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.groupId && formik.errors.groupId ? <div className="text-red-500 mt-1 text-sm">{formik.errors.groupId}</div> : null}
                        <p className="text-sm text-gray-500 mt-1">{t('fieldPropertiesPanel.radioGroupIdHint')}</p>
                    </div>
                    <div>
                        <label htmlFor={`radio-options-${field.id}`} className="form-label text-gray-700">
                            {t('fieldPropertiesPanel.radioOptions')}
                        </label>
                        <input
                            id={`radio-options-${field.id}`}
                            name="radioOptions"
                            type="text"
                            className="form-input dark:bg-gray-900 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            placeholder={t('fieldPropertiesPanel.radioOptionsPlaceholder')}
                            value={formik.values.radioOptions}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.radioOptions && formik.errors.radioOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.radioOptions}</div> : null}
                        <p className="text-sm text-gray-500 mt-1">{t('fieldPropertiesPanel.radioOptionsHint')}</p>
                    </div>
                </>
            )}
            {field.type === 'dropdown' && (
                <div>
                    <label htmlFor={`dropdown-options-${field.id}`} className="form-label text-gray-700">
                        {t('fieldPropertiesPanel.dropdownOptions')}
                    </label>
                    <input
                        id={`dropdown-options-${field.id}`}
                        name="dropdownOptions"
                        type="text"
                        className="form-input bg-gray-100 dark:bg-gray-900 border-gray-300 focus:ring-blue-500"
                        placeholder={t('fieldPropertiesPanel.dropdownOptionsPlaceholder')}
                        value={formik.values.dropdownOptions}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    {formik.touched.dropdownOptions && formik.errors.dropdownOptions ? <div className="text-red-500 mt-1 text-sm">{formik.errors.dropdownOptions}</div> : null}
                    <p className="text-sm text-gray-500 mt-1">{t('fieldPropertiesPanel.dropdownOptionsHint')}</p>
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
                    {t('fieldPropertiesPanel.required')}
                </label>
            </div>
        </div>
    );
};

export default FieldPropertiesPanel;
