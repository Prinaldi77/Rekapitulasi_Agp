import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  className = '',
  label,
  error,
  helperText,
  id,
  type = 'text',
  icon,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-mono font-medium text-[#B8D8D0] tracking-[0.06em] uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7AA89C] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`w-full ${icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2.5 rounded-[8px] bg-[#061C18] border border-[#076653] focus:border-[#E3EF26] focus:bg-[#082620] outline-none text-[#ffffff] font-normal placeholder-[#7AA89C] text-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-[rgba(255,255,255,0.03)_0px_1px_0px_0px_inset] ${
            error ? 'border-rose-400 focus:border-rose-400' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-300 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#7AA89C]">{helperText}</p>
      ) : null}
    </div>
  );
};
