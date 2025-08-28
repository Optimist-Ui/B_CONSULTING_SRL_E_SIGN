// src/components/Documents/TablePagination.tsx
import React from 'react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border-gray-300 rounded-md px-2 py-1 w-20 text-sm focus:border-primary focus:ring focus:ring-primary/20"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          className="border border-primary text-primary px-3 py-1 rounded-md text-sm hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <button
          className="border border-primary text-primary px-3 py-1 rounded-md text-sm hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TablePagination;