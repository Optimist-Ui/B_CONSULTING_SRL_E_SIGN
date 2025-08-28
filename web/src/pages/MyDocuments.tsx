import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    Row,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import IconPlus from '../components/Icon/IconPlus';
import IconSearch from '../components/Icon/IconSearch';
import IconMenuDocumentation from '../components/Icon/Menu/IconMenuDocumentation';
import IconBell from '../components/Icon/IconBell';
import IconClock from '../components/Icon/IconClock';
import IconXCircle from '../components/Icon/IconXCircle';
import Dropdown from '../components/Dropdown';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconCaretsDown from '../components/Icon/IconCaretsDown';
import IconArrowForward from '../components/Icon/IconArrowForward';
import IconMail from '../components/Icon/IconMail';
import IconPhone from '../components/Icon/IconPhone';

// --- TYPE DEFINITIONS ---
interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface RoleDetail {
    user: User;
    status: 'Completed' | 'In Progress' | 'Waiting' | 'Not Sent' | 'Rejected';
    lastUpdated: string;
}

interface Document {
    id: string;
    name: string;
    status: 'Draft' | 'Pending' | 'Finished' | 'Rejected' | 'Expired' | 'Revoked';
    addedOn: string;
    initiator: User;
    formFillers: RoleDetail[];
    approvers: RoleDetail[];
    signers: RoleDetail[];
    receivers: RoleDetail[];
    participantsSummary: string[];
}

// --- DUMMY DATA ---
const dummyDocuments: Document[] = [
    {
        id: 'doc-1',
        name: 'Q4 Performance Review.pdf',
        status: 'Pending',
        addedOn: '2024-03-10T09:00:00Z',
        initiator: { id: 'user-1', name: 'Jane Doe', email: 'jane@corp.com', phone: '+1-555-123-4567' },
        formFillers: [
            { user: { id: 'user-2', name: 'Alice Johnson', email: 'alice@corp.com', phone: '+1-555-234-5678' }, status: 'Completed', lastUpdated: '2024-03-11T10:30:00Z' },
            { user: { id: 'user-3', name: 'Bob Smith', email: 'bob@corp.com', phone: '+1-555-345-6789' }, status: 'In Progress', lastUpdated: '2024-03-12T14:15:00Z' },
        ],
        approvers: [{ user: { id: 'user-4', name: 'Charlie Brown', email: 'charlie@corp.com', phone: '+1-555-456-7890' }, status: 'Waiting', lastUpdated: '' }],
        signers: [{ user: { id: 'user-5', name: 'Diana Evans', email: 'diana@corp.com', phone: '+1-555-567-8901' }, status: 'Not Sent', lastUpdated: '' }],
        receivers: [{ user: { id: 'user-6', name: 'Eve Adams', email: 'eve@corp.com', phone: '+1-555-678-9012' }, status: 'Not Sent', lastUpdated: '' }],
        participantsSummary: ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Evans', 'Eve Adams'],
    },
    {
        id: 'doc-2',
        name: 'New Hire Onboarding.docx',
        status: 'Draft',
        addedOn: '2024-03-12T15:45:00Z',
        initiator: { id: 'user-1', name: 'Jane Doe', email: 'jane@corp.com', phone: '+1-555-123-4567' },
        formFillers: [],
        approvers: [],
        signers: [],
        receivers: [],
        participantsSummary: [],
    },
    {
        id: 'doc-3',
        name: 'Contract Agreement.pdf',
        status: 'Finished',
        addedOn: '2024-03-08T12:00:00Z',
        initiator: { id: 'user-1', name: 'Jane Doe', email: 'jane@corp.com', phone: '+1-555-123-4567' },
        formFillers: [{ user: { id: 'user-9', name: 'Henry Taylor', email: 'henry@corp.com', phone: '+1-555-901-2345' }, status: 'Completed', lastUpdated: '2024-03-09T09:00:00Z' }],
        approvers: [{ user: { id: 'user-10', name: 'Isabel Clark', email: 'isabel@corp.com', phone: '+1-555-012-3456' }, status: 'Completed', lastUpdated: '2024-03-10T10:00:00Z' }],
        signers: [{ user: { id: 'user-11', name: 'Jack Davis', email: 'jack@corp.com', phone: '+1-555-123-4568' }, status: 'Completed', lastUpdated: '2024-03-10T11:00:00Z' }],
        receivers: [{ user: { id: 'user-12', name: 'Kelly Martin', email: 'kelly@corp.com', phone: '+1-555-234-5679' }, status: 'Completed', lastUpdated: '2024-03-10T12:00:00Z' }],
        participantsSummary: ['Henry Taylor', 'Isabel Clark', 'Jack Davis', 'Kelly Martin'],
    },
    {
        id: 'doc-4',
        name: 'Budget Proposal.xlsx',
        status: 'Revoked',
        addedOn: '2024-03-05T09:00:00Z',
        initiator: { id: 'user-1', name: 'Jane Doe', email: 'jane@corp.com', phone: '+1-555-123-4567' },
        formFillers: [{ user: { id: 'user-14', name: 'Mia Wilson', email: 'mia@corp.com', phone: '+1-555-456-7891' }, status: 'Not Sent', lastUpdated: '' }],
        approvers: [],
        signers: [],
        receivers: [],
        participantsSummary: ['Mia Wilson'],
    },
];

// --- UTILITY FUNCTIONS ---
const getStatusBadgeColor = (status: Document['status'] | RoleDetail['status'] | 'N/A'): string => {
    switch (status) {
        case 'Completed':
        case 'Finished':
            return 'bg-green-500 text-white';
        case 'Pending':
        case 'Draft':
            return 'bg-yellow-500 text-black';
        case 'In Progress':
        case 'Waiting':
            return 'bg-blue-600 text-white';
        case 'Rejected':
        case 'Revoked':
        case 'Expired':
            return 'bg-red-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};

const getStatusDotColor = (status: RoleDetail['status'] | 'N/A' | 'AllCompleted' | 'AllRejected'): string => {
    switch (status) {
        case 'Completed':
        case 'AllCompleted':
            return 'bg-green-500';
        case 'Rejected':
        case 'AllRejected':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

const renderSingleStatusDot = (members: (RoleDetail | User)[]): JSX.Element => {
    const statusCounts: Record<RoleDetail['status'], number> = {
        Completed: 0,
        'In Progress': 0,
        Waiting: 0,
        'Not Sent': 0,
        Rejected: 0,
    };

    members.forEach((member) => {
        const status = 'status' in member ? member.status : 'Completed'; // Initiator is always Completed
        statusCounts[status]++;
    });

    const total = members.length;
    const pendingCount = statusCounts['In Progress'] + statusCounts.Waiting + statusCounts['Not Sent'];
    let dotColor: string;
    if (total === 0) {
        dotColor = getStatusDotColor('Not Sent'); // Empty role group is grey
    } else if (statusCounts.Rejected === total) {
        dotColor = getStatusDotColor('AllRejected'); // All rejected is red
    } else if (statusCounts.Completed === total) {
        dotColor = getStatusDotColor('AllCompleted'); // All completed is green
    } else {
        dotColor = getStatusDotColor('Not Sent'); // Any incomplete is grey
    }

    let tooltipContent: JSX.Element;
    if (total === 0) {
        tooltipContent = <span className="text-gray-800 text-xs">None</span>;
    } else if (statusCounts.Completed === total) {
        tooltipContent = <span className="text-green-500 text-xs">✓✓</span>;
    } else if (statusCounts.Rejected === total) {
        tooltipContent = <span className="text-red-500 text-xs">✗</span>;
    } else {
        const parts: JSX.Element[] = [];
        if (statusCounts.Completed > 0) {
            parts.push(
                <span key="completed" className="flex items-center gap-1">
                    <span className="text-gray-800 text-xs">{statusCounts.Completed}</span>
                    {Array.from({ length: statusCounts.Completed }).map((_, index) => (
                        <span key={`completed-${index}`} className="w-2 h-2 rounded-full bg-green-500" title={`${statusCounts.Completed} Completed`} />
                    ))}
                </span>
            );
        }
        if (pendingCount > 0) {
            if (statusCounts.Completed > 0) {
                parts.push(
                    <span key="separator" className="text-gray-800 text-xs mx-1">
                        -
                    </span>
                );
            }
            parts.push(
                <span key="pending" className="flex items-center gap-1">
                    <span className="text-gray-800 text-xs">{pendingCount}</span>
                    <span className="w-2 h-2 rounded-full bg-gray-500" title={`${pendingCount} Pending`} />
                </span>
            );
        }
        if (statusCounts.Rejected > 0) {
            if (statusCounts.Completed > 0 || pendingCount > 0) {
                parts.push(
                    <span key="separator-rejected" className="text-gray-800 text-xs mx-1">
                        -
                    </span>
                );
            }
            parts.push(
                <span key="rejected" className="flex items-center gap-1">
                    <span className="text-gray-800 text-xs">{statusCounts.Rejected}</span>
                    <span className="w-2 h-2 rounded-full bg-red-500" title={`${statusCounts.Rejected} Rejected`} />
                </span>
            );
        }
        tooltipContent = <div className="flex items-center gap-1">{parts}</div>;
    }

    return (
        <div className="relative flex items-center group">
            <span className={`w-3 h-3 rounded-full ${dotColor}`} />
            {total > 0 && (
                <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-200 rounded-md px-2 py-1 z-10 flex items-center pointer-events-none">
                    {tooltipContent}
                </div>
            )}
        </div>
    );
};

// Fuzzy filter function
const fuzzyFilter = (row: Row<Document>, columnId: string, value: string, addMeta: (meta: { itemRank: any }) => void) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
};

// --- SUB-COMPONENTS ---
interface RoleGroupDetailsProps {
    roleTitle: string;
    members: (RoleDetail | User)[];
}

const RoleGroupDetails: React.FC<RoleGroupDetailsProps> = ({ roleTitle, members }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!members || members.length === 0) return null;

    return (
        <div className="mb-4">
            <button className="flex items-center w-full text-left font-semibold text-gray-700 hover:text-primary" onClick={() => setIsOpen(!isOpen)}>
                <IconArrowForward className={`w-4 h-4 mr-2 transform ${isOpen ? 'rotate-90' : ''} transition-transform`} />
                {roleTitle} ({members.length})
            </button>
            {isOpen && (
                <table className="w-full text-sm border-collapse mt-2">
                    <thead>
                        <tr className="text-left bg-gray-50">
                            <th className="px-4 py-2">Name & Email</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member, index) => {
                            const user = 'user' in member ? member.user : member;
                            const status = 'status' in member ? member.status : 'N/A';
                            const lastUpdated = 'lastUpdated' in member ? member.lastUpdated : 'N/A';
                            return (
                                <tr key={index} className="border-t border-gray-200">
                                    <td className="px-4 py-2">
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-gray-500 text-xs">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(status)}`}>{status}</span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">{lastUpdated || 'N/A'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

interface DocumentDetailsPanelProps {
    document: Document;
}

const DocumentDetailsPanel: React.FC<DocumentDetailsPanelProps> = ({ document }) => {
    return (
        <div className="p-4 bg-gray-50 rounded-b-md shadow-inner transition-all duration-300">
            <RoleGroupDetails roleTitle="Form Fillers" members={document.formFillers} />
            <RoleGroupDetails roleTitle="Approvers" members={document.approvers} />
            <RoleGroupDetails roleTitle="Signers" members={document.signers} />
            <RoleGroupDetails roleTitle="Receivers" members={document.receivers} />
        </div>
    );
};

interface TableFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    selectedStatus: string;
    setSelectedStatus: (value: string) => void;
}

const TableFilters: React.FC<TableFiltersProps> = ({ search, setSearch, selectedStatus, setSelectedStatus }) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                    <IconMenuDocumentation className="w-4 h-4 inline-block mr-1" />
                    Status
                </label>
                <select
                    id="status-filter"
                    className="w-full sm:w-40 border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-primary focus:ring focus:ring-primary/20 transition-colors duration-200"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    aria-label="Filter by document status"
                >
                    {['All', 'Draft', 'Pending', 'Finished', 'Rejected', 'Expired', 'Revoked'].map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>
            <div className="relative w-full sm:w-64">
                <input
                    type="text"
                    placeholder="Search Documents..."
                    className="w-full border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm bg-white focus:border-primary focus:ring focus:ring-primary/20 transition-colors duration-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search documents"
                />
                <IconSearch className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 focus-within:text-primary" />
                {search && (
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearch('')} aria-label="Clear search">
                        <IconXCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

interface TablePaginationProps {
    table: ReturnType<typeof useReactTable<Document>>;
}

const TablePagination: React.FC<TablePaginationProps> = ({ table }) => {
    return (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="border-gray-300 rounded-md px-2 py-1 w-20 text-sm focus:border-primary focus:ring focus:ring-primary/20"
                >
                    {[10, 20, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            {pageSize}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2">
                <button
                    className="border border-primary text-primary px-3 py-1 rounded-md text-sm hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </button>
                <button
                    className="border border-primary text-primary px-3 py-1 rounded-md text-sm hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// --- COLUMN DEFINITIONS ---
const columnHelper = createColumnHelper<Document>();

const getColumns = (
    handleDownload: (id: string) => void,
    handleNotify: (id: string) => void,
    handleViewHistory: (id: string) => void,
    handleReassign: (id: string) => void,
    handleSkip: (id: string) => void,
    handleRevoke: (id: string) => void
): ColumnDef<Document, any>[] => [
    columnHelper.accessor('name', {
        header: 'Document Name',
        cell: ({ getValue }) => (
            <div className="flex items-center font-medium text-primary">
                <IconMenuDocumentation className="w-5 h-5 mr-2" />
                {getValue()}
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: fuzzyFilter,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(getValue())}`}>{getValue()}</span>,
        enableSorting: true,
        enableColumnFilter: true,
    }),
    columnHelper.accessor('initiator', {
        header: 'Initiator',
        cell: ({ getValue }) => (
            <div className="relative group">
                <span className="text-sm">{getValue().name}</span>
                <div className="absolute left-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-200 rounded-md px-3 py-2 z-10 text-xs text-gray-800 pointer-events-none min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                        <IconMail className="w-4 h-4 text-gray-600" />
                        <span>{getValue().email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IconPhone className="w-4 h-4 text-gray-600" />
                        <span>{getValue().phone}</span>
                    </div>
                </div>
            </div>
        ),
        enableSorting: false,
    }),
    columnHelper.accessor('formFillers', {
        header: 'Form Fillers',
        cell: ({ getValue }) => renderSingleStatusDot(getValue()),
        enableSorting: false,
    }),
    columnHelper.accessor('approvers', {
        header: 'Approvers',
        cell: ({ getValue }) => renderSingleStatusDot(getValue()),
        enableSorting: false,
    }),
    columnHelper.accessor('signers', {
        header: 'Signers',
        cell: ({ getValue }) => renderSingleStatusDot(getValue()),
        enableSorting: false,
    }),
    columnHelper.accessor('receivers', {
        header: 'Receivers',
        cell: ({ getValue }) => renderSingleStatusDot(getValue()),
        enableSorting: false,
    }),
    columnHelper.accessor('addedOn', {
        header: 'Added On',
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
        enableSorting: true,
    }),
    columnHelper.accessor('participantsSummary', {
        header: 'Participants',
        cell: ({ getValue }) => <div className="max-w-xs truncate text-sm">{getValue().join(', ')}</div>,
        enableSorting: false,
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <div onClick={(e) => e.stopPropagation()}>
                <Dropdown placement="bottom-end" btnClassName="p-1 rounded-full hover:bg-gray-200" button={<IconPlus className="w-5 h-5 text-gray-500" />}>
                    <ul className="min-w-[180px] bg-white shadow-lg rounded-md">
                        <li>
                            <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => handleDownload(row.original.id)}>
                                <IconMenuDocumentation className="w-4 h-4 mr-2" />
                                Download
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => handleNotify(row.original.id)}>
                                <IconBell className="w-4 h-4 mr-2" />
                                Notify/Reminder
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => handleViewHistory(row.original.id)}>
                                <IconClock className="w-4 h-4 mr-2" />
                                View History
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => handleReassign(row.original.id)}>
                                <IconPlus className="w-4 h-4 mr-2" />
                                Reassign
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => handleSkip(row.original.id)}>
                                <IconArrowForward className="w-4 h-4 mr-2" />
                                Skip
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleRevoke(row.original.id)}>
                                <IconXCircle className="w-4 h-4 mr-2" />
                                Revoke
                            </button>
                        </li>
                    </ul>
                </Dropdown>
            </div>
        ),
    }),
];

// --- MAIN COMPONENT ---
const MyDocuments: React.FC = () => {
    // State
    const [documents] = useState<Document[]>(dummyDocuments);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'addedOn', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    // Action handlers
    const handleDownload = useCallback((id: string) => console.log(`Download document ${id}`), []);
    const handleNotify = useCallback((id: string) => console.log(`Send reminder for document ${id}`), []);
    const handleViewHistory = useCallback((id: string) => console.log(`View history for document ${id}`), []);
    const handleReassign = useCallback((id: string) => console.log(`Reassign document ${id}`), []);
    const handleSkip = useCallback((id: string) => console.log(`Skip form fillers/approvers for document ${id}`), []);
    const handleRevoke = useCallback((id: string) => console.log(`Revoke document ${id}`), []);

    // Filter effect
    useEffect(() => {
        setColumnFilters([{ id: 'name', value: search }, ...(selectedStatus !== 'All' ? [{ id: 'status', value: selectedStatus }] : [])]);
    }, [search, selectedStatus]);

    // Columns
    const columns = useMemo(
        () => getColumns(handleDownload, handleNotify, handleViewHistory, handleReassign, handleSkip, handleRevoke),
        [handleDownload, handleNotify, handleViewHistory, handleReassign, handleSkip, handleRevoke]
    );

    // Table instance
    const table = useReactTable({
        data: documents,
        columns,
        state: { sorting, columnFilters, pagination },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Toggle row expansion
    const toggleRowExpansion = useCallback((rowId: string) => {
        setExpandedRowId((prev) => (prev === rowId ? null : rowId));
    }, []);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <Link to="/add-document">
                    <button className="bg-primary text-white flex items-center px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors">
                        <IconPlus className="w-4 h-4 mr-2" />
                        Upload Document
                    </button>
                </Link>
                <TableFilters search={search} setSearch={setSearch} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} />
            </div>

            {/* Table */}
            <div className="h-[70vh] overflow-y-auto rounded-md border border-gray-200">
                <table className="w-full border-collapse bg-white">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="bg-gray-100">
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="p-3 text-left font-semibold text-gray-700 text-sm">
                                        <div
                                            className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                                            onClick={header.column.getToggleSortingHandler()}
                                            aria-sort={header.column.getIsSorted() ? (header.column.getIsSorted() === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <span className="ml-2">
                                                    {header.column.getIsSorted() === 'asc' ? (
                                                        <IconCaretDown className="w-4 h-4" />
                                                    ) : header.column.getIsSorted() === 'desc' ? (
                                                        <IconCaretsDown className="w-4 h-4" />
                                                    ) : (
                                                        <span className="w-4 h-4" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-10 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="text-primary bg-primary/10 rounded-full p-4 mb-4">
                                            <IconMenuDocumentation className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                                        <p className="text-gray-500 text-sm">There are no documents matching your current filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <tr className="hover:bg-gray-50 cursor-pointer border-t border-gray-200" aria-expanded={expandedRowId === row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="p-3 text-sm"
                                                onClick={(e) => {
                                                    // Prevent row expansion if clicking on the actions cell
                                                    if (cell.column.id !== 'actions') {
                                                        toggleRowExpansion(row.id);
                                                    }
                                                }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                    {expandedRowId === row.id && (
                                        <tr>
                                            <td colSpan={row.getVisibleCells().length} className="p-0">
                                                <DocumentDetailsPanel document={row.original} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <TablePagination table={table} />
        </div>
    );
};

export default MyDocuments;
