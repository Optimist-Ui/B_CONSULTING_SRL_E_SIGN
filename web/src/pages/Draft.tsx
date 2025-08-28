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

const draftDocuments = [
    {
        id: 1,
        name: 'Contract Agreement.pdf',
        status: 'Draft',
        addedOn: '2023-11-20',
        formFillers: ['John Doe', 'Jane Smith'],
        approvers: ['Mike Johnson'],
        signers: ['Sarah Wilson'],
        receivers: ['Tom Brown'],
        initiator: 'Admin User',
        email: 'admin@example.com',
        documentDetails: {
            formFillers: [
                { 
                    name: 'John Doe', 
                    email: 'john@example.com', 
                    status: 'Rejected', 
                    date: '2023-11-21',
                    rejectedBy: {
                        name: 'Admin User',
                        email: 'admin@example.com',
                        reason: 'Missing required information in sections 2 and 3'
                    }
                },
                { name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', date: '2023-11-21' }
            ],
            approvers: [{ name: 'Mike Johnson', email: 'mike@example.com', status: 'Pending', date: '2023-11-22' }],
            signers: [{ name: 'Sarah Wilson', email: 'sarah@example.com', status: 'Waiting', date: '2023-11-23' }],
            receivers: [{ name: 'Tom Brown', email: 'tom@example.com', status: 'Not Sent', date: '2023-11-24' }]
        }
    }
    // Add more draft documents as needed
];

const Draft = () => {
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [search, setSearch] = useState('');
    const [expandedDocument, setExpandedDocument] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [filteredDocuments, setFilteredDocuments] = useState(draftDocuments);

    useEffect(() => {
        const filtered = draftDocuments.filter(doc => 
            doc.name.toLowerCase().includes(search.toLowerCase()) ||
            doc.email.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredDocuments(filtered);
    }, [search]);

    const handleDocumentClick = (documentId: number) => {
        setExpandedDocument(expandedDocument === documentId ? null : documentId);
    };

    const totalPages = Math.ceil(filteredDocuments.length / pageSize);
    const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="form-input" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <IconSearch className="absolute right-3 top-3" />
                </div>
            </div>

            <div className="table-responsive">
                <table className="table-striped w-full">
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
                        {paginatedDocuments.map(doc => (
                            <React.Fragment key={doc.id}>
                                <tr className="cursor-pointer" onClick={() => handleDocumentClick(doc.id)}>
                                    <td>
                                        <div className="flex items-center">
                                            <IconMenuDocumentation className="w-5 h-5 mr-2" />
                                            {doc.name}
                                        </div>
                                    </td>
                                    <td>{doc.addedOn}</td>
                                    <td>
                                        <span className="badge bg-warning">
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td>{doc.formFillers.join(', ')}</td>
                                    <td>{doc.approvers.join(', ')}</td>
                                    <td>{doc.signers.join(', ')}</td>
                                    <td>{doc.receivers.join(', ')}</td>
                                    <td>
                                        <div className="dropdown">
                                            <Dropdown
                                                offset={[0, 5]}
                                                placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                                button={
                                                    <button className="btn btn-sm btn-outline-primary">
                                                        <IconHorizontalDots className="opacity-70" />
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
                                                            Download
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="w-full text-left px-4 py-2 hover:bg-primary/10 text-danger">
                                                            Delete
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
                                                <div className="grid grid-cols-3 gap-4 mb-4 bg-white p-3 rounded">
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
                                                            <th>Rejection Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(doc.documentDetails).map(([role, participants]) =>
                                                            participants.map((participant: any, idx: number) => (
                                                                <tr key={`${role}-${idx}`} className="border-b">
                                                                    <td className="capitalize">{role.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                    <td>{participant.name}</td>
                                                                    <td>{participant.email}</td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            participant.status === 'Rejected' ? 'bg-danger' :
                                                                            participant.status === 'Pending' ? 'bg-warning' :
                                                                            participant.status === 'Completed' ? 'bg-success' : 'bg-info'
                                                                        }`}>
                                                                            {participant.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>{participant.date}</td>
                                                                    <td>
                                                                        {participant.rejectedBy && (
                                                                            <div>
                                                                                <p><span className="font-semibold">Rejected by:</span> {participant.rejectedBy.name}</p>
                                                                                <p><span className="font-semibold">Reason:</span> {participant.rejectedBy.reason}</p>
                                                                            </div>
                                                                        )}
                                                                    </td>
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
                                    currentPage === index + 1
                                        ? 'bg-primary text-white'
                                        : 'bg-white-light text-dark hover:text-white hover:bg-primary'
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

export default Draft;