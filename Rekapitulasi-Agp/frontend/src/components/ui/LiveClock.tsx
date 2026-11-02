'use client';

import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

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

      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: false,
      });

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
    <div
      className={`inline-flex items-center gap-2 bg-[#061C18] text-[#ffffff] px-3 py-1.5 rounded-[8px] border border-[#076653] ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26] animate-pulse shrink-0" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 leading-none font-mono">
        <span className="font-semibold text-xs text-[#E3EF26] tracking-wider">{timeStr}</span>
        <span className="hidden md:inline text-[#7AA89C]">|</span>
        <span className="hidden md:inline text-[11px] font-normal text-[#B8D8D0]">{dateStr}</span>
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
  initialSeconds = 600,
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

  const isWarning = secondsLeft <= 120 && secondsLeft > 30;
  const isDanger = secondsLeft <= 30;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-[10px] font-mono border transition-all duration-300 ${
        isDanger
          ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
          : isWarning
          ? 'bg-[#076653] text-[#E3EF26] border-[#E3EF26]/50'
          : 'bg-[#061C18] text-[#E3EF26] border-[#076653]'
      }`}
    >
      <Timer className="w-4 h-4 shrink-0" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-medium tracking-wider text-[#B8D8D0]">
          {isDanger ? 'Sisa Waktu Tampil!' : isWarning ? 'Persiapan Akhir' : 'Durasi Waktu Arena'}
        </span>
        <span className="text-base font-bold tracking-widest leading-tight text-[#ffffff]">
          {formattedMinutes}:{formattedSeconds}
        </span>
      </div>
    </div>
  );
};
