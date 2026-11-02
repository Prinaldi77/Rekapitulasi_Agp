import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'Tidak ada data',
  emptyDescription = 'Belum ada rekaman data yang tersimpan.',
  emptyIcon,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} className="my-4" />;
  }

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto touch-pan-x rounded-[16px] bg-[#082620] key-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#076653] bg-[#061C18] text-[11px] font-mono font-semibold uppercase text-[#E3EF26] tracking-[0.06em]">
              {columns.map((col) => (
                <th key={col.key} className="py-3.5 px-5">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#076653]/50 text-xs font-medium text-[#ffffff]">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-[#076653]/35 transition-all duration-150 cursor-pointer">
                {columns.map((col) => (
                  <td key={col.key} className="py-3.5 px-5">
                    {col.render ? col.render(item, index) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentPage && totalPages && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
