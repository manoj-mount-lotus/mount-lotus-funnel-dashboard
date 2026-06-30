'use client';

import React, { useState, useEffect } from 'react';
import DateFilterBar from '@/components/DateFilterBar';
import KpiFunnelView from '@/components/KpiFunnelView';
import { DateFilterMode, DateRange, getRange } from '@/lib/dateRanges';
import { FunnelData, getFunnelData } from '@/lib/getFunnelData';
import { Loader2, LogOut, Shield, TrendingUp, Filter } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function FunnelPage() {
  const [activeMode, setActiveMode] = useState<DateFilterMode>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Default range: This Month
  const [currentRange, setCurrentRange] = useState<DateRange>(getRange('month'));
  
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunnel = async (range: DateRange) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFunnelData(range);
      setFunnelData(data);
    } catch (err: any) {
      console.error('Error fetching funnel data:', err);
      setError('Failed to aggregate funnel metrics. Please make sure database migrations were run.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel(currentRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRange]);

  const handleFilterChange = (mode: DateFilterMode, date: string, year: number, range: DateRange) => {
    setActiveMode(mode);
    setSelectedDate(date);
    setSelectedYear(year);
    setCurrentRange(range);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Check if funnel contains zero total metrics across all stages
  const isEmpty = funnelData
    ? funnelData.awareness.reach === 0 &&
      funnelData.interest.total === 0 &&
      funnelData.leads === 0 &&
      funnelData.doctorAppointments === 0 &&
      funnelData.patientVisits === 0 &&
      funnelData.testing === 0 &&
      funnelData.conversions === 0 &&
      funnelData.retention === 0
    : true;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col pb-12">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-6 border-b border-brand-border shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mount Lotus Eye &amp; ENT Hospital</h1>
            <p className="text-slate-300 text-sm font-mono mt-0.5">KPI Funnel View &amp; Marketing Analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 bg-brand-navy border border-slate-700 text-white hover:bg-opacity-90 px-4 py-2 rounded-brand text-sm font-semibold transition-all">
              <Shield className="w-4 h-4 text-brand-teal" /> Admin Portal
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-brand text-sm font-semibold transition-all">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8 w-full flex-grow space-y-6">
        
        {/* Toggle Nav Tabs (Funnel View vs Detail Trends) */}
        <div className="flex border-b border-brand-border gap-2">
          <Link
            href="/funnel"
            className="py-3 px-6 font-bold text-sm border-b-2 border-brand-teal text-brand-teal transition-all flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            KPI Funnel View
          </Link>
          <Link
            href="/"
            className="py-3 px-6 font-bold text-sm border-b-2 border-transparent text-slate-500 hover:text-brand-navy hover:bg-slate-50/50 transition-all flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Detail Trends
          </Link>
        </div>

        {/* Date Filter Bar */}
        <DateFilterBar
          activeMode={activeMode}
          selectedDate={selectedDate}
          selectedYear={selectedYear}
          currentRange={currentRange}
          onChange={handleFilterChange}
        />

        {/* Loading / Error / Data render */}
        {loading ? (
          <div className="bg-white border border-brand-border rounded-brand p-12 text-center shadow-sm">
            <Loader2 className="w-10 h-10 text-brand-teal animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Aggregating hospital metrics database...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-brand-border rounded-brand p-12 text-center shadow-sm">
            <p className="text-brand-red font-bold text-lg mb-2">Aggregation Error</p>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="bg-white border border-brand-border rounded-brand p-12 text-center shadow-sm space-y-3">
            <div className="text-slate-400 font-mono text-lg font-bold">No Data Recorded</div>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              There are no daily records or campaign metrics logged within the selected date window ({currentRange.label}).
            </p>
            <div className="pt-2">
              <Link href="/admin" className="inline-block bg-brand-teal text-white hover:bg-opacity-90 px-6 py-2.5 rounded-brand font-semibold text-xs transition-all">
                Go to Staff Portal
              </Link>
            </div>
          </div>
        ) : (
          <KpiFunnelView data={funnelData!} />
        )}
      </main>
    </div>
  );
}
