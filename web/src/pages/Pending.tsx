import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import IconPlus from '../components/Icon/IconPlus';
import IconSearch from '../components/Icon/IconSearch';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconHorizontalDots from '../components/Icon/IconHorizontalDots';
import IconMenuDocumentation from '../components/Icon/Menu/IconMenuDocumentation';
import IconCaretsDown from '../components/Icon/IconCaretsDown';
import Dropdown from '../components/Dropdown';
interface Participant {
    name: string;
    email: string;
    status: string;
    date: string;
    pendingReason?: string;
}

interface DocumentDetails {
    formFillers: Participant[];
    approvers: Participant[];
    signers: Participant[];
    receivers: Participant[];
}

interface PendingDocument {
    id: number;
    name: string;
    status: string;
    addedOn: string;
    formFillers: string[]; // Note: This is an array of strings in the main document
    approvers: string[];
    signers: string[];
    receivers: string[];
    initiator: string;
    email: string;
    documentDetails: DocumentDetails;
}

const pendingDocuments: PendingDocument[] = [
    {
        id: 1,
        name: 'Employee Contract.pdf',
        status: 'Pending',
        addedOn: '2023-11-22',
        formFillers: ['Alice Johnson', 'Bob Smith'],
        approvers: ['David Wilson'],
        signers: ['Emma Davis'],
        receivers: ['Frank Miller'],
        initiator: 'HR Manager',
        email: 'hr@example.com',
        documentDetails: {
            formFillers: [
                {
                    name: 'Alice Johnson',
                    email: 'alice@example.com',
                    status: 'Completed',
                    date: '2023-11-23',
                },
                {
                    name: 'Bob Smith',
                    email: 'bob@example.com',
                    status: 'Pending',
                    date: '2023-11-23',
                    pendingReason: 'Awaiting additional information',
                },
            ],
            approvers: [
                {
                    name: 'David Wilson',
                    email: 'david@example.com',
                    status: 'In Progress',
                    date: '2023-11-24',
                },
            ],
            signers: [
                {
                    name: 'Emma Davis',
                    email: 'emma@example.com',
                    status: 'Waiting',
                    date: '2023-11-25',
                },
            ],
            receivers: [
                {
                    name: 'Frank Miller',
                    email: 'frank@example.com',
                    status: 'Pending',
                    date: '2023-11-26',
                },
            ],
        },
    },
    // Add more pending documents as needed
];

const Pending = () => {
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [search, setSearch] = useState('');
    const [expandedDocument, setExpandedDocument] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [filteredDocuments, setFilteredDocuments] = useState<PendingDocument[]>(pendingDocuments);

    useEffect(() => {
        const filtered = pendingDocuments.filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase()) || doc.email.toLowerCase().includes(search.toLowerCase()));
        setFilteredDocuments(filtered);
    }, [search]);

    const handleDocumentClick = (documentId: number) => {
        setExpandedDocument(expandedDocument === documentId ? null : documentId);
    };

    const totalPages = Math.ceil(filteredDocuments.length / pageSize);
    const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-success';
            case 'Pending':
                return 'bg-warning';
            case 'In Progress':
                return 'bg-info';
            case 'Waiting':
                return 'bg-secondary';
            default:
                return 'bg-primary';
        }
    };

    return (
        <div className="panel mt-6">
            <div className="flex justify-between items-center mb-5">
                <Link to="/add-document">
                    <button className="btn btn-primary flex items-center">
                        <IconPlus className="w-5 h-5 mr-2" />
                        Upload New Document
                    </button>
                </Link>

                <div className="relative">
                    <input type="text" placeholder="Search..." className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <IconSearch className="absolute right-3 top-3" />
                </div>
            </div>

            <div className="table-responsive min-h-[600px] flex-1">
                <table className="table-striped w-full h-full">
                    <thead>
                        <tr>
                            <th>Document Name</th>
                            <th>Added On</th>
                            <th>Status</th>
                            <th>Form Fillers</th>
                            <th>Approvers</th>
                            <th>Signers</th>
                            <th>Receivers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedDocuments.map((doc) => (
                            <React.Fragment key={doc.id}>
                                <tr className="cursor-pointer hover:bg-primary/5" onClick={() => handleDocumentClick(doc.id)}>
                                    <td>
                                        <div className="flex items-center">
                                            <IconMenuDocumentation className="w-5 h-5 mr-2" />
                                            {doc.name}
                                        </div>
                                    </td>
                                    <td>{doc.addedOn}</td>
                                    <td>
                                        <span className="badge bg-warning">{doc.status}</span>
                                    </td>
                                    <td>{doc.formFillers.join(', ')}</td>
                                    <td>{doc.approvers.join(', ')}</td>
                                    <td>{doc.signers.join(', ')}</td>
                                    <td>{doc.receivers.join(', ')}</td>

                                    <td>
                                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                            <Dropdown
                                                offset={[0, 5]}
                                                placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                                button={
                                                    <button className="btn btn-sm btn-outline-primary p-2">
                                                        <IconHorizontalDots className="w-5 h-5" />
                                                    </button>
                                                }
                                            >
                                                <ul className="!min-w-[160px]">
                                                    <li>
                                                        <button type="button" className="w-full text-left px-4 py-2 hover:bg-primary/10">
                                                            View Details
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="w-full text-left px-4 py-2 hover:bg-primary/10">
                                                            Send Reminder
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="w-full text-left px-4 py-2 hover:bg-primary/10">
                                                            Download
                                                        </button>
                                                    </li>
                                                </ul>
                                            </Dropdown>
                                        </div>
                                    </td>
                                </tr>
                                {expandedDocument === doc.id && (
                                    <tr>
                                        <td colSpan={8}>
                                            <div className="bg-gray-50 p-4">
                                                <div className="grid grid-cols-3 gap-4 mb-4 bg-white p-3 rounded shadow-sm">
                                                    <div>
                                                        <span className="font-semibold">Initiator:</span> {doc.initiator}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Email:</span> {doc.email}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Document Added:</span> {doc.addedOn}
                                                    </div>
                                                </div>
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-primary/5">
                                                            <th>Role</th>
                                                            <th>Name</th>
                                                            <th>Email</th>
                                                            <th>Status</th>
                                                            <th>Date</th>
                                                            <th>Additional Info</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(doc.documentDetails).map(([role, participants]: [string, Participant[]]) =>
                                                            participants.map((participant: Participant, idx: number) => (
                                                                <tr key={`${role}-${idx}`} className="border-b">
                                                                    <td className="capitalize">{role.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                    <td>{participant.name}</td>
                                                                    <td>{participant.email}</td>
                                                                    <td>
                                                                        <span className={`badge ${getStatusBadgeColor(participant.status)}`}>{participant.status}</span>
                                                                    </td>
                                                                    <td>{participant.date}</td>
                                                                    <td>{participant.pendingReason && <span className="text-warning-dark">{participant.pendingReason}</span>}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-5">
                <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse">
                    <li>
                        <button
                            type="button"
                            className="flex justify-center font-semibold p-2 rounded-full transition bg-white-light text-dark hover:text-white hover:bg-primary disabled:opacity-50"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <IconCaretDown className="w-5 h-5 rotate-90 rtl:-rotate-90" />
                        </button>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                        <li key={index}>
                            <button
                                type="button"
                                className={`flex justify-center font-semibold px-3.5 py-2 rounded-full transition ${
                                    currentPage === index + 1 ? 'bg-primary text-white' : 'bg-white-light text-dark hover:text-white hover:bg-primary'
                                }`}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            type="button"
                            className="flex justify-center font-semibold p-2 rounded-full transition bg-white-light text-dark hover:text-white hover:bg-primary disabled:opacity-50"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <IconCaretDown className="w-5 h-5 -rotate-90 rtl:rotate-90" />
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Pending;
