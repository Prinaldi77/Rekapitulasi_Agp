'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary:   'bg-green-800 hover:bg-green-900 text-white shadow-sm focus:ring-green-800',
    secondary: 'bg-green-100/50 hover:bg-green-100 text-green-900 border border-transparent focus:ring-green-500',
    outline:   'border border-green-200 bg-white hover:bg-green-50 text-green-800 focus:ring-green-500',
    danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <motion.button
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
      transition={{ duration: 0.12 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
};
