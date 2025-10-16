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
    contactData: Omit<ReassignFormData, 'reason'>;
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
            return response.data.data;
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
        const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/reject`, { reason });
        return response.data.data;
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
        return response.data;
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
        return response.data.message;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to reassign document.');
    }
});

/**
 * Downloads the package PDF. This thunk only manages loading state.
 * The actual blob handling is done in the component to avoid storing
 * non-serializable data in Redux.
 */
export const downloadPackage = createAsyncThunk<void, FetchParams>('participant/downloadPackage', async ({ packageId, participantId }, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/packages/participant/${packageId}/${participantId}/download`, {
            responseType: 'blob',
        });

        // Extract filename from the Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'document.pdf';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length > 1) {
                fileName = fileNameMatch[1];
            }
        }

        // Trigger download directly in the thunk
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Return void - no data stored in Redux
        return;
    } catch (error: any) {
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
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to add the new receiver.');
    }
});
