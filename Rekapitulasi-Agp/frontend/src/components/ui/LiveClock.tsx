'use client';

import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  showSeconds?: boolean;
  className?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({ showSeconds = true, className = '' }) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      
      // Format Jam Digital: 14:35:12 WIB
      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: false,
      });

      // Format Tanggal: Kamis, 6 Agustus 2026
      const date = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      setTimeStr(`${time} WIB`);
      setDateStr(date);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [showSeconds]);

  if (!mounted || !timeStr) return null;

  return (
    <div className={`inline-flex items-center gap-2 bg-green-950 text-white px-3.5 py-1.5 rounded-xl border border-green-800 shadow-sm ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 leading-none font-mono">
        <span className="font-black text-xs text-emerald-300 tracking-wider">{timeStr}</span>
        <span className="hidden md:inline text-green-400/50">&bull;</span>
        <span className="hidden md:inline text-[10px] font-bold text-green-200/80">{dateStr}</span>
      </div>
    </div>
  );
};

interface PerformanceTimerProps {
  initialSeconds?: number;
  isRunning?: boolean;
  onTimeUp?: () => void;
}

export const PerformanceTimer: React.FC<PerformanceTimerProps> = ({
  initialSeconds = 600, // Default 10 Menit Alokasi Waktu Tampil
  isRunning = true,
  onTimeUp,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onTimeUp]);

  if (!mounted) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  const isWarning = secondsLeft <= 120 && secondsLeft > 30; // 2 Menit Terakhir
  const isDanger = secondsLeft <= 30; // 30 Detik Terakhir

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl font-mono font-black border transition-all duration-300 ${
        isDanger
          ? 'bg-red-50 text-red-700 border-red-300 animate-pulse shadow-red-500/10'
          : isWarning
          ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-amber-500/10'
          : 'bg-green-50 text-green-900 border-green-300 shadow-green-900/5'
      }`}
    >
      <span className="text-sm">⏱️</span>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase font-bold tracking-wider text-green-800">
          {isDanger ? '⚠️ Sisa Waktu Tampil!' : isWarning ? '⏳ Persiapan Akhir' : 'Durasi Waktu Arena'}
        </span>
        <span className="text-base font-black tracking-widest leading-tight">
          {formattedMinutes}:{formattedSeconds}
        </span>
      </div>
    </div>
  );
};
