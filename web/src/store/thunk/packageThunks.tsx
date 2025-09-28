import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { DocumentPackage, PackageOptions } from '../slices/packageSlice';
import { uploadDocument as uploadTemplateDocument, getTemplateById as getTemplate } from './templateThunks';
import { IRootState } from '..';

// Interface for saving a package (used for both "Save as Draft" and "Save as Template")
interface SavePackagePayload {
    _id?: string;
    name: string;
    attachment_uuid: string;
    fileUrl: string;
    fields: DocumentPackage['fields'];
    receivers: DocumentPackage['receivers'];
    options: DocumentPackage['options'];
    templateId?: string;
    saveAsTemplate?: boolean;
    customMessage?: string;
    status?: DocumentPackage['status'];
}
// Interface for updating a package
interface UpdatePackagePayload {
    packageId: string;
    name?: string;
    fields?: DocumentPackage['fields'];
    receivers?: DocumentPackage['receivers'];
    options?: DocumentPackage['options'];
    status?: DocumentPackage['status'];
}

// Re-export template thunks for document upload and template fetching
export const uploadPackageDocument = createAsyncThunk<{ attachment_uuid: string; fileUrl: string }, File>('packages/uploadPackageDocument', async (file, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('api/packages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data; // { attachment_uuid, fileUrl }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to upload package document.');
    }
});

export const getTemplateForPackage = getTemplate;

/**
 * Creates a new package or updates an existing one. This is the primary thunk for saving work
 * from the package editor. It intelligently handles both POST (create) and PATCH (update) requests.
 * Validation for required field assignments is ONLY applied if the package status is 'Sent'.
 */
export const savePackage = createAsyncThunk<DocumentPackage, SavePackagePayload>('packages/savePackage', async (packageData, { getState, rejectWithValue }) => {
    try {
        if (packageData.status === 'Sent') {
            const unassignedRequiredFields = packageData.fields.filter((field) => field.required && (!field.assignedUsers || field.assignedUsers.length === 0));
            if (unassignedRequiredFields.length > 0) {
                const fieldLabels = unassignedRequiredFields.map((f) => f.label || f.type).join(', ');
                throw new Error(`Cannot send: Please assign users to required fields: ${fieldLabels}.`);
            }
        }

        const { packages } = (getState() as IRootState).packages;
        const isExistingInStore = packages.some((p) => p._id === packageData._id);

        const payload = { ...packageData };

        // Remove the 'saveAsTemplate' flag as it's a frontend-only concern
        delete payload.saveAsTemplate;

        if (isExistingInStore) {
            // If the package exists in our state, it's a real document. Update it via PATCH.
            const { _id, ...updatePayload } = payload;
            const response = await api.patch(`/api/packages/${_id}`, updatePayload);
            return response.data.data;
        } else {
            // If it's not in the state, it's a new document. Create it via POST.
            // We must remove the temporary client-side ID before sending.
            delete payload._id;
            const response = await api.post('/api/packages', payload);
            return response.data.data;
        }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to save package.');
    }
});

// Fetch all packages
export const fetchPackages = createAsyncThunk<DocumentPackage[], void>('packages/fetchPackages', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('api/packages');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch packages.');
    }
});

/**
 * Updates an existing package. Maintained for components outside the package editor.
 */
export const updatePackage = createAsyncThunk<DocumentPackage, UpdatePackagePayload>('packages/updatePackage', async (updateData, { rejectWithValue }) => {
    try {
        const { packageId, ...payload } = updateData;
        if (payload.status === 'Sent' && payload.fields) {
            const unassignedRequiredFields = payload.fields.filter((field) => field.required && (!field.assignedUsers || field.assignedUsers.length === 0));
            if (unassignedRequiredFields.length > 0) {
                const fieldLabels = unassignedRequiredFields.map((f) => f.label || f.type).join(', ');
                throw new Error(`Cannot update package: The following required fields are unassigned: ${fieldLabels}.`);
            }
        }
        const response = await api.patch(`/api/packages/${packageId}`, payload);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to update package.');
    }
});

/**
 * Fetches a single, complete package by its ID for the owner/initiator.
 */
export const fetchPackageForOwner = createAsyncThunk<DocumentPackage, string>('packages/fetchPackageForOwner', async (packageId, { rejectWithValue }) => {
    try {
        // This hits the authenticated, owner-only endpoint that returns the full package details.
        const response = await api.get(`/api/packages/${packageId}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch package details.');
    }
});

// Delete package
export const deletePackage = createAsyncThunk<{ message: string; packageId: string }, string>('packages/deletePackage', async (packageId, { rejectWithValue }) => {
    try {
        const response = await api.delete(`api/packages/${packageId}`);
        return { message: response.data.message, packageId };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete package.');
    }
});
