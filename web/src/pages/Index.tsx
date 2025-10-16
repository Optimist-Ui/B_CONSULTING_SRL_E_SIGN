import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import IconPlus from '../components/Icon/IconPlus';
import DocumentTable from '../components/Documents/DocumentTable';
import TableFilters from '../components/Documents/TableFilters';
import TablePagination from '../components/Documents/TablePagination';
import { useDocuments } from '../store/hooks/useDocuments';

const Index: React.FC = () => {
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
        sendReminder,
        reassign,
        skip,
        revoke,
    } = useDocuments();

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
                <h2 className="text-xl font-bold mb-2">Could Not Load Documents</h2>
                <p>{pageError}</p>
            </div>
        );
    }

    if (isPageLoading) {
        return (
            <div className="p-10 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 font-semibold text-gray-600">Loading Documents...</p>
            </div>
        );
    }

    return (
        <div className="p-6 dark:bg-gray-900 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <Link to="/add-document">
                    <button className="bg-primary text-white flex items-center px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors">
                        <IconPlus className="w-4 h-4 mr-2" />
                        Upload Document
                    </button>
                </Link>
                <TableFilters search={searchTerm} setSearch={setSearch} selectedStatus={selectedStatus} setSelectedStatus={setStatus} />
            </div>

            <DocumentTable
                documents={paginatedDocuments}
                loading={actionLoading}
                expandedRows={expandedRows}
                toggleExpansion={toggleExpansion}
                sortConfig={sortConfig}
                onSort={sort}
                onDownload={download}
                onNotify={sendReminder}
                onViewHistory={(id) => console.log(`View history for: ${id}`)}
                onReassign={reassign}
                onSkip={skip}
                onRevoke={revoke}
            />

            <TablePagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} pageSize={pagination.limit} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </div>
    );
};

export default Index;
