'use client';

import React, { useState, useEffect, useRef } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('postal_theme') as ThemeMode) || 'system';
    setTheme(saved);
    applyTheme(saved);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('postal_theme') === 'system' || !localStorage.getItem('postal_theme')) {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem('postal_theme', mode);
    applyTheme(mode);
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <div className="w-24 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  const getLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return '☀ Light';
      case 'dark':
        return '🌙 Dark';
      case 'system':
        return '⚙ System';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Theme Selector"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs"
      >
        <span>{getLabel(theme)}</span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => handleSelect('light')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
              theme === 'light'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>☀</span> Light
            </span>
            {theme === 'light' && <span className="text-indigo-600 dark:text-indigo-400">✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('dark')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
              theme === 'dark'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🌙</span> Dark
            </span>
            {theme === 'dark' && <span className="text-indigo-600 dark:text-indigo-400">✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('system')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
              theme === 'system'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>⚙</span> System
            </span>
            {theme === 'system' && <span className="text-indigo-600 dark:text-indigo-400">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
