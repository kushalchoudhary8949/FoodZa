import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  id = 'empty-state',
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 my-4"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button id={`${id}-action-btn`} size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
