'use client';

import React from 'react';
import { DateFilterMode, DateRange, getRange } from '@/lib/dateRanges';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateFilterBarProps {
  activeMode: DateFilterMode;
  selectedDate: string;
  selectedYear: number;
  currentRange: DateRange;
  onChange: (mode: DateFilterMode, date: string, year: number, range: DateRange) => void;
}

export default function DateFilterBar({
  activeMode,
  selectedDate,
  selectedYear,
  currentRange,
  onChange,
}: DateFilterBarProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleModeChange = (mode: DateFilterMode, specificDate = selectedDate, specificYear = selectedYear) => {
    const range = getRange(mode, { date: specificDate, year: specificYear });
    onChange(mode, specificDate, specificYear, range);
  };

  return (
    <div className="bg-white border border-brand-border rounded-brand p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Quick Filter Buttons */}
        <button
          onClick={() => handleModeChange('today')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeMode === 'today'
              ? 'bg-brand-teal text-white shadow-xs'
              : 'bg-brand-bg text-brand-navy hover:bg-slate-200 border border-brand-border'
          }`}
        >
          Today
        </button>

        <button
          onClick={() => handleModeChange('week')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeMode === 'week'
              ? 'bg-brand-teal text-white shadow-xs'
              : 'bg-brand-bg text-brand-navy hover:bg-slate-200 border border-brand-border'
          }`}
        >
          This Week
        </button>

        <button
          onClick={() => handleModeChange('month')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeMode === 'month'
              ? 'bg-brand-teal text-white shadow-xs'
              : 'bg-brand-bg text-brand-navy hover:bg-slate-200 border border-brand-border'
          }`}
        >
          This Month
        </button>

        <button
          onClick={() => handleModeChange('year')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeMode === 'year'
              ? 'bg-brand-teal text-white shadow-xs'
              : 'bg-brand-bg text-brand-navy hover:bg-slate-200 border border-brand-border'
          }`}
        >
          This Year
        </button>

        {/* Date Selector */}
        <div className="flex items-center gap-2 border border-brand-border rounded-lg bg-brand-bg px-3 py-1.5 focus-within:ring-1 focus-within:ring-brand-teal">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                handleModeChange('date', e.target.value);
              }
            }}
            className="bg-transparent text-xs font-semibold text-brand-navy focus:outline-none w-28 cursor-pointer"
          />
        </div>

        {/* Year Selector */}
        <div className="relative flex items-center border border-brand-border rounded-lg bg-brand-bg px-3 py-1.5 focus-within:ring-1 focus-within:ring-brand-teal">
          <select
            value={selectedYear}
            onChange={(e) => handleModeChange('selectYear', selectedDate, Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-brand-navy focus:outline-none appearance-none pr-6 cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 pointer-events-none" />
        </div>
      </div>

      {/* Date Range Summary Header */}
      <div className="bg-brand-bg border border-brand-border rounded-lg px-4 py-3 flex items-center justify-between text-xs md:text-sm">
        <span className="font-semibold text-slate-500">Active View Window:</span>
        <span className="font-bold text-brand-navy font-mono">
          {currentRange.label} ( {formatDate(currentRange.start)} – {formatDate(currentRange.end)} )
        </span>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}
