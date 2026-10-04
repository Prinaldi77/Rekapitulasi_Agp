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
        <label htmlFor={id} className="text-xs font-bold text-green-900 tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600/50 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 rounded-xl bg-white border border-green-200 focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-green-950 font-medium placeholder-green-600/50 text-sm transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none shadow-sm ${
            error ? 'border-red-500 focus:border-red-600 focus:ring-red-600/30' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600 font-bold">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-green-700/80 font-medium">{helperText}</p>
      ) : null}
    </div>
  );
};
