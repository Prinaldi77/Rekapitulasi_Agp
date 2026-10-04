import React from 'react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  src,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n: string) => {
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-green-600 to-green-400 p-[1.5px] shadow-md ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-white font-bold text-green-800 overflow-hidden ${sizes[size]}`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
    </div>
  );
};
