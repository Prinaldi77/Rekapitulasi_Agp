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
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#076653] ${className}`}>
      {/* Items count info */}
      <div className="text-xs text-[#B8D8D0] font-mono">
        {startItem && endItem && totalItems ? (
          <span>
            Menampilkan <strong className="font-bold text-[#E3EF26]">{startItem}</strong> - <strong className="font-bold text-[#E3EF26]">{endItem}</strong> dari <strong className="font-bold text-[#ffffff]">{totalItems}</strong> data
          </span>
        ) : (
          <span>
            Halaman <strong className="font-bold text-[#E3EF26]">{currentPage}</strong> dari <strong className="font-bold text-[#ffffff]">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman Sebelumnya"
          className="p-2 rounded-[8px] bg-[#061C18] border border-[#076653] text-[#B8D8D0] hover:text-[#E3EF26] hover:bg-[#076653] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => (
          <React.Fragment key={idx}>
            {page === '...' ? (
              <span className="px-2 text-xs text-[#7AA89C] font-mono">...</span>
            ) : (
              <button
                type="button"
                onClick={() => onPageChange(page as number)}
                className={`min-w-[36px] h-9 px-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#E3EF26] text-[#0C342C] border border-[#E3EF26]'
                    : 'bg-[#061C18] text-[#B8D8D0] border border-[#076653] hover:text-[#ffffff] hover:bg-[#076653]'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Halaman Selanjutnya"
          className="p-2 rounded-[8px] bg-[#061C18] border border-[#076653] text-[#B8D8D0] hover:text-[#E3EF26] hover:bg-[#076653] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
