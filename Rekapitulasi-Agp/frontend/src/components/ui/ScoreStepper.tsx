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
    <div
      className={`inline-flex items-center gap-1.5 bg-[#082620] p-1 rounded-[10px] border border-[#076653] key-card ${className}`}
    >
      {/* Decrement Button (Touch target >= 40-44px) */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isMin || disabled}
        aria-label="Kurangi nilai"
        className="w-10 h-10 rounded-[8px] bg-[#076653] border border-[#E3EF26]/25 text-[#ffffff] font-bold text-base hover:bg-[#E3EF26] hover:text-[#0C342C] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
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
        className="w-16 sm:w-20 h-10 text-center rounded-[8px] bg-[#061C18] border border-[#076653] focus:border-[#E3EF26] outline-none text-sm font-mono font-bold text-[#E3EF26] shadow-inner"
        placeholder="-"
      />

      {/* Increment Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={isMax || disabled}
        aria-label="Tambah nilai"
        className="w-10 h-10 rounded-[8px] bg-[#076653] border border-[#E3EF26]/25 text-[#ffffff] font-bold text-base hover:bg-[#E3EF26] hover:text-[#0C342C] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
      >
        +
      </button>

      {/* Quick Presets: MIN / MAX */}
      <div className="hidden sm:flex items-center gap-1 ml-1 pl-1.5 border-l border-[#076653]">
        <button
          type="button"
          onClick={() => handleSetPreset(minScore)}
          disabled={disabled}
          className="px-2.5 h-8 rounded-md bg-[#061C18] hover:bg-[#076653] text-[#B8D8D0] hover:text-[#ffffff] border border-[#076653] text-xs font-mono font-medium transition-colors cursor-pointer"
          title={`Set nilai minimum (${minScore})`}
        >
          MIN ({minScore})
        </button>
        <button
          type="button"
          onClick={() => handleSetPreset(maxScore)}
          disabled={disabled}
          className="px-2.5 h-8 rounded-md bg-[#076653] hover:bg-[#E3EF26] text-[#E3EF26] hover:text-[#0C342C] border border-[#E3EF26]/35 text-xs font-mono font-semibold transition-colors cursor-pointer"
          title={`Set nilai maksimum (${maxScore})`}
        >
          MAX ({maxScore})
        </button>
      </div>
    </div>
  );
};
