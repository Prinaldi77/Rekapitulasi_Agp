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
        {[1, 2, 3, 4].map(i => (
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
      <div className="w-full overflow-x-auto touch-pan-x rounded-2xl border border-green-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-green-200 bg-green-100/90 text-[10px] font-black uppercase text-green-950 tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="py-3.5 px-5">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100 text-xs font-semibold text-black">
            {data.map((item, index) => (
              <tr key={index} className="hover-kirani-row transition-all duration-200 cursor-pointer">
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
