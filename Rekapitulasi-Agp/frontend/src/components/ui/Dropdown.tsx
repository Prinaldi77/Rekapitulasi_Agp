import React, { useState, useEffect, useRef } from 'react';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const alignments = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute mt-2 w-56 rounded-xl border border-green-200 bg-white shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${alignments[align]}`}
        >
          <div className="py-1.5 flex flex-col">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm text-left font-medium transition-colors cursor-pointer w-full ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-800 hover:bg-green-50 hover:text-green-950'
                }`}
              >
                {item.icon && <span className={item.danger ? "text-red-500" : "text-green-600/60"}>{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
