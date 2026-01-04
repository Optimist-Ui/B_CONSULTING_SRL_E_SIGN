// src/thunks/documentThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { IRootState } from '../index';
import api from '../../utils/api';
import { Document, DocumentFilters, DocumentPagination } from '../slices/documentSlice';

// API Response Types
interface FetchDocumentsResponse {
    success: boolean;
    message: string;
    data: {
        documents: Document[];
        pagination: DocumentPagination;
    };
}

interface DocumentActionResponse {
    success: boolean;
    message: string;
    data?: Document;
}

// Fetch Documents with Filters, Pagination, and Sorting
export const fetchDocuments = createAsyncThunk<
    { documents: Document[]; pagination: DocumentPagination },
    { filters?: Partial<DocumentFilters>; page?: number; limit?: number; sortKey?: keyof Document; sortDirection?: 'asc' | 'desc' } | void
>('documents/fetchDocuments', async (params = {}, { getState, rejectWithValue }) => {
    try {
        const state = getState() as IRootState;
        const { filters: currentFilters, pagination: currentPagination, sortConfig } = state.documents;

        // Merge current state with provided params
        const queryParams = new URLSearchParams();

        // Apply filters
        const filters = { ...currentFilters, ...(params && 'filters' in params ? params.filters : {}) };
        if (filters.status && filters.status !== 'All') {
            queryParams.append('status', filters.status);
        }
        if (filters.name?.trim()) {
            queryParams.append('name', filters.name.trim());
        }
        if (filters.dateRange) {
            queryParams.append('dateFrom', filters.dateRange.from);
            queryParams.append('dateTo', filters.dateRange.to);
        }

        // Apply pagination
        const page = params && 'page' in params ? params.page || currentPagination.currentPage : currentPagination.currentPage;
        const limit = params && 'limit' in params ? params.limit || currentPagination.limit : currentPagination.limit;
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        // Apply sorting
        const sortKey = params && 'sortKey' in params ? params.sortKey || sortConfig.key || 'addedOn' : sortConfig.key || 'addedOn';
        const sortDirection = params && 'sortDirection' in params ? params.sortDirection || sortConfig.direction : sortConfig.direction;
        queryParams.append('sortKey', sortKey);
        queryParams.append('sortDirection', sortDirection);

        const response = await api.get<FetchDocumentsResponse>(`/api/packages?${queryParams.toString()}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch documents');
        }

        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch documents');
    }
});

// Get Single Document by ID
export const getDocumentById = createAsyncThunk<Document, string>('documents/getDocumentById', async (documentId, { rejectWithValue }) => {
    try {
        const response = await api.get<DocumentActionResponse>(`/api/packages/${documentId}`);

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message || 'Document not found');
        }

        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch document');
    }
});

// Document Actions
export const downloadDocument = createAsyncThunk<string, string>('documents/downloadDocument', async (documentId, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/packages/${documentId}/download`, {
            responseType: 'blob',
        });

        // Create blob URL for download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);

        return url;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to download document');
    }
});

export const sendReminder = createAsyncThunk<string, string>('documents/sendReminder', async (documentId, { rejectWithValue }) => {
    try {
        const response = await api.post<DocumentActionResponse>(`/api/packages/${documentId}/reminder`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to send reminder');
        }

        return response.data.message || 'Reminder sent successfully';
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to send reminder');
    }
});

export const viewDocumentHistory = createAsyncThunk<any[], string>('documents/viewDocumentHistory', async (documentId, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/packages/${documentId}/history`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch document history');
        }

        return response.data.data || [];
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch document history');
    }
});

export const reassignDocument = createAsyncThunk<Document, { documentId: string; reassignmentData: any }>(
    'documents/reassignDocument',
    async ({ documentId, reassignmentData }, { rejectWithValue }) => {
        try {
            const response = await api.patch<DocumentActionResponse>(`/api/packages/${documentId}/reassign`, reassignmentData);

            if (!response.data.success || !response.data.data) {
                throw new Error(response.data.message || 'Failed to reassign document');
            }

            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || error.message || 'Failed to reassign document');
        }
    }
);

export const skipDocumentStep = createAsyncThunk<Document, string>('documents/skipDocumentStep', async (documentId, { rejectWithValue }) => {
    try {
        const response = await api.patch<DocumentActionResponse>(`/api/packages/${documentId}/skip`);

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message || 'Failed to skip document step');
        }

        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to skip document step');
    }
});

export const revokeDocument = createAsyncThunk<{ documentId: string; status: 'Revoked' }, { documentId: string; reason?: string }>(
    'documents/revokeDocument',
    async ({ documentId, reason }, { rejectWithValue }) => {
        try {
            const response = await api.patch<{ success: boolean; message: string; data: { id: string; status: 'Revoked' } }>(`/api/packages/${documentId}/revoke`, { reason });
            if (!response.data.success) {
                throw new Error(response.data.message);
            }

            // ✅ Correct: We return an object that matches the return type above.
            return { documentId, status: response.data.data.status };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to revoke document');
        }
    }
);

// Bulk Actions
export const bulkUpdateDocuments = createAsyncThunk<Document[], { documentIds: string[]; updates: Partial<Document> }>(
    'documents/bulkUpdateDocuments',
    async ({ documentIds, updates }, { rejectWithValue }) => {
        try {
            const response = await api.patch('/api/packages/bulk-update', {
                documentIds,
                updates,
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update documents');
            }

            return response.data.data || [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update documents');
        }
    }
);

// 🆕 NEW: Fetch Received Documents (documents where user is a participant)
export const fetchReceivedDocuments = createAsyncThunk<
    { documents: Document[]; pagination: DocumentPagination },
    { filters?: Partial<DocumentFilters>; page?: number; limit?: number; sortKey?: keyof Document; sortDirection?: 'asc' | 'desc' } | void
>('documents/fetchReceivedDocuments', async (params = {}, { getState, rejectWithValue }) => {
    try {
        const state = getState() as IRootState;
        const { filters: currentFilters, pagination: currentPagination, sortConfig } = state.receivedDocuments;

        // Merge current state with provided params
        const queryParams = new URLSearchParams();

        // Apply filters
        const filters = { ...currentFilters, ...(params && 'filters' in params ? params.filters : {}) };
        if (filters.status && filters.status !== 'All') {
            queryParams.append('status', filters.status);
        }
        if (filters.name?.trim()) {
            queryParams.append('name', filters.name.trim());
        }
        if (filters.dateRange) {
            queryParams.append('dateFrom', filters.dateRange.from);
            queryParams.append('dateTo', filters.dateRange.to);
        }

        // Apply pagination
        const page = params && 'page' in params ? params.page || currentPagination.currentPage : currentPagination.currentPage;
        const limit = params && 'limit' in params ? params.limit || currentPagination.limit : currentPagination.limit;
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        // Apply sorting
        const sortKey = params && 'sortKey' in params ? params.sortKey || sortConfig.key || 'addedOn' : sortConfig.key || 'addedOn';
        const sortDirection = params && 'sortDirection' in params ? params.sortDirection || sortConfig.direction : sortConfig.direction;
        queryParams.append('sortKey', sortKey);
        queryParams.append('sortDirection', sortDirection);

        // 🔥 IMPORTANT: Call the new /api/packages/received endpoint
        const response = await api.get<FetchDocumentsResponse>(`/api/packages/received?${queryParams.toString()}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch received documents');
        }

        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch received documents');
    }
});
