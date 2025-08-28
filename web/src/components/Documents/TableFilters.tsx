// src/components/Documents/TableFilters.tsx
import React from 'react';
import IconSearch from '../Icon/IconSearch';
import IconMenuDocumentation from '../Icon/Menu/IconMenuDocumentation';
import IconXCircle from '../Icon/IconXCircle';

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

export default TableFilters;