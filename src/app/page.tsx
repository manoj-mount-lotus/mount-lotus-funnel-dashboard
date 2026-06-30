'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Phone, MousePointerClick, ClipboardCheck, AlertTriangle, Calendar, Award, LogIn, LogOut, Shield, Loader2, TrendingUp, Filter } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function PublicDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<any>(null);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setRawError(null);
        
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('daily_funnel_reports')
          .select('*')
          .order('report_date', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setReports(data || []);
        if (data && data.length > 0) {
          // Select the latest date by default
          setSelectedDate(data[0].report_date);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load daily funnel reports. There might be a connection issue with the database.');
        setRawError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Active report configuration
  const activeReport = reports.find(r => r.report_date === selectedDate) || reports[0];

  // Helper formatting for date
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  // Math Helpers
  const calcLost = (prev: number, curr: number) => Math.max(0, prev - curr);
  const calcLostPct = (prev: number, curr: number) => {
    if (prev <= 0) return 0;
    return Math.round((calcLost(prev, curr) / prev) * 100);
  };

  // Funnel calculations for active day
  const f_metaClick = activeReport?.meta_call_to_action || 0;
  const f_reception = activeReport?.reception_tracking_meta || 0;
  const f_appointment = activeReport?.appointments_from_meta || 0;
  const f_surgery = activeReport?.cataract_surgery_from_meta || 0;

  // Scaling logic: relative to first stage. Minimum width ~6% for non-zero.
  const getWidth = (val: number) => {
    if (val === 0) return '6%';
    if (f_metaClick === 0) return '100%';
    const pct = (val / f_metaClick) * 100;
    return `${Math.max(6, pct)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col justify-between">
        <header className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-6 border-b border-brand-border shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mount Lotus Eye & ENT Hospital</h1>
              <p className="text-slate-300 text-sm font-mono mt-0.5">Meta ads funnel & call-tracking report</p>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6 flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-brand-teal animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading hospital dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col justify-between">
        <header className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-6 border-b border-brand-border shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mount Lotus Eye & ENT Hospital</h1>
              <p className="text-slate-300 text-sm font-mono mt-0.5">Meta ads funnel & call-tracking report</p>
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

        <main className="max-w-7xl mx-auto p-6 flex-grow flex items-center justify-center">
          <div className="bg-white border border-brand-border rounded-brand p-8 shadow-sm max-w-2xl w-full">
            <div className="flex items-center gap-3 text-brand-red mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold">System Connection Error</h2>
            </div>
            <p className="text-slate-700 mb-6 font-medium">{error}</p>
            
            {rawError && (
              <details className="bg-slate-50 border border-brand-border rounded-lg p-4 text-xs font-mono text-slate-600 cursor-pointer mb-6">
                <summary className="font-semibold text-slate-800 focus:outline-none">Technical Details (Debug Log)</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(rawError, null, 2)}</pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-brand-teal text-white hover:bg-opacity-90 px-6 py-2 rounded-brand font-semibold text-sm transition-all"
            >
              Retry Connection
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col justify-between">
        {/* Header */}
        <header className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-6 border-b border-brand-border shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mount Lotus Eye & ENT Hospital</h1>
              <p className="text-slate-300 text-sm font-mono mt-0.5">Meta ads funnel & call-tracking report</p>
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

        {/* Empty State */}
        <main className="max-w-7xl mx-auto p-6 flex-grow flex items-center justify-center">
          <div className="text-center p-8 bg-white border border-brand-border rounded-brand shadow-sm max-w-md">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-navy mb-2">No reports yet</h2>
            <p className="text-slate-600 mb-6">Add daily tracking records from the admin panel to view the dashboard.</p>
            <Link href="/admin" className="inline-block bg-brand-teal text-white hover:bg-opacity-90 px-6 py-2.5 rounded-brand font-semibold text-sm transition-all">
              Go to Admin Panel
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col pb-12">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-navy to-slate-900 text-white p-6 border-b border-brand-border shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mount Lotus Eye & ENT Hospital</h1>
            <p className="text-slate-300 text-sm font-mono mt-0.5">Meta ads funnel & call-tracking report</p>
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

      {/* Toggle Nav Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6 w-full flex gap-2 border-b border-brand-border">
        <Link
          href="/funnel"
          className="py-3 px-6 font-bold text-sm border-b-2 border-transparent text-slate-500 hover:text-brand-navy hover:bg-slate-50/50 transition-all flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          KPI Funnel View
        </Link>
        <Link
          href="/"
          className="py-3 px-6 font-bold text-sm border-b-2 border-brand-teal text-brand-teal transition-all flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Detail Trends
        </Link>
      </div>

      {/* Date pills */}
      <div className="bg-white border-b border-brand-border shadow-xs sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedDate(report.report_date)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedDate === report.report_date
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'bg-brand-bg text-brand-navy hover:bg-slate-200 border border-brand-border'
                }`}
              >
                {formatDateString(report.report_date)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-8 w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column (Funnel + stats) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Date Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-brand-navy flex items-center gap-2">
              <Calendar className="text-brand-teal w-5 h-5" />
              Funnel Overview for {formatDateString(selectedDate)}
            </h2>
          </div>

          {/* Metric Cards (First Panel) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-brand-border rounded-brand p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Total Calls</span>
                <Phone className="w-4 h-4 text-brand-teal" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{activeReport?.total_received_calls}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Total calls logged</div>
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-brand p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Meta Clicks</span>
                <MousePointerClick className="w-4 h-4 text-brand-teal" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-brand-teal">{activeReport?.meta_call_to_action}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Meta Call-To-Action clicks</div>
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-brand p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Reception Tracked</span>
                <ClipboardCheck className="w-4 h-4 text-brand-teal" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{activeReport?.reception_tracking_meta}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Meta leads reached reception</div>
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-brand p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Missed Leads</span>
                <AlertTriangle className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-brand-red">{activeReport?.missed_meta_leads}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Unreached Meta leads</div>
              </div>
            </div>
          </div>

          {/* Marketing Funnel Section */}
          <div className="bg-white border border-brand-border rounded-brand p-6 shadow-sm">
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500 mb-6">Meta Campaigns Conversion Funnel</h3>
            
            <div className="space-y-4">
              {/* Stage 1: Meta CTA */}
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-semibold text-slate-700">1. Meta Clicks (CTA)</span>
                  <span className="font-mono font-bold">{f_metaClick}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative border border-slate-200">
                  <div
                    style={{ width: getWidth(f_metaClick) }}
                    className="bg-brand-teal h-full transition-all duration-500 ease-out flex items-center px-3"
                  >
                    <span className="text-xs text-white font-bold font-mono">100%</span>
                  </div>
                </div>
              </div>

              {/* Transition 1 to 2 */}
              <div className="flex items-center justify-between px-4 py-1 bg-brand-bg rounded-lg border border-brand-border text-xs text-brand-red font-mono">
                <span>Lost between clicks & reception log</span>
                <span className="font-bold">-{calcLost(f_metaClick, f_reception)} ({calcLostPct(f_metaClick, f_reception)}% lost)</span>
              </div>

              {/* Stage 2: Reception Tracked */}
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-semibold text-slate-700">2. Reception Tracked</span>
                  <span className="font-mono font-bold">{f_reception}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative border border-slate-200">
                  <div
                    style={{ width: getWidth(f_reception) }}
                    className="bg-brand-teal bg-opacity-85 h-full transition-all duration-500 ease-out flex items-center px-3"
                  >
                    {f_reception > 0 && (
                      <span className="text-xs text-white font-bold font-mono">
                        {f_metaClick > 0 ? Math.round((f_reception / f_metaClick) * 100) : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Transition 2 to 3 */}
              <div className="flex items-center justify-between px-4 py-1 bg-brand-bg rounded-lg border border-brand-border text-xs text-brand-red font-mono">
                <span>Lost between reception & appointment</span>
                <span className="font-bold">-{calcLost(f_reception, f_appointment)} ({calcLostPct(f_reception, f_appointment)}% lost)</span>
              </div>

              {/* Stage 3: Appointments */}
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-semibold text-slate-700">3. Appointments from Meta</span>
                  <span className="font-mono font-bold">{f_appointment}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative border border-slate-200">
                  <div
                    style={{ width: getWidth(f_appointment) }}
                    className="bg-brand-teal bg-opacity-70 h-full transition-all duration-500 ease-out flex items-center px-3"
                  >
                    {f_appointment > 0 && (
                      <span className="text-xs text-white font-bold font-mono">
                        {f_metaClick > 0 ? Math.round((f_appointment / f_metaClick) * 100) : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Transition 3 to 4 */}
              <div className="flex items-center justify-between px-4 py-1 bg-brand-bg rounded-lg border border-brand-border text-xs text-brand-red font-mono">
                <span>Lost between appointment & surgery</span>
                <span className="font-bold">-{calcLost(f_appointment, f_surgery)} ({calcLostPct(f_appointment, f_surgery)}% lost)</span>
              </div>

              {/* Stage 4: Surgeries */}
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-semibold text-slate-700">4. Cataract Surgeries from Meta</span>
                  <span className="font-mono font-bold">{f_surgery}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden relative border border-slate-200">
                  <div
                    style={{ width: getWidth(f_surgery) }}
                    className="bg-brand-amber h-full transition-all duration-500 ease-out flex items-center px-3"
                  >
                    {f_surgery > 0 && (
                      <span className="text-xs text-white font-bold font-mono">
                        {f_metaClick > 0 ? Math.round((f_surgery / f_metaClick) * 100) : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Chart (All Dates) */}
          <div className="bg-white border border-brand-border rounded-brand p-6 shadow-sm">
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500 mb-6">Meta Ads Click-to-Log Performance Trend</h3>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...reports].reverse()}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7ED" />
                  <XAxis
                    dataKey="report_date"
                    tickFormatter={formatDateString}
                    tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                  />
                  <YAxis tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                  <Tooltip
                    labelFormatter={(label) => formatDateString(label as string)}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E4E7ED',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line
                    type="monotone"
                    name="Meta Clicks (CTA)"
                    dataKey="meta_call_to_action"
                    stroke="#0E7C7B"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    name="Reception Tracked"
                    dataKey="reception_tracking_meta"
                    stroke="#0B2545"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    name="Missed Meta Leads"
                    dataKey="missed_meta_leads"
                    stroke="#D8483F"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right column (Hospital conversion details) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-brand-border rounded-brand p-6 shadow-sm">
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500 mb-6">Outcomes & Appointments</h3>
            
            <div className="space-y-6">
              {/* Total Appointments Section */}
              <div className="border-b border-brand-border pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold text-slate-700">Total Appointments</div>
                  <div className="text-2xl font-bold font-mono">{activeReport?.total_appointments}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-brand-bg rounded-lg p-2 text-center border border-brand-border">
                    <div className="text-xs text-slate-400 font-mono">Completed</div>
                    <div className="text-sm font-bold text-brand-teal font-mono">{activeReport?.completed}</div>
                  </div>
                  <div className="bg-brand-bg rounded-lg p-2 text-center border border-brand-border">
                    <div className="text-xs text-slate-400 font-mono">Cancelled</div>
                    <div className="text-sm font-bold text-brand-red font-mono">{activeReport?.cancelled}</div>
                  </div>
                  <div className="bg-brand-bg rounded-lg p-2 text-center border border-brand-border">
                    <div className="text-xs text-slate-400 font-mono">No Show</div>
                    <div className="text-sm font-bold text-brand-amber font-mono">{activeReport?.no_show}</div>
                  </div>
                </div>
              </div>

              {/* Cataract Surgeries Section */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm font-bold text-slate-700">Total Cataract Surgeries</div>
                  <div className="text-2xl font-bold font-mono text-brand-navy">{activeReport?.total_cataract_surgeries}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-brand-bg p-3 rounded-lg border border-brand-border">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand-teal" /> From Meta Ads
                    </span>
                    <span className="text-sm font-bold font-mono">{activeReport?.cataract_surgery_from_meta}</span>
                  </div>
                  <div className="flex justify-between items-center bg-brand-bg p-3 rounded-lg border border-brand-border">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" /> Other Sources
                    </span>
                    <span className="text-sm font-bold font-mono">{activeReport?.cataract_surgery_from_other}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
