'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 4000,
  onClose,
}) => {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
  };

  const styles = {
    success: 'bg-white border-green-200 text-green-900 shadow-green-900/10',
    info:    'bg-white border-sky-200 text-sky-900 shadow-sky-900/10',
    warning: 'bg-white border-amber-200 text-amber-900 shadow-amber-900/10',
    error:   'bg-white border-red-200 text-red-900 shadow-red-900/10',
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl border shadow-xl ${styles[type]}`}
    >
      <span className="text-base">{icons[type]}</span>
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="ml-3 text-green-600/60 hover:text-green-900 p-1 rounded transition-colors cursor-pointer"
        aria-label="Dismiss toast"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};
