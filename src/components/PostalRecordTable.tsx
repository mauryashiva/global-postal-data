'use client';

import React, { useState, useMemo } from 'react';
import type { UniversalPostalRecord, CountryConfig } from '../config/countries/types';

interface PostalRecordTableProps {
  records: UniversalPostalRecord[];
  selectedRecord: UniversalPostalRecord | null;
  onSelectRecord: (record: UniversalPostalRecord) => void;
  country: CountryConfig;
  onViewRecordDetail?: (record: UniversalPostalRecord) => void;
}

export function PostalRecordTable({
  records,
  selectedRecord,
  onSelectRecord,
  country,
  onViewRecordDetail,
}: PostalRecordTableProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredRecords = useMemo(() => {
    let list = records;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter((r) => {
        return (
          r.primaryName.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.districtCounty.toLowerCase().includes(q) ||
          (r.talukSubDistrict && r.talukSubDistrict.toLowerCase().includes(q))
        );
      });
    }

    if (sortKey) {
      const col = country.tableColumns.find((c) => c.key === sortKey);
      if (col) {
        list = [...list].sort((a, b) => {
          const valA = col.getValue(a).toLowerCase();
          const valB = col.getValue(b).toLowerCase();
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
      }
    }

    return list;
  }, [records, filterQuery, sortKey, sortAsc, country]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getBadgeClass = (variant: 'success' | 'warning' | 'info' | 'neutral') => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50';
      case 'warning':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';
      case 'info':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Search and count header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredRecords.length}</span> of {records.length} locations
        </div>

        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter table rows..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto max-h-72 custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold z-10 select-none">
              <tr>
                <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                {country.tableColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="py-2.5 px-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      {sortKey === col.key && (
                        <span className="text-[10px] text-indigo-500">
                          {sortAsc ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={country.tableColumns.length + 2}
                    className="py-8 text-center text-xs text-slate-400"
                  >
                    No records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => {
                  const isSelected = selectedRecord?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectRecord(r)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-medium'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3.5 text-center text-[11px] text-slate-400">
                        {isSelected ? '✓' : i + 1}
                      </td>

                      {country.tableColumns.map((col) => {
                        const val = col.getValue(r);
                        const badgeInfo = col.badge ? col.badge(r) : null;
                        return (
                          <td key={col.key} className="py-2.5 px-3.5 truncate max-w-xs">
                            {badgeInfo ? (
                              <span
                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block ${getBadgeClass(
                                  badgeInfo.variant
                                )}`}
                              >
                                {badgeInfo.text}
                              </span>
                            ) : (
                              <span>{val}</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onViewRecordDetail?.(r)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
