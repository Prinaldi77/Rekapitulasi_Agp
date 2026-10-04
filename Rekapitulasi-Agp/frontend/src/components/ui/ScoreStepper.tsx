'use client';

import React from 'react';

export interface ScoreStepperProps {
  value: number | string;
  minScore?: number;
  maxScore?: number;
  step?: number;
  onChange: (val: number) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}

export const ScoreStepper: React.FC<ScoreStepperProps> = ({
  value,
  minScore = 0,
  maxScore = 100,
  step = 1,
  onChange,
  inputRef,
  onKeyDown,
  disabled = false,
  className = '',
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const isMin = numericValue <= minScore;
  const isMax = numericValue >= maxScore;

  const handleDecrement = () => {
    if (isMin || disabled) return;
    const newVal = Math.max(minScore, numericValue - step);
    onChange(newVal);
  };

  const handleIncrement = () => {
    if (isMax || disabled) return;
    const newVal = Math.min(maxScore, numericValue + step);
    onChange(newVal);
  };

  const handleSetPreset = (target: number) => {
    if (disabled) return;
    const clamped = Math.min(Math.max(target, minScore), maxScore);
    onChange(clamped);
  };

  return (
    <div className={`inline-flex items-center gap-1 bg-green-50 p-1 rounded-xl border border-green-300 shadow-sm ${className}`}>
      {/* Decrement Button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isMin || disabled}
        aria-label="Kurangi nilai"
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-green-300 text-green-950 font-black text-base hover:bg-[#052e16] hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-xs"
      >
        −
      </button>

      {/* Direct Numeric Input */}
      <input
        type="number"
        min={minScore}
        max={maxScore}
        value={value === '' ? '' : numericValue}
        ref={inputRef}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange(0);
          } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
              onChange(Math.min(Math.max(num, minScore), maxScore));
            }
          }
        }}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="w-16 sm:w-20 text-center py-1.5 rounded-lg bg-white border border-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/30 outline-none text-sm font-mono font-black text-black shadow-inner"
        placeholder="-"
      />

      {/* Increment Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={isMax || disabled}
        aria-label="Tambah nilai"
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-green-300 text-green-950 font-black text-base hover:bg-[#052e16] hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-xs"
      >
        +
      </button>

      {/* Quick Presets: MIN / MAX */}
      <div className="hidden sm:flex items-center gap-1 ml-1 pl-1 border-l border-green-300">
        <button
          type="button"
          onClick={() => handleSetPreset(minScore)}
          disabled={disabled}
          className="px-2 py-1 text-[9px] font-black rounded bg-white text-green-950 border border-green-300 hover:bg-[#052e16] hover:text-white active:scale-95 transition-all cursor-pointer shadow-xs"
          title={`Set Minimum (${minScore})`}
        >
          MIN
        </button>
        <button
          type="button"
          onClick={() => handleSetPreset(maxScore)}
          disabled={disabled}
          className="px-2 py-1 text-[9px] font-black rounded bg-white text-green-950 border border-green-300 hover:bg-[#052e16] hover:text-white active:scale-95 transition-all cursor-pointer shadow-xs"
          title={`Set Maksimum (${maxScore})`}
        >
          MAX
        </button>
      </div>
    </div>
  );
};
