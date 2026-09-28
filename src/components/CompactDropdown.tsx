'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface CompactDropdownOption {
  value: string;
  label: string;
  secondaryLabel?: string;
  isSpecial?: boolean;
}

interface CompactDropdownProps {
  value: string;
  placeholder: string;
  options: CompactDropdownOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
  maxVisibleItems?: number; // default: 4
}

export function CompactDropdown({
  value,
  placeholder,
  options,
  onSelect,
  disabled = false,
  className = '',
  maxVisibleItems = 4,
}: CompactDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate max-height: each item is h-9 (36px) + list padding (8px total)
  // For 4 items: 4 * 36px + 8px = 152px
  const maxHeightPx = maxVisibleItems * 36 + 8;

  return (
    <div className={`relative flex-1 min-w-0 ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-7.5 px-2.5 flex items-center justify-between gap-1.5 rounded-md text-[10.5px] font-medium border text-left transition select-none ${
          disabled
            ? 'bg-slate-100/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-white shadow-xs'
            : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-400 focus:outline-none focus:border-indigo-500'
        }`}
      >
        <span className="truncate flex-1 min-w-0">
          {selectedOption ? (
            <span className={selectedOption.isSpecial ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}>
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>

        <svg
          className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[240px] max-w-[calc(100vw-2rem)] rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div
            ref={listRef}
            style={{ maxHeight: `${maxHeightPx}px` }}
            className="overflow-y-auto p-1 custom-scrollbar"
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-center text-[10.5px] text-slate-400">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSelect(option.value);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full h-9 px-2.5 rounded-md flex items-center justify-between gap-2 text-[10.5px] text-left transition select-none mb-0.5 last:mb-0 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/60'
                        : option.isSpecial
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-transparent'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="truncate flex-1 min-w-0">
                      <span className="truncate block">{option.label}</span>
                      {option.secondaryLabel && (
                        <span className="text-[9px] text-slate-400 block truncate">
                          {option.secondaryLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 ml-1">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
