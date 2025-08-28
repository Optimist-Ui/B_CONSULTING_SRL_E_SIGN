// src/store/hooks/useDocuments.ts (Updated to include Socket.IO integration for real-time updates)
import { useCallback, useEffect, useMemo } from 'react';
import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import { fetchDocuments, downloadDocument, sendReminder, reassignDocument, skipDocumentStep, revokeDocument } from '../thunk/documentThunks';
import { setSearchTerm, setSelectedStatus, setCurrentPage, setPageSize, toggleRowExpansion, setSortConfig, clearFilters, updateDocumentFromSocket } from '../slices/documentSlice';
import { Document, DocumentFilters } from '../slices/documentSlice';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

export const useDocuments = () => {
    const dispatch = useAppDispatch();

    const { documents, filteredDocuments, loading, error, pagination, searchTerm, selectedStatus, expandedRows, sortConfig, filters } = useAppSelector((state) => state.documents);
    const token = useAppSelector((state) => state.auth.token); // Assuming auth slice has 'token'

    // Memoized computed values
    const paginatedDocuments = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        return filteredDocuments.slice(startIndex, endIndex);
    }, [filteredDocuments, pagination.currentPage, pagination.limit]);

    const totalFilteredCount = useMemo(() => filteredDocuments.length, [filteredDocuments]);

    const hasFiltersApplied = useMemo(() => searchTerm.trim() !== '' || selectedStatus !== 'All' || filters.dateRange !== undefined, [searchTerm, selectedStatus, filters.dateRange]);

    // Socket.IO connection
    const socket = useMemo(() => {
        if (!token) return null;
        return io(BACKEND_URL || 'http://localhost:3001', {
            auth: { token },
            autoConnect: false,
        });
    }, [token]);

    useEffect(() => {
        if (!socket) return;

        socket.connect();

        socket.on('connect', () => {
            console.log('Socket connected for real-time document updates');
        });

        socket.on('package_updated', (data) => {
            // This log will now fire, and 'data' will contain 'updatedDocument'

            // ✅ THE FIX: Look for 'updatedDocument' in the payload from the server.
            if (data.type === 'PACKAGE_UPDATED' && data.updatedDocument) {
                // Dispatch the full document object to the reducer.
                dispatch(updateDocumentFromSocket(data.updatedDocument));
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        return () => {
            socket.off('package_updated');
            socket.disconnect();
        };
    }, [socket, dispatch]);

    // Actions
    const actions = {
        // Data fetching
        fetchDocuments: useCallback(
            (params?: { filters?: Partial<DocumentFilters>; page?: number; limit?: number; sortKey?: keyof Document; sortDirection?: 'asc' | 'desc' }) => {
                dispatch(fetchDocuments(params));
            },
            [dispatch]
        ),

        // Search and filtering
        setSearch: useCallback(
            (term: string) => {
                dispatch(setSearchTerm(term));
                dispatch(setCurrentPage(1));
                dispatch(fetchDocuments({ filters: { name: term }, page: 1 }));
            },
            [dispatch]
        ),

        setStatus: useCallback(
            (status: string) => {
                dispatch(setSelectedStatus(status));
                dispatch(setCurrentPage(1));
                dispatch(fetchDocuments({ filters: { status }, page: 1 }));
            },
            [dispatch]
        ),

        clearAllFilters: useCallback(() => {
            dispatch(clearFilters());
            dispatch(setCurrentPage(1));
            dispatch(fetchDocuments({ page: 1 }));
        }, [dispatch]),

        // Pagination
        setPage: useCallback(
            (page: number) => {
                dispatch(setCurrentPage(page));
                dispatch(fetchDocuments({ page }));
            },
            [dispatch]
        ),

        changePageSize: useCallback(
            (size: number) => {
                dispatch(setPageSize(size));
                dispatch(setCurrentPage(1));
                dispatch(fetchDocuments({ limit: size, page: 1 }));
            },
            [dispatch]
        ),

        // Sorting
        sort: useCallback(
            (key: keyof Document, direction: 'asc' | 'desc') => {
                dispatch(setSortConfig({ key, direction }));
                dispatch(fetchDocuments({ sortKey: key, sortDirection: direction }));
            },
            [dispatch]
        ),

        // UI interactions
        toggleExpansion: useCallback(
            (rowId: string) => {
                dispatch(toggleRowExpansion(rowId));
            },
            [dispatch]
        ),

        // Document actions
        download: useCallback(
            async (documentId: string) => {
                try {
                    const result = await dispatch(downloadDocument(documentId)).unwrap();
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `document-${documentId}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(result);
                    return { success: true, message: 'Document downloaded successfully' };
                } catch (error: any) {
                    console.error('Download failed:', error);
                    return { success: false, message: error || 'Failed to download document' };
                }
            },
            [dispatch]
        ),

        sendReminder: useCallback(
            async (documentId: string) => {
                try {
                    // .unwrap() will return the success message on fulfillment
                    // or throw the error message on rejection.
                    const successMessage = await dispatch(sendReminder(documentId)).unwrap();

                    // Show the specific success message from the backend.
                    toast.success(successMessage);
                } catch (error: any) {
                    // If the thunk rejects, this block will execute.
                    console.error('Send reminder failed:', error);

                    // Show the specific error message from the backend.
                    toast.error(error || 'Failed to send reminder.');
                }
            },
            [dispatch]
        ),

        reassign: useCallback(
            async (documentId: string, reassignmentData: any) => {
                try {
                    const updatedDocument = await dispatch(reassignDocument({ documentId, reassignmentData })).unwrap();
                    return { success: true, document: updatedDocument };
                } catch (error: any) {
                    console.error('Reassignment failed:', error);
                    return { success: false, message: error || 'Failed to reassign document' };
                }
            },
            [dispatch]
        ),

        skip: useCallback(
            async (documentId: string) => {
                try {
                    const updatedDocument = await dispatch(skipDocumentStep(documentId)).unwrap();
                    return { success: true, document: updatedDocument };
                } catch (error: any) {
                    console.error('Skip failed:', error);
                    return { success: false, message: error || 'Failed to skip document step' };
                }
            },
            [dispatch]
        ),

        revoke: useCallback(
            async (documentId: string, reason?: string) => {
                try {
                    await dispatch(revokeDocument({ documentId, reason })).unwrap();
                    toast.success('Document has been successfully revoked.');
                    // via the WebSocket event, ensuring a single source of truth.
                } catch (error: any) {
                    // This block runs if the thunk is rejected.
                    console.error('Revoke failed:', error);
                    // Show an error toast to the user with the message from the backend.
                    toast.error(error || 'An unexpected error occurred while revoking the document.');
                }
            },
            [dispatch]
        ),
    };

    // Auto-fetch documents on mount and when filters or pagination change
    useEffect(() => {
        actions.fetchDocuments({
            filters: { status: selectedStatus, name: searchTerm },
            page: pagination.currentPage,
            limit: pagination.limit,
            sortKey: sortConfig.key || 'addedOn',
            sortDirection: sortConfig.direction,
        });
    }, [searchTerm, selectedStatus, pagination.currentPage, pagination.limit, sortConfig.key, sortConfig.direction, actions.fetchDocuments]);

    return {
        // Data
        documents: paginatedDocuments,
        allDocuments: documents,
        filteredDocuments,
        totalCount: totalFilteredCount,

        // State
        loading,
        error,
        pagination,
        searchTerm,
        selectedStatus,
        expandedRows,
        sortConfig,
        hasFiltersApplied,

        // Actions
        ...actions,
    };
};
