// src/components/Documents/DocumentDetailsPanel.tsx
import React, { useState } from 'react';
import IconArrowForward from '../Icon/IconArrowForward';
import { ParticipantDetail, User } from '../../store/slices/documentSlice';

interface RoleGroupDetailsProps {
  roleTitle: string;
  members: (ParticipantDetail | User)[];
}

const RoleGroupDetails: React.FC<RoleGroupDetailsProps> = ({ roleTitle, members }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!members || members.length === 0) return null;

  const getStatusBadgeColor = (status: string | 'N/A'): string => {
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
  formFillers: ParticipantDetail[];
  approvers: ParticipantDetail[];
  signers: ParticipantDetail[];
  receivers: ParticipantDetail[];
}

const DocumentDetailsPanel: React.FC<DocumentDetailsPanelProps> = ({
  formFillers,
  approvers,
  signers,
  receivers,
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded-b-md shadow-inner transition-all duration-300">
      <RoleGroupDetails roleTitle="Form Fillers" members={formFillers} />
      <RoleGroupDetails roleTitle="Approvers" members={approvers} />
      <RoleGroupDetails roleTitle="Signers" members={signers} />
      <RoleGroupDetails roleTitle="Receivers" members={receivers} />
    </div>
  );
};

export default DocumentDetailsPanel;