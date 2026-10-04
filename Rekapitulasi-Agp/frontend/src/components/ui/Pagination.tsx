'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startItem = itemsPerPage && totalItems ? (currentPage - 1) * itemsPerPage + 1 : undefined;
  const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : undefined;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-green-100 ${className}`}>
      {/* Items count info */}
      <div className="text-xs text-green-700/80 font-medium">
        {startItem && endItem && totalItems ? (
          <span>
            Menampilkan <strong className="font-mono font-bold text-green-900">{startItem}</strong> - <strong className="font-mono font-bold text-green-900">{endItem}</strong> dari <strong className="font-mono font-bold text-green-900">{totalItems}</strong> data
          </span>
        ) : (
          <span>
            Halaman <strong className="font-mono font-bold text-green-900">{currentPage}</strong> dari <strong className="font-mono font-bold text-green-900">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman Sebelumnya"
          className="p-2 rounded-lg bg-white border border-green-200 text-green-800 hover:bg-green-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) => (
          <React.Fragment key={idx}>
            {page === '...' ? (
              <span className="px-2 text-xs text-green-600/60 font-mono">...</span>
            ) : (
              <button
                type="button"
                onClick={() => onPageChange(page as number)}
                className={`min-w-[36px] h-9 px-2 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer shadow-sm ${
                  currentPage === page
                    ? 'bg-green-700 text-white border border-green-700'
                    : 'bg-white text-green-800 border border-green-200 hover:bg-green-50'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Halaman Selanjutnya"
          className="p-2 rounded-lg bg-white border border-green-200 text-green-800 hover:bg-green-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
