import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { DocumentTemplate, DocumentField } from '../slices/templateSlice';
import { setCurrentTemplate } from '../slices/templateSlice';
import { DocumentPackage } from '../slices/packageSlice';
import { toast } from 'react-toastify';

export interface UploadDocumentResponse {
    attachment_uuid: string;
    originalFileName: string;
    fileUrl: string;
}

export interface SaveTemplatePayload {
    name: string;
    attachment_uuid: string;
    fileUrl: string;
    fields: DocumentField[];
}

export interface UpdateTemplatePayload {
    templateId: string;
    name?: string;
    fields?: DocumentField[];
}

export const uploadDocument = createAsyncThunk<UploadDocumentResponse, File>('templates/uploadDocument', async (file, { dispatch, rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/templates/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const data = response.data.data;
        const arrayBuffer = await file.arrayBuffer();

        dispatch(
            setCurrentTemplate({
                _id: undefined,
                name: file.name,
                attachment_uuid: data.attachment_uuid,
                fileUrl: data.fileUrl,
                fileData: arrayBuffer,
                fields: [],
            })
        );

        return {
            attachment_uuid: data.attachment_uuid,
            originalFileName: file.name,
            fileUrl: data.fileUrl,
        };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to upload document.');
    }
});

export const saveTemplate = createAsyncThunk<DocumentTemplate, SaveTemplatePayload>('templates/saveTemplate', async (templateData, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/templates', templateData);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to save template.');
    }
});

export const fetchTemplates = createAsyncThunk<DocumentTemplate[], void>('templates/fetchTemplates', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/templates');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates.');
    }
});

export const updateTemplate = createAsyncThunk<DocumentTemplate, UpdateTemplatePayload>('templates/updateTemplate', async ({ templateId, name, fields }, { rejectWithValue }) => {
    try {
        const response = await api.patch(`/api/templates/${templateId}`, { name, fields });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update template.');
    }
});

export const deleteTemplate = createAsyncThunk<{ message: string; templateId: string }, string>('templates/deleteTemplate', async (templateId, { rejectWithValue }) => {
    try {
        const response = await api.delete(`/api/templates/${templateId}`);
        return { message: response.data.message, templateId };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete template.');
    }
});

export const getTemplateById = createAsyncThunk<DocumentTemplate, string>('templates/getTemplateById', async (templateId, { dispatch, rejectWithValue }) => {
    try {
        const response = await api.get(`/api/templates/${templateId}`);
        const template = response.data.data;
        // console.log(template);
        dispatch(
            setCurrentTemplate({
                ...template,
                fileData: undefined, // fileData will be fetched in DocumentEditorStep
            })
        );
        return template;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch template.');
    }
});

export const saveOrUpdateTemplateFromPackage = createAsyncThunk<DocumentTemplate, DocumentPackage>('templates/saveOrUpdateFromPackage', async (packageData, { rejectWithValue }) => {
    try {
        // Strip package-specific data (like assigned users) to create a clean template payload
        const templateFields = packageData.fields.map(({ assignedUsers, ...rest }) => rest);

        // If the package was created from a template, update the existing template
        if (packageData.templateId) {
            const payload: UpdateTemplatePayload = {
                templateId: packageData.templateId,
                name: packageData.name,
                fields: templateFields,
            };
            const response = await api.patch(`/api/templates/${payload.templateId}`, payload);
            toast.success('Template updated successfully!');
            return response.data.data;
        }

        // Otherwise, create a new template
        else {
            const payload: SaveTemplatePayload = {
                name: packageData.name,
                attachment_uuid: packageData.attachment_uuid,
                fileUrl: packageData.fileUrl,
                fields: templateFields,
            };
            const response = await api.post('/api/templates', payload);
            toast.success('New template created successfully!');
            return response.data.data;
        }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to save template.');
    }
});
