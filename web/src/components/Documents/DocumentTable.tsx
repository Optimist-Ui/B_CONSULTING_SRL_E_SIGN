import React, { ComponentType, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, ColumnDef } from '@tanstack/react-table';
import IconMenuDocumentation from '../Icon/Menu/IconMenuDocumentation';
import IconBell from '../Icon/IconBell';
import IconClock from '../Icon/IconClock';
import IconXCircle from '../Icon/IconXCircle';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconPlus from '../Icon/IconPlus';
import IconArrowForward from '../Icon/IconArrowForward';
import IconMail from '../Icon/IconMail';
import IconPhone from '../Icon/IconPhone';
import DocumentDetailsPanel from './DocumentDetailsPanel';
import { Document, ParticipantDetail, User } from '../../store/slices/documentSlice';
import ConfirmationModal from '../common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import IconEye from '../Icon/IconEye';
import { FiEdit3 } from 'react-icons/fi';

const FiEdit3Typed = FiEdit3 as ComponentType<{ className?: string }>;
interface DocumentTableProps {
    documents: Document[];
    loading: boolean;
    expandedRows: Set<string>;
    toggleExpansion: (rowId: string) => void;
    sortConfig: { key: keyof Document | null; direction: 'asc' | 'desc' };
    onSort: (key: keyof Document, direction: 'asc' | 'desc') => void;
    onDownload: (id: string) => void;
    onNotify: (id: string) => void;
    onViewHistory: (id: string) => void;
    onReassign: (id: string, data: any) => void;
    onSkip: (id: string) => void;
    onRevoke: (id: string, reason?: string) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, loading, expandedRows, toggleExpansion, onDownload, onNotify, onViewHistory, onReassign, onSkip, onRevoke }) => {
    const navigate = useNavigate();
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [documentToRevoke, setDocumentToRevoke] = useState<Document | null>(null);
    const handleRevokeClick = (document: Document) => {
        setDocumentToRevoke(document);
        setIsRevokeModalOpen(true);
    };

    const handleConfirmRevoke = (reason: string) => {
        setIsRevokeModalOpen(false);
        if (documentToRevoke) {
            onRevoke(documentToRevoke.id, reason);
        }
        // Cleanup is handled by the modal's onClose
    };

    const getStatusBadgeColor = (status: string): string => {
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

    const renderSingleStatusDot = (members: (ParticipantDetail | User)[]): JSX.Element => {
        // Defines the order and color for tooltip parts
        const statusOrder: { key: StatusCountKeys; color: string }[] = [
            { key: 'Completed', color: 'bg-green-500' },
            { key: 'In Progress', color: 'bg-gray-500' },
            { key: 'Waiting', color: 'bg-gray-500' },
            { key: 'Rejected', color: 'bg-red-500' },
            { key: 'Not Sent', color: 'bg-gray-500' },
        ];

        type StatusCountKeys = 'Completed' | 'In Progress' | 'Waiting' | 'Not Sent' | 'Rejected';

        const total = members.length;
        if (total === 0) {
            return (
                <div className="relative flex items-center group">
                    <span className="w-3 h-3 rounded-full bg-gray-500" />
                </div>
            );
        }

        const statusCounts = members.reduce((acc, member) => {
            const status = ('status' in member && member.status ? member.status : 'Not Sent') as StatusCountKeys;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<StatusCountKeys, number>);

        const completedCount = statusCounts.Completed || 0;
        const rejectedCount = statusCounts.Rejected || 0;
        const pendingCount = total - completedCount - rejectedCount;

        // New logic to determine the dot color without hovering
        let dotColor: string;
        if (completedCount === total) {
            dotColor = 'bg-green-500'; // All done
        } else if (rejectedCount === total) {
            dotColor = 'bg-red-500'; // All rejected
        } else if (completedCount > 0 && (pendingCount > 0 || rejectedCount > 0)) {
            dotColor = 'bg-orange-500'; // Partially completed
        } else {
            dotColor = 'bg-gray-500'; // None completed yet
        }

        const tooltipContent = (
            <div className="flex items-center">
                {statusOrder
                    .filter((s) => statusCounts[s.key] > 0)
                    .map((s, index, arr) => (
                        <React.Fragment key={s.key}>
                            <span className="flex items-center gap-1">
                                <span className="text-gray-800 text-xs">{statusCounts[s.key]}</span>
                                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                            </span>
                            {index < arr.length - 1 && <span className="text-gray-800 text-xs mx-1">-</span>}
                        </React.Fragment>
                    ))}
            </div>
        );

        return (
            <div className="relative flex items-center group">
                <span className={`w-3 h-3 rounded-full ${dotColor}`} />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-200 rounded-md px-2 py-1 z-10 flex items-center pointer-events-none">
                    {tooltipContent}
                </div>
            </div>
        );
    };

    const columnHelper = createColumnHelper<Document>();

    const columns = useMemo<ColumnDef<Document, any>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'Document Name',
                cell: ({ getValue }) => (
                    <div className="flex items-center font-medium text-primary">
                        <IconMenuDocumentation className="w-5 h-5 mr-2" />
                        {getValue()}
                    </div>
                ),
                enableSorting: true,
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ getValue }) => <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(getValue())}`}>{getValue()}</span>,
                enableSorting: true,
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
                                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => onDownload(row.original.id)}>
                                        <IconMenuDocumentation className="w-4 h-4 mr-2" />
                                        Download
                                    </button>
                                </li>
                                <li>
                                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => onNotify(row.original.id)}>
                                        <IconBell className="w-4 h-4 mr-2" />
                                        Notify/Reminder
                                    </button>
                                </li>
                                <li>
                                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => navigate(`/package/${row.original.id}`)}>
                                        <IconEye className="w-4 h-4 mr-2" />
                                        View Details
                                    </button>
                                </li>
                                {row.original.status === 'Draft' && (
                                    <li>
                                        <button
                                            className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white"
                                            onClick={() => navigate(`/add-document?draft=${row.original.id}`)}
                                        >
                                            <FiEdit3Typed className="w-4 h-4 mr-2" />
                                            Continue Editing
                                        </button>
                                    </li>
                                )}
                                {/* <li>
                                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => onViewHistory(row.original.id)}>
                                        <IconClock className="w-4 h-4 mr-2" />
                                        View History
                                    </button>
                                </li>
                                <li>
                                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => onReassign(row.original.id, {})}>
                                        <IconPlus className="w-4 h-4 mr-2" />
                                        Reassign
                                    </button>
                                </li>
                                <li>
                                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-primary hover:text-white" onClick={() => onSkip(row.original.id)}>
                                        <IconArrowForward className="w-4 h-4 mr-2" />
                                        Skip
                                    </button>
                                </li> */}
                                <li>
                                    <button className="w-full flex items-center px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleRevokeClick(row.original)}>
                                        <IconXCircle className="w-4 h-4 mr-2" />
                                        Revoke
                                    </button>
                                </li>
                            </ul>
                        </Dropdown>
                    </div>
                ),
            }),
        ],
        [onDownload, onNotify, onViewHistory, onReassign, onSkip, onRevoke]
    );

    const table = useReactTable({
        data: documents,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) {
        return <div>Loading documents...</div>;
    }

    return (
        <>
            <div className="h-[70vh] overflow-y-auto rounded-md border dark:bg-gray-900  border-gray-200">
                <table className="w-full border-collapse dark:bg-gray-900 bg-white">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="bg-gray-100 dark:bg-gray-900">
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="p-3 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                                        <div className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''} onClick={header.column.getToggleSortingHandler()}>
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
                                    <tr className="hover:bg-gray-50 cursor-pointer border-t border-gray-200" onClick={() => toggleExpansion(row.id)}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="p-3 text-sm">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                    {expandedRows.has(row.id) && (
                                        <tr>
                                            <td colSpan={row.getVisibleCells().length} className="p-0">
                                                <DocumentDetailsPanel
                                                    formFillers={row.original.formFillers}
                                                    approvers={row.original.approvers}
                                                    signers={row.original.signers}
                                                    receivers={row.original.receivers}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <ConfirmationModal
                isOpen={isRevokeModalOpen}
                onClose={() => setIsRevokeModalOpen(false)}
                onConfirm={handleConfirmRevoke}
                title="Revoke Document"
                message={`Are you sure you want to revoke the document "${documentToRevoke?.name}"? This action cannot be undone and will terminate the process for all participants.`}
                confirmText="Yes, Revoke"
            />
        </>
    );
};

export default DocumentTable;
