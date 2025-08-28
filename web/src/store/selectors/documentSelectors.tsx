import { createSelector } from '@reduxjs/toolkit';
import { IRootState } from '../index';
import { Document } from '../slices/documentSlice';

// Base selectors
export const selectDocumentsState = (state: IRootState) => state.documents;
export const selectDocuments = (state: IRootState) => state.documents.documents;
export const selectFilteredDocuments = (state: IRootState) => state.documents.filteredDocuments;
export const selectDocumentsLoading = (state: IRootState) => state.documents.loading;
export const selectDocumentsError = (state: IRootState) => state.documents.error;
export const selectPagination = (state: IRootState) => state.documents.pagination;
export const selectSearchTerm = (state: IRootState) => state.documents.searchTerm;
export const selectSelectedStatus = (state: IRootState) => state.documents.selectedStatus;
export const selectExpandedRows = (state: IRootState) => state.documents.expandedRows;

// Computed selectors
export const selectDocumentsByStatus = createSelector(
  [selectDocuments],
  (documents) => {
    return documents.reduce((acc, doc) => {
      if (!acc[doc.status]) {
        acc[doc.status] = [];
      }
      acc[doc.status].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  }
);

export const selectDocumentStats = createSelector(
  [selectDocuments],
  (documents) => {
    const stats = {
      total: documents.length,
      draft: 0,
      pending: 0,
      finished: 0,
      rejected: 0,
      expired: 0,
      revoked: 0,
    };

    documents.forEach(doc => {
      switch (doc.status) {
        case 'Draft':
          stats.draft++;
          break;
        case 'Pending':
          stats.pending++;
          break;
        case 'Finished':
          stats.finished++;
          break;
        case 'Rejected':
          stats.rejected++;
          break;
        case 'Expired':
          stats.expired++;
          break;
        case 'Revoked':
          stats.revoked++;
          break;
      }
    });

    return stats;
  }
);

export const selectPaginatedDocuments = createSelector(
  [selectFilteredDocuments, selectPagination],
  (filteredDocuments, pagination) => {
    const startIndex = (pagination.currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredDocuments.slice(startIndex, endIndex);
  }
);

export const selectHasActiveFilters = createSelector(
  [selectSearchTerm, selectSelectedStatus, (state: IRootState) => state.documents.filters],
  (searchTerm, selectedStatus, filters) => {
    return searchTerm.trim() !== '' || 
           selectedStatus !== 'All' || 
           filters.dateRange !== undefined;
  }
);