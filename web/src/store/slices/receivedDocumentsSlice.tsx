// src/slices/receivedDocumentsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchReceivedDocuments } from '../thunk/documentThunks';
import { Document, DocumentFilters, DocumentPagination } from './documentSlice';

export interface ReceivedDocumentState {
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

const initialState: ReceivedDocumentState = {
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

const receivedDocumentsSlice = createSlice({
    name: 'receivedDocuments',
    initialState,
    reducers: {
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

        setDocuments: (state, action: PayloadAction<Document[]>) => {
            state.documents = action.payload;
            state.filteredDocuments = action.payload;
            state.loading = false;
            state.error = null;
        },

        // ❌ updateDocumentFromSocket REMOVED

        setSelectedDocument: (state, action: PayloadAction<Document | null>) => {
            state.selectedDocument = action.payload;
        },

        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
            state.filters.name = action.payload;
            receivedDocumentsSlice.caseReducers.applyFilters(state);
        },

        setSelectedStatus: (state, action: PayloadAction<string>) => {
            state.selectedStatus = action.payload;
            state.filters.status = action.payload;
            receivedDocumentsSlice.caseReducers.applyFilters(state);
        },

        setFilters: (state, action: PayloadAction<Partial<DocumentFilters>>) => {
            state.filters = { ...state.filters, ...action.payload };
            receivedDocumentsSlice.caseReducers.applyFilters(state);
        },

        applyFilters: (state) => {
            let filtered = [...state.documents];

            if (state.filters.status !== 'All') {
                filtered = filtered.filter((doc) => doc.status === state.filters.status);
            }

            if (state.filters.name.trim()) {
                const searchTerm = state.filters.name.toLowerCase().trim();
                filtered = filtered.filter(
                    (doc) =>
                        doc.name.toLowerCase().includes(searchTerm) ||
                        doc.initiator.name.toLowerCase().includes(searchTerm) ||
                        doc.participantsSummary.some((participant) => participant.toLowerCase().includes(searchTerm))
                );
            }

            if (state.filters.dateRange) {
                const { from, to } = state.filters.dateRange;
                filtered = filtered.filter((doc) => {
                    const docDate = new Date(doc.addedOn);
                    const fromDate = new Date(from);
                    const toDate = new Date(to);
                    return docDate >= fromDate && docDate <= toDate;
                });
            }

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

        setSortConfig: (state, action: PayloadAction<{ key: keyof Document; direction: 'asc' | 'desc' }>) => {
            state.sortConfig = action.payload;
            receivedDocumentsSlice.caseReducers.applyFilters(state);
        },

        setPagination: (state, action: PayloadAction<Partial<DocumentPagination>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },

        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.pagination.currentPage = action.payload;
        },

        setPageSize: (state, action: PayloadAction<number>) => {
            state.pagination.limit = action.payload;
            state.pagination.currentPage = 1;
        },

        toggleRowExpansion: (state, action: PayloadAction<string>) => {
            const newExpandedRows = new Set(state.expandedRows);
            if (newExpandedRows.has(action.payload)) {
                newExpandedRows.delete(action.payload);
            } else {
                newExpandedRows.add(action.payload);
            }
            state.expandedRows = newExpandedRows;
        },

        clearExpandedRows: (state) => {
            state.expandedRows = new Set();
        },

        resetReceivedDocumentState: (state) => {
            Object.assign(state, initialState);
        },

        clearFilters: (state) => {
            state.filters = initialFilters;
            state.searchTerm = '';
            state.selectedStatus = 'All';
            receivedDocumentsSlice.caseReducers.applyFilters(state);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReceivedDocuments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReceivedDocuments.fulfilled, (state, action: PayloadAction<{ documents: Document[]; pagination: DocumentPagination }>) => {
                state.documents = action.payload.documents;
                state.filteredDocuments = action.payload.documents;
                state.pagination = action.payload.pagination;
                state.loading = false;
                state.error = null;
                receivedDocumentsSlice.caseReducers.applyFilters(state);
            })
            .addCase(fetchReceivedDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to fetch received documents';
            });
    },
});

export const {
    setLoading,
    setError,
    setDocuments,
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
    clearExpandedRows,
    resetReceivedDocumentState,
    clearFilters,
} = receivedDocumentsSlice.actions;

export default receivedDocumentsSlice.reducer;
