import React from 'react';
import { Button } from './Button';
import { Search } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-dashed border-green-200 bg-green-50/30 ${className}`}
    >
      <div className="text-green-600/40 mb-4 animate-bounce duration-[2000ms]">
        {icon || <Search className="w-12 h-12" />}
      </div>
      <h3 className="text-lg font-bold text-green-950 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-sm text-green-800/70 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
