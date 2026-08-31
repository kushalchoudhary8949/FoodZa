import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex items-center gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 ${c === 0 ? 'w-32' : c === 1 ? 'w-24' : 'w-16 flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
