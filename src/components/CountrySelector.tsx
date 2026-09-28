'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { CountryConfig, CountryId } from '../config/countries/types';
import { AVAILABLE_COUNTRIES } from '../config/countries';

interface CountrySelectorProps {
  selectedCountry: CountryConfig;
  onSelectCountry: (country: CountryConfig) => void;
}

export function CountrySelector({ selectedCountry, onSelectCountry }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = AVAILABLE_COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.nativeName.toLowerCase().includes(q) ||
      c.isoAlpha2.toLowerCase().includes(q) ||
      c.isoAlpha3.toLowerCase().includes(q) ||
      c.isoNumeric.includes(q) ||
      c.phoneCode.includes(q)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (country: CountryConfig) => {
    onSelectCountry(country);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 truncate">
        Country
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full h-9 flex items-center justify-between px-2.5 rounded-lg border transition-all text-left bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none select-none shrink-0">{selectedCountry.flag}</span>
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
              {selectedCountry.name}
            </span>
            <span className="text-[10px] text-slate-400 font-normal truncate hidden sm:inline">
              ({selectedCountry.nativeName})
            </span>
            <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
              {selectedCountry.isoAlpha2}
            </span>
          </div>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Searchable Dropdown Combobox */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-[360px] sm:w-[440px] max-w-[calc(100vw-2rem)] rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">

          {/* Search Input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 text-xs">
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ISO code, or phone code..."
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Options List: shows 4 items before scrolling */}
          <div className="max-h-[212px] overflow-y-auto p-1.5 custom-scrollbar" role="listbox">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-[10.5px] text-slate-400">
                No matching country found.
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.id === selectedCountry.id;
                return (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleSelect(country)}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-start justify-between px-2.5 py-2 rounded-lg transition-all text-left mb-1 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="text-base leading-none select-none shrink-0 mt-0.5">{country.flag}</span>
                      <div className="min-w-0 flex-1">
                        {/* Top Line: ISO Alpha-2 + Country Name + Native Name */}
                        <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            {country.isoAlpha2}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {country.name}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-normal">
                            ({country.nativeName})
                          </span>
                        </div>

                        {/* Directly Underneath: Compact Labeled Identification Information */}
                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 font-mono leading-none">
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">ISO Alpha-2:</span>{' '}
                            <strong className="font-semibold text-slate-700 dark:text-slate-300">{country.isoAlpha2}</strong>
                          </span>
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">ISO Alpha-3:</span>{' '}
                            <strong className="font-semibold text-slate-700 dark:text-slate-300">{country.isoAlpha3}</strong>
                          </span>
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">Numeric:</span>{' '}
                            <strong className="font-semibold text-slate-700 dark:text-slate-300">{country.isoNumeric}</strong>
                          </span>
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">Phone Code:</span>{' '}
                            <strong className="font-semibold text-slate-700 dark:text-slate-300">{country.phoneCode}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 ml-2 mt-0.5">
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

