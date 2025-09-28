import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { ParticipantPackageView, ReassignFormData, ReassignmentContact } from '../slices/participantSlice';

interface FetchParams {
    packageId: string;
    participantId: string;
}

interface RejectParams {
    packageId: string;
    participantId: string;
    reason: string;
}

interface ReassignActionParams {
    packageId: string;
    participantId: string;
    newContactId: string;
    reason: string;
}

interface CreateContactParams {
    packageId: string;
    participantId: string;
    contactData: Omit<ReassignFormData, 'reason'>; // Send everything except the reason
}

interface DownloadPayload {
    blob: Blob;
    fileName: string;
}

interface AddReceiverParams {
    packageId: string;
    participantId: string;
    newContactId: string;
}

/**
 * Fetches the publicly accessible package data for a specific participant.
 */
export const fetchPackageForParticipant = createAsyncThunk<ParticipantPackageView, FetchParams>('participant/fetchPackage', async ({ packageId, participantId }, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/packages/participant/${packageId}/${participantId}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to load document.');
    }
});

export const submitParticipantFields = createAsyncThunk(
    'participant/submitFields',
    async ({ packageId, participantId, fieldValues }: { packageId: string; participantId: string; fieldValues: { [key: string]: any } }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/submit-fields`, { fieldValues });
            return response.data.data; // Expects { message, package }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to submit your changes.');
        }
    }
);

/**
 * Rejects a package on behalf of the participant.
 */
export const rejectPackage = createAsyncThunk('participant/rejectPackage', async ({ packageId, participantId, reason }: RejectParams, { rejectWithValue }) => {
    try {
        // The second argument to api.post is the request body.
        const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/reject`, { reason });
        return response.data.data; // Expects { message, package }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to reject the document.');
    }
});

/**
 * Fetches the list of contacts available for reassignment.
 */
export const fetchReassignmentContacts = createAsyncThunk<ReassignmentContact[], FetchParams>('participant/fetchReassignmentContacts', async ({ packageId, participantId }, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/packages/participant/${packageId}/${participantId}/reassignment/contacts`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts.');
    }
});

/**
 * Creates a new contact associated with the package owner for reassignment.
 */
export const createContactForReassignment = createAsyncThunk('participant/createReassignmentContact', async ({ packageId, participantId, contactData }: CreateContactParams, { rejectWithValue }) => {
    try {
        const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/reassignment/register-contact`, contactData);
        return response.data; // Expects { success, message, data: { contact } }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create contact.');
    }
});

/**
 * Performs the final reassignment action.
 */
export const performReassignment = createAsyncThunk('participant/performReassignment', async ({ packageId, participantId, newContactId, reason }: ReassignActionParams, { rejectWithValue }) => {
    try {
        const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/reassignment/perform`, { newContactId, reason });
        return response.data.message; // Just need the success message
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to reassign document.');
    }
});

/**
 * Fetches the finalized/current state of the package PDF from the server.
 */
export const downloadPackage = createAsyncThunk<DownloadPayload, FetchParams>('participant/downloadPackage', async ({ packageId, participantId }, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/packages/participant/${packageId}/${participantId}/download`, {
            responseType: 'blob', // IMPORTANT: This tells Axios to handle the binary file data correctly
        });

        // Extract filename from the Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'document.pdf'; // a sensible default
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length > 1) {
                fileName = fileNameMatch[1];
            }
        }

        return { blob: response.data, fileName };
    } catch (error: any) {
        // Since the response might be a blob on error, we need a special way to read the error message
        if (error.response && error.response.data instanceof Blob) {
            const errorMessage = await error.response.data.text();
            const errorJson = JSON.parse(errorMessage);
            return rejectWithValue(errorJson.error || 'Failed to download the document.');
        }
        return rejectWithValue(error.response?.data?.error || 'Failed to download the document.');
    }
});

/**
 * Allows a participant to add a new receiver to the package.
 */
export const addReceiverByParticipant = createAsyncThunk('participant/addReceiver', async ({ packageId, participantId, newContactId }: AddReceiverParams, { rejectWithValue }) => {
    try {
        const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/add-receiver`, { newContactId });
        return response.data; // Expects { success, message, data: { receiver } }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to add the new receiver.');
    }
});
