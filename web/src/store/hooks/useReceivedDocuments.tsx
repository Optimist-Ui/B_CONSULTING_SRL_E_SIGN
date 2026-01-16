// src/store/hooks/useReceivedDocuments.ts
import { useCallback, useEffect, useMemo } from 'react';
import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import { fetchReceivedDocuments, downloadDocument } from '../thunk/documentThunks';
import { setSearchTerm, setSelectedStatus, setCurrentPage, setPageSize, toggleRowExpansion, setSortConfig, clearFilters } from '../slices/receivedDocumentsSlice';
import { Document, DocumentFilters } from '../slices/documentSlice';

export const useReceivedDocuments = () => {
    const dispatch = useAppDispatch();

    const { documents, filteredDocuments, loading, error, pagination, searchTerm, selectedStatus, expandedRows, sortConfig, filters } = useAppSelector((state) => state.receivedDocuments);

    // Memoized computed values
    const paginatedDocuments = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        return filteredDocuments.slice(startIndex, endIndex);
    }, [filteredDocuments, pagination.currentPage, pagination.limit]);

    const totalFilteredCount = useMemo(() => filteredDocuments.length, [filteredDocuments]);

    const hasFiltersApplied = useMemo(() => searchTerm.trim() !== '' || selectedStatus !== 'All' || filters.dateRange !== undefined, [searchTerm, selectedStatus, filters.dateRange]);

    // Actions
    const actions = {
        fetchReceivedDocuments: useCallback(
            (params?: { filters?: Partial<DocumentFilters>; page?: number; limit?: number; sortKey?: keyof Document; sortDirection?: 'asc' | 'desc' }) => {
                dispatch(fetchReceivedDocuments(params));
            },
            [dispatch]
        ),

        setSearch: useCallback(
            (term: string) => {
                dispatch(setSearchTerm(term));
                dispatch(setCurrentPage(1));
                dispatch(fetchReceivedDocuments({ filters: { name: term }, page: 1 }));
            },
            [dispatch]
        ),

        setStatus: useCallback(
            (status: string) => {
                dispatch(setSelectedStatus(status));
                dispatch(setCurrentPage(1));
                dispatch(fetchReceivedDocuments({ filters: { status }, page: 1 }));
            },
            [dispatch]
        ),

        clearAllFilters: useCallback(() => {
            dispatch(clearFilters());
            dispatch(setCurrentPage(1));
            dispatch(fetchReceivedDocuments({ page: 1 }));
        }, [dispatch]),

        setPage: useCallback(
            (page: number) => {
                dispatch(setCurrentPage(page));
                dispatch(fetchReceivedDocuments({ page }));
            },
            [dispatch]
        ),

        changePageSize: useCallback(
            (size: number) => {
                dispatch(setPageSize(size));
                dispatch(setCurrentPage(1));
                dispatch(fetchReceivedDocuments({ limit: size, page: 1 }));
            },
            [dispatch]
        ),

        sort: useCallback(
            (key: keyof Document, direction: 'asc' | 'desc') => {
                dispatch(setSortConfig({ key, direction }));
                dispatch(fetchReceivedDocuments({ sortKey: key, sortDirection: direction }));
            },
            [dispatch]
        ),

        toggleExpansion: useCallback(
            (rowId: string) => {
                dispatch(toggleRowExpansion(rowId));
            },
            [dispatch]
        ),

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
    };

    // Auto-fetch received documents on mount and when filters change
    useEffect(() => {
        actions.fetchReceivedDocuments({
            filters: { status: selectedStatus, name: searchTerm },
            page: pagination.currentPage,
            limit: pagination.limit,
            sortKey: sortConfig.key || 'addedOn',
            sortDirection: sortConfig.direction,
        });
    }, [searchTerm, selectedStatus, pagination.currentPage, pagination.limit, sortConfig.key, sortConfig.direction]);

    return {
        documents: paginatedDocuments,
        allDocuments: documents,
        filteredDocuments,
        totalCount: totalFilteredCount,
        loading,
        error,
        pagination,
        searchTerm,
        selectedStatus,
        expandedRows,
        sortConfig,
        hasFiltersApplied,
        ...actions,
    };
};
