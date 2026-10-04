'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    text: 'h-4 w-full rounded-md',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  };

  return (
    <motion.div
      initial={{ opacity: 0.7 }}
      animate={shouldReduceMotion ? {} : { opacity: 0.35 }}
      transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      className={`bg-green-100 ${variants[variant]} ${className}`}
    />
  );
};
