'use client';

import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  onOpenAbout?: () => void;
}

export function Header({ onOpenAbout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-10 flex items-center justify-between">

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Global Postal Data"
            className="w-6 h-6 object-contain shrink-0"
          />
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            Global Postal Data
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>0 External APIs</span>
          </div>

          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Dataset Info
            </button>
          )}

          <ThemeSwitcher />
        </div>

      </div>
    </header>
  );
}
