'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 py-1.5 transition-colors">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-[10px] tracking-tight text-slate-900 dark:text-white">Global Postal Data</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 hidden sm:inline">100% Local Offline Postal Intelligence</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 overflow-x-auto custom-scrollbar flex-1 justify-end whitespace-nowrap">
          <span>🇮🇳 IN</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇨🇳 CN</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇦🇫 AF</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇪🇬 EG</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇰🇷 KR</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇺🇸 US</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇬🇧 GB</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇯🇵 JP</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇮🇩 ID</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇲🇾 MY</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇱🇰 LK</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇻🇳 VN</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>🇨🇦 CA</span><span className="text-slate-300 dark:text-slate-700">·</span>
          <span>© 2026 Global Postal Data</span>
        </div>
      </div>
    </footer>
  );
}
