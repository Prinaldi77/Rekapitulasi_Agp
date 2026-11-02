'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

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
    success: <CheckCircle2 className="w-4 h-4 text-[#E3EF26] shrink-0" />,
    info:    <Info className="w-4 h-4 text-[#38bdf8] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#E3EF26] shrink-0" />,
    error:   <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  };

  const styles = {
    success: 'bg-[#082620] border-[#E3EF26]/50 text-[#ffffff]',
    info:    'bg-[#082620] border-[#38bdf8]/40 text-[#ffffff]',
    warning: 'bg-[#082620] border-[#E3EF26]/50 text-[#ffffff]',
    error:   'bg-rose-950/90 border-rose-500/50 text-[#ffffff]',
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3.5 rounded-[12px] border key-card ${styles[type]}`}
    >
      {icons[type]}
      <span className="text-xs sm:text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#B8D8D0] hover:text-[#E3EF26] p-1 rounded-[6px] transition-colors cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
