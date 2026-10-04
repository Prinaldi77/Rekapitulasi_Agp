'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverGlow = true,
  onClick,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clickableStyle = onClick ? 'cursor-pointer active:scale-[0.99] transition-all duration-300' : '';
  const glowStyle = hoverGlow ? 'hover:shadow-md hover:border-green-300 transition-all duration-300' : '';

  return (
    <motion.div
      onClick={onClick}
      whileHover={shouldReduceMotion || !hoverGlow ? {} : { y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-white border border-green-200/80 rounded-2xl p-6 shadow-sm ${clickableStyle} ${glowStyle} ${className}`}
    >
      {children}
    </motion.div>
  );
};
