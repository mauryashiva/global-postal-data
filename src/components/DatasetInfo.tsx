'use client';

import React, { useState, useEffect } from 'react';
import type { DatasetStats } from '../config/countries/types';
import { AVAILABLE_COUNTRIES } from '../config/countries';

export function DatasetInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [statsMap, setStatsMap] = useState<Record<string, DatasetStats>>({});

  useEffect(() => {
    if (!isOpen) return;
    AVAILABLE_COUNTRIES.forEach((c) => {
      if (statsMap[c.id]) return;
      c.getDatasetStats()
        .then((stats) => {
          setStatsMap((prev) => ({ ...prev, [c.id]: stats }));
        })
        .catch(console.error);
    });
  }, [isOpen]);

  return (
    <div className="mt-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            📦 Local Datasets
            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              {AVAILABLE_COUNTRIES.length} Countries
            </span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-[9.5px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            100% Offline · 0 Network Latency
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3.5 py-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {AVAILABLE_COUNTRIES.map((c) => {
              const stats = statsMap[c.id];
              return (
                <div
                  key={c.id}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10.5px] text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{c.flag}</span> {c.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">{c.isoAlpha2}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Divisions:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {stats?.divisionCountStr || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Codes:</span>
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {stats?.postalCodeCountStr || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
