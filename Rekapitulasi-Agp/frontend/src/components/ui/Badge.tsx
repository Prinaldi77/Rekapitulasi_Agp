import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'info' | 'success';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const baseStyle =
    'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-200';

  const variants = {
    primary:   'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/35',
    secondary: 'bg-[#061C18] text-[#B8D8D0] border border-[#076653]',
    warning:   'bg-[#076653]/70 text-[#E3EF26] border border-[#E3EF26]/50',
    danger:    'bg-rose-950/70 text-rose-300 border border-rose-500/40',
    info:      'bg-[#061C18] text-[#38bdf8] border border-[#38bdf8]/35',
    success:   'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/40',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
