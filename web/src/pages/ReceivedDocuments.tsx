// src/pages/ReceivedDocuments.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import IconMenuDocumentation from '../components/Icon/Menu/IconMenuDocumentation';
import ReceivedDocumentTable from '../components/ReceivedDocuments/ReceivedDocumentTable';
import TableFilters from '../components/Documents/TableFilters';
import TablePagination from '../components/Documents/TablePagination';
import { useReceivedDocuments } from '../store/hooks/useReceivedDocuments';

const ReceivedDocuments: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        documents: paginatedDocuments,
        loading: actionLoading,
        error: actionError,
        pagination,
        searchTerm,
        selectedStatus,
        expandedRows,
        sortConfig,
        setSearch,
        setStatus,
        setPage,
        changePageSize,
        toggleExpansion,
        sort,
        download,
    } = useReceivedDocuments();

    const [isPageLoading, setIsPageLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    useEffect(() => {
        setIsPageLoading(actionLoading && paginatedDocuments.length === 0);

        if (actionError && paginatedDocuments.length === 0) {
            setPageError(actionError);
        } else {
            setPageError(null);
        }
    }, [actionLoading, actionError, paginatedDocuments]);

    if (pageError) {
        return (
            <div className="p-6 text-center dark:bg-gray-900 bg-white rounded-lg shadow-md text-red-600">
                <h2 className="text-xl font-bold mb-2">{t('receivedDocuments.error.title')}</h2>
                <p>{pageError}</p>
            </div>
        );
    }

    if (isPageLoading) {
        return (
            <div className="p-10 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 font-semibold text-gray-600">{t('receivedDocuments.loading')}</p>
            </div>
        );
    }

    return (
        <div className="p-6 dark:bg-gray-900 bg-white rounded-lg shadow-md">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 rounded-full p-3">
                        <IconMenuDocumentation className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('receivedDocuments.title')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('receivedDocuments.subtitle')}</p>
                    </div>
                </div>

                {/* Filters */}
                <TableFilters search={searchTerm} setSearch={setSearch} selectedStatus={selectedStatus} setSelectedStatus={setStatus} />
            </div>

            {/* Document Table */}
            <ReceivedDocumentTable
                documents={paginatedDocuments}
                loading={actionLoading}
                expandedRows={expandedRows}
                toggleExpansion={toggleExpansion}
                sortConfig={sortConfig}
                onSort={sort}
                onDownload={download}
                onViewDetails={(id) => navigate(`/package/${id}`)}
            />

            {/* Pagination */}
            <TablePagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} pageSize={pagination.limit} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </div>
    );
};

export default ReceivedDocuments;
