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
      className={`flex flex-col items-center justify-center text-center p-12 rounded-[16px] border border-dashed border-[#076653] bg-[#082620]/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#061C18] border border-[#076653] flex items-center justify-center text-[#E3EF26] mb-4">
        {icon || <Search className="w-5 h-5" />}
      </div>
      <h3 className="text-base font-semibold text-[#ffffff] uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#B8D8D0] max-w-sm mb-6 leading-relaxed">
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
