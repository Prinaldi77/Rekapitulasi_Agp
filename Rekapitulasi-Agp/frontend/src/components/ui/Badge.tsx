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
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-xs';

  const variants = {
    primary:   'bg-green-50 text-green-700 border border-green-200/60 font-bold',
    secondary: 'bg-white text-green-800 border border-green-200/80 font-bold',
    warning:   'bg-amber-50 text-amber-700 border border-amber-200/60 font-bold',
    danger:    'bg-red-50 text-red-700 border border-red-200/60 font-bold',
    info:      'bg-blue-50 text-blue-700 border border-blue-200/60 font-bold',
    success:   'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
