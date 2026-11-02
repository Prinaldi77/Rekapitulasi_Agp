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
  const clickableStyle = onClick ? 'cursor-pointer active:scale-[0.99] transition-all duration-200' : '';
  const glowStyle = hoverGlow ? 'key-card-hover' : '';

  return (
    <motion.div
      onClick={onClick}
      whileHover={shouldReduceMotion || !hoverGlow ? {} : { y: -1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`bg-[#082620] rounded-[16px] p-6 key-card text-[#ffffff] ${clickableStyle} ${glowStyle} ${className}`}
    >
      {children}
    </motion.div>
  );
};
