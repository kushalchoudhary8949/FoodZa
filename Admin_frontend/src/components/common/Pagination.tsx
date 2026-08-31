import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  id?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  id = 'pagination',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= pageSize) return null;

  return (
    <div
      id={id}
      className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 sm:px-6 rounded-b-xl"
    >
      <div className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          id={`${id}-prev-btn`}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Prev
        </Button>
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700">
          {currentPage} / {totalPages}
        </span>
        <Button
          id={`${id}-next-btn`}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
