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
  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-[8px] transition-all duration-200 active:scale-[0.98] focus:outline-none disabled:opacity-45 disabled:pointer-events-none cursor-pointer';

  const variants = {
    // Electric Lime (#E3EF26) primary CTA with Deep Forest (#0C342C) text (14.2:1 AAA contrast)
    primary:
      'bg-[#E3EF26] hover:bg-[#eef842] text-[#0C342C] shadow-key-btn border border-[#E3EF26] font-bold',
    // Rich Emerald (#076653) surface with inset highlight
    secondary:
      'bg-[#076653] hover:bg-[#097b64] text-[#ffffff] border border-[#E3EF26]/25 shadow-[rgba(227,239,38,0.08)_0px_1px_0px_0px_inset]',
    // Ghost / Hairline border button on forest surface
    outline:
      'bg-transparent hover:bg-[#076653]/50 text-[#B8D8D0] hover:text-[#E3EF26] border border-[#076653]',
    // Destructive action
    danger:
      'bg-rose-950/70 hover:bg-rose-500 text-rose-300 hover:text-[#0C342C] border border-rose-500/40 font-semibold',
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-[13px] min-h-[42px]',
    lg: 'px-6 py-3 text-sm min-h-[46px]',
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
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
};
