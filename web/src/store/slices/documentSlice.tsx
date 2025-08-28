// src/slices/documentSlice.ts (Updated to include updateDocumentFromSocket reducer)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchDocuments, getDocumentById, downloadDocument, sendReminder, reassignDocument, skipDocumentStep, revokeDocument, bulkUpdateDocuments } from '../thunk/documentThunks';

// Type Definitions based on your API response
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export interface ParticipantDetail {
    user: User;
    status: 'Completed' | 'In Progress' | 'Waiting' | 'Not Sent' | 'Rejected';
    lastUpdated: string;
}

export interface Document {
    id: string;
    name: string;
    status: 'Draft' | 'Pending' | 'Finished' | 'Rejected' | 'Expired' | 'Revoked';
    addedOn: string;
    initiator: User;
    formFillers: ParticipantDetail[];
    approvers: ParticipantDetail[];
    signers: ParticipantDetail[];
    receivers: ParticipantDetail[];
    participantsSummary: string[];
}

export interface DocumentFilters {
    status: string;
    name: string;
    dateRange?: {
        from: string;
        to: string;
    };
}

export interface DocumentPagination {
    currentPage: number;
    totalPages: number;
    totalDocuments: number;
    limit: number;
}

export interface DocumentState {
    documents: Document[];
    filteredDocuments: Document[];
    selectedDocument: Document | null;
    loading: boolean;
    error: string | null;
    filters: DocumentFilters;
    pagination: DocumentPagination;
    expandedRows: Set<string>;
    searchTerm: string;
    selectedStatus: string;
    sortConfig: {
        key: keyof Document | null;
        direction: 'asc' | 'desc';
    };
}

const initialFilters: DocumentFilters = {
    status: 'All',
    name: '',
};

const initialPagination: DocumentPagination = {
    currentPage: 1,
    totalPages: 1,
    totalDocuments: 0,
    limit: 10,
};

const initialState: DocumentState = {
    documents: [],
    filteredDocuments: [],
    selectedDocument: null,
    loading: false,
    error: null,
    filters: initialFilters,
    pagination: initialPagination,
    expandedRows: new Set(),
    searchTerm: '',
    selectedStatus: 'All',
    sortConfig: {
        key: 'addedOn',
        direction: 'desc',
    },
};

const documentSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        // Loading States
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },

        // Document Management
        setDocuments: (state, action: PayloadAction<Document[]>) => {
            state.documents = action.payload;
            state.filteredDocuments = action.payload;
            state.loading = false;
            state.error = null;
        },

        addDocument: (state, action: PayloadAction<Document>) => {
            state.documents.unshift(action.payload);
            documentSlice.caseReducers.applyFilters(state);
        },

        updateDocument: (state, action: PayloadAction<Document>) => {
            const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
            if (index !== -1) {
                state.documents[index] = action.payload;
                documentSlice.caseReducers.applyFilters(state);
            }
        },

        updateDocumentFromSocket: (state, action: PayloadAction<Document>) => {
            const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
            if (index !== -1) {
                state.documents[index] = action.payload;
                documentSlice.caseReducers.applyFilters(state);
            }
            if (state.selectedDocument?.id === action.payload.id) {
                state.selectedDocument = action.payload;
            }
        },

        removeDocument: (state, action: PayloadAction<string>) => {
            state.documents = state.documents.filter((doc) => doc.id !== action.payload);
            state.filteredDocuments = state.filteredDocuments.filter((doc) => doc.id !== action.payload);
            if (state.selectedDocument?.id === action.payload) {
                state.selectedDocument = null;
            }
        },

        setSelectedDocument: (state, action: PayloadAction<Document | null>) => {
            state.selectedDocument = action.payload;
        },

        // Filtering & Search
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
            state.filters.name = action.payload;
            documentSlice.caseReducers.applyFilters(state);
        },

        setSelectedStatus: (state, action: PayloadAction<string>) => {
            state.selectedStatus = action.payload;
            state.filters.status = action.payload;
            documentSlice.caseReducers.applyFilters(state);
        },

        setFilters: (state, action: PayloadAction<Partial<DocumentFilters>>) => {
            state.filters = { ...state.filters, ...action.payload };
            documentSlice.caseReducers.applyFilters(state);
        },

        applyFilters: (state) => {
            let filtered = [...state.documents];

            // Apply status filter
            if (state.filters.status !== 'All') {
                filtered = filtered.filter((doc) => doc.status === state.filters.status);
            }

            // Apply name search filter
            if (state.filters.name.trim()) {
                const searchTerm = state.filters.name.toLowerCase().trim();
                filtered = filtered.filter(
                    (doc) =>
                        doc.name.toLowerCase().includes(searchTerm) ||
                        doc.initiator.name.toLowerCase().includes(searchTerm) ||
                        doc.participantsSummary.some((participant) => participant.toLowerCase().includes(searchTerm))
                );
            }

            // Apply date range filter if provided
            if (state.filters.dateRange) {
                const { from, to } = state.filters.dateRange;
                filtered = filtered.filter((doc) => {
                    const docDate = new Date(doc.addedOn);
                    const fromDate = new Date(from);
                    const toDate = new Date(to);
                    return docDate >= fromDate && docDate <= toDate;
                });
            }

            // Apply sorting
            if (state.sortConfig.key) {
                filtered.sort((a, b) => {
                    const aValue = a[state.sortConfig.key!];
                    const bValue = b[state.sortConfig.key!];

                    let comparison = 0;
                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                        comparison = aValue.localeCompare(bValue);
                    } else {
                        comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                    }

                    return state.sortConfig.direction === 'desc' ? comparison * -1 : comparison;
                });
            }

            state.filteredDocuments = filtered;
        },

        // Sorting
        setSortConfig: (state, action: PayloadAction<{ key: keyof Document; direction: 'asc' | 'desc' }>) => {
            state.sortConfig = action.payload;
            documentSlice.caseReducers.applyFilters(state);
        },

        // Pagination
        setPagination: (state, action: PayloadAction<Partial<DocumentPagination>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },

        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.pagination.currentPage = action.payload;
        },

        setPageSize: (state, action: PayloadAction<number>) => {
            state.pagination.limit = action.payload;
            state.pagination.currentPage = 1; // Reset to first page when changing page size
        },

        // UI State Management
        toggleRowExpansion: (state, action: PayloadAction<string>) => {
            const newExpandedRows = new Set(state.expandedRows);
            if (newExpandedRows.has(action.payload)) {
                newExpandedRows.delete(action.payload);
            } else {
                newExpandedRows.add(action.payload);
            }
            state.expandedRows = newExpandedRows;
        },

        setExpandedRows: (state, action: PayloadAction<string[]>) => {
            state.expandedRows = new Set(action.payload);
        },

        clearExpandedRows: (state) => {
            state.expandedRows = new Set();
        },

        // Reset State
        resetDocumentState: (state) => {
            Object.assign(state, initialState);
        },

        clearFilters: (state) => {
            state.filters = initialFilters;
            state.searchTerm = '';
            state.selectedStatus = 'All';
            documentSlice.caseReducers.applyFilters(state);
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Documents
            .addCase(fetchDocuments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<{ documents: Document[]; pagination: DocumentPagination }>) => {
                state.documents = action.payload.documents;
                state.filteredDocuments = action.payload.documents;
                state.pagination = action.payload.pagination;
                state.loading = false;
                state.error = null;
                documentSlice.caseReducers.applyFilters(state);
            })
            .addCase(fetchDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to fetch documents';
            })
            // Get Document by ID
            .addCase(getDocumentById.fulfilled, (state, action: PayloadAction<Document>) => {
                state.selectedDocument = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(getDocumentById.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to fetch document';
            })
            // Document Actions
            .addCase(downloadDocument.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(downloadDocument.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(downloadDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to download document';
            })
            .addCase(sendReminder.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(sendReminder.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to send reminder';
            })
            .addCase(reassignDocument.fulfilled, (state, action: PayloadAction<Document>) => {
                state.loading = false;
                state.error = null;
                documentSlice.caseReducers.updateDocument(state, action);
            })
            .addCase(reassignDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to reassign document';
            })
            .addCase(skipDocumentStep.fulfilled, (state, action: PayloadAction<Document>) => {
                state.loading = false;
                state.error = null;
                documentSlice.caseReducers.updateDocument(state, action);
            })
            .addCase(skipDocumentStep.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to skip document step';
            })
            .addCase(revokeDocument.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                // `action.payload` is now correctly typed as `{ documentId: string; status: 'Revoked' }`
                const { documentId, status } = action.payload;
                // Find the document in the state by the ID from the payload.
                const index = state.documents.findIndex((doc) => doc.id === documentId);
                // This is an "optimistic update". We immediately change the status
                // so the UI feels instant. The full data update will still come from
                // the websocket to ensure complete consistency.
                if (index !== -1) {
                    state.documents[index].status = status;
                }
                // Also update the filtered list if the document is present there.
                const filteredIndex = state.filteredDocuments.findIndex((doc) => doc.id === documentId);
                if (filteredIndex !== -1) {
                    state.filteredDocuments[filteredIndex].status = status;
                }
            })
            .addCase(revokeDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to revoke document';
            })
            .addCase(bulkUpdateDocuments.fulfilled, (state, action: PayloadAction<Document[]>) => {
                state.loading = false;
                state.error = null;
                action.payload.forEach((doc) => {
                    const index = state.documents.findIndex((d) => d.id === doc.id);
                    if (index !== -1) {
                        state.documents[index] = doc;
                    }
                });
                documentSlice.caseReducers.applyFilters(state);
            })
            .addCase(bulkUpdateDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to update documents';
            });
    },
});

export const {
    setLoading,
    setError,
    setDocuments,
    addDocument,
    updateDocument,
    updateDocumentFromSocket,
    removeDocument,
    setSelectedDocument,
    setSearchTerm,
    setSelectedStatus,
    setFilters,
    applyFilters,
    setSortConfig,
    setPagination,
    setCurrentPage,
    setPageSize,
    toggleRowExpansion,
    setExpandedRows,
    clearExpandedRows,
    resetDocumentState,
    clearFilters,
} = documentSlice.actions;

export default documentSlice.reducer;
