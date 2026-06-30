'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Plus, Edit2, Trash2, Save, X, Loader2, AlertCircle, CheckCircle, RefreshCw, UploadCloud, FileSpreadsheet, Check, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

interface ReportRow {
  id: string;
  report_date: string;
  total_appointments: number;
  cancelled: number;
  no_show: number;
  completed: number;
  total_received_calls: number;
  meta_call_to_action: number;
  reception_tracking_meta: number;
  missed_meta_leads: number;
  appointments_from_meta: number;
  no_appointments_from_meta: number;
  total_cataract_surgeries: number;
  cataract_surgery_from_meta: number;
  cataract_surgery_from_other: number;
  created_at?: string;
  updated_at?: string;
}

export default function AdminPortal() {
  const router = useRouter();
  const supabase = createClient();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for new entry
  const [reportDate, setReportDate] = useState('');
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [cancelled, setCancelled] = useState(0);
  const [noShow, setNoShow] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [totalReceivedCalls, setTotalReceivedCalls] = useState(0);
  const [metaCallToAction, setMetaCallToAction] = useState(0);
  const [receptionTrackingMeta, setReceptionTrackingMeta] = useState(0);
  const [missedMetaLeads, setMissedMetaLeads] = useState(0);
  const [appointmentsFromMeta, setAppointmentsFromMeta] = useState(0);
  const [noAppointmentsFromMeta, setNoAppointmentsFromMeta] = useState(0);
  const [totalCataractSurgeries, setTotalCataractSurgeries] = useState(0);
  const [cataractSurgeryFromMeta, setCataractSurgeryFromMeta] = useState(0);
  const [cataractSurgeryFromOther, setCataractSurgeryFromOther] = useState(0);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReportRow>>({});

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');

  // Import states
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1lfQ7lIrC8V-voHqQTNMKkIDmN3Aw19e6ebZGYZP31E8/edit?usp=sharing');
  const [importLoading, setImportLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processRawRows = (rawRows: any[]) => {
    const mappedRows: any[] = [];
    const normalizeHeader = (h: string) => h.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
    const headerMapping: { [key: string]: string } = {
      'leads date': 'report_date',
      'date': 'report_date',
      'total appointments': 'total_appointments',
      'cancelled': 'cancelled',
      'no show': 'no_show',
      'completed': 'completed',
      'total received calls': 'total_received_calls',
      'meta call to action': 'meta_call_to_action',
      'reception tracking meta': 'reception_tracking_meta',
      'missed meta leads': 'missed_meta_leads',
      'appointments received from meta': 'appointments_from_meta',
      'no appointments from meta': 'no_appointments_from_meta',
      'total cataract surgeries': 'total_cataract_surgeries',
      'total cataract surgery from meta': 'cataract_surgery_from_meta',
      'cataract surgery from other': 'cataract_surgery_from_other'
    };

    const parseDateValue = (val: any): string | null => {
      if (val === undefined || val === null || val === '') return null;
      if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      const str = String(val).trim();
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        return d.toISOString().split('T')[0];
      }
      const parts = str.split(/[-/.]/);
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        if (day <= 31 && month <= 12 && year > 1900) {
          const d = new Date(Date.UTC(year, month - 1, day));
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        }
        if (day <= 12 && month <= 31 && year > 1900) {
          const d = new Date(Date.UTC(year, day - 1, month));
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        }
      }
      return null;
    };

    for (const row of rawRows) {
      const mappedRow: any = {};
      let hasData = false;

      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = normalizeHeader(key);
        const dbColumn = headerMapping[normalizedKey];
        if (dbColumn) {
          if (dbColumn === 'report_date') {
            const parsedDate = parseDateValue(value);
            if (parsedDate) {
              mappedRow[dbColumn] = parsedDate;
              hasData = true;
            }
          } else {
            const numVal = value !== null && value !== '' ? Number(value) : 0;
            mappedRow[dbColumn] = isNaN(numVal) ? 0 : numVal;
            hasData = true;
          }
        }
      }

      if (mappedRow.report_date) {
        for (const col of Object.values(headerMapping)) {
          if (col !== 'report_date' && mappedRow[col] === undefined) {
            mappedRow[col] = 0;
          }
        }
        mappedRows.push(mappedRow);
      }
    }
    return mappedRows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setImportLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary', raw: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

        if (rawRows.length === 0) {
          throw new Error('The spreadsheet is empty.');
        }

        const mapped = processRawRows(rawRows);
        if (mapped.length === 0) {
          throw new Error('No valid records found. Ensure the "Leads Date" column is populated and matches valid date formats.');
        }

        setParsedData(mapped);
        setSuccess(`Successfully parsed ${mapped.length} records from file. Please preview and click "Confirm Import" below.`);
      } catch (err: any) {
        console.error('Error parsing file:', err);
        setError(err?.message || 'Failed to parse the file. Please ensure it is a valid Excel or CSV file.');
      } finally {
        setImportLoading(false);
      }
    };
    reader.onerror = () => {
      setError('File reading error.');
      setImportLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleGoogleSync = async () => {
    if (!sheetUrl) {
      setError('Please provide a Google Sheets URL.');
      return;
    }

    setError(null);
    setSuccess(null);
    setImportLoading(true);
    setParsedData([]);

    try {
      const response = await fetch('/api/import-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: sheetUrl }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to sync Google Sheet.');
      }

      if (resData.data && resData.data.length > 0) {
        setParsedData(resData.data);
        setSuccess(`Successfully fetched ${resData.importedCount} records from Google Sheets. Review the preview and click "Confirm Import" to save.`);
      } else {
        throw new Error('No valid records found in the Google Sheet.');
      }
    } catch (err: any) {
      console.error('Google Sheet sync error:', err);
      setError(err?.message || 'Failed to sync from Google Sheet. Ensure the link is shared properly.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;

    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      const { error: upsertError } = await supabase
        .from('daily_funnel_reports')
        .upsert(parsedData, { onConflict: 'report_date' });

      if (upsertError) throw upsertError;

      setSuccess(`Successfully imported/updated ${parsedData.length} funnel report records.`);
      setParsedData([]);
      fetchReports();
    } catch (err: any) {
      console.error('Database import error:', err);
      setError(err?.message || 'Failed to import records to the database.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('daily_funnel_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err?.message || 'Failed to load daily reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    if (!reportDate) {
      setError('Please select a valid report date.');
      setActionLoading(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('daily_funnel_reports')
        .insert([{
          report_date: reportDate,
          total_appointments: Number(totalAppointments),
          cancelled: Number(cancelled),
          no_show: Number(noShow),
          completed: Number(completed),
          total_received_calls: Number(totalReceivedCalls),
          meta_call_to_action: Number(metaCallToAction),
          reception_tracking_meta: Number(receptionTrackingMeta),
          missed_meta_leads: Number(missedMetaLeads),
          appointments_from_meta: Number(appointmentsFromMeta),
          no_appointments_from_meta: Number(noAppointmentsFromMeta),
          total_cataract_surgeries: Number(totalCataractSurgeries),
          cataract_surgery_from_meta: Number(cataractSurgeryFromMeta),
          cataract_surgery_from_other: Number(cataractSurgeryFromOther)
        }])
        .select();

      if (insertError) throw insertError;

      setSuccess(`Report for ${formatDateString(reportDate)} successfully created.`);
      
      // Reset form fields
      setReportDate('');
      setTotalAppointments(0);
      setCancelled(0);
      setNoShow(0);
      setCompleted(0);
      setTotalReceivedCalls(0);
      setMetaCallToAction(0);
      setReceptionTrackingMeta(0);
      setMissedMetaLeads(0);
      setAppointmentsFromMeta(0);
      setNoAppointmentsFromMeta(0);
      setTotalCataractSurgeries(0);
      setCataractSurgeryFromMeta(0);
      setCataractSurgeryFromOther(0);

      // Refresh list
      fetchReports();
    } catch (err: any) {
      console.error('Error inserting report:', err);
      setError(err?.message || 'Failed to insert report. Ensure the date is unique.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEdit = (row: ReportRow) => {
    setEditingId(row.id);
    setEditForm({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      const updateData = {
        total_appointments: Number(editForm.total_appointments),
        cancelled: Number(editForm.cancelled),
        no_show: Number(editForm.no_show),
        completed: Number(editForm.completed),
        total_received_calls: Number(editForm.total_received_calls),
        meta_call_to_action: Number(editForm.meta_call_to_action),
        reception_tracking_meta: Number(editForm.reception_tracking_meta),
        missed_meta_leads: Number(editForm.missed_meta_leads),
        appointments_from_meta: Number(editForm.appointments_from_meta),
        no_appointments_from_meta: Number(editForm.no_appointments_from_meta),
        total_cataract_surgeries: Number(editForm.total_cataract_surgeries),
        cataract_surgery_from_meta: Number(editForm.cataract_surgery_from_meta),
        cataract_surgery_from_other: Number(editForm.cataract_surgery_from_other),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('daily_funnel_reports')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess(`Report details successfully updated.`);
      setEditingId(null);
      setEditForm({});
      fetchReports();
    } catch (err: any) {
      console.error('Error updating report:', err);
      setError(err?.message || 'Failed to update report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Are you sure you want to permanently delete the report for ${formatDateString(date)}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('daily_funnel_reports')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess(`Report for ${formatDateString(date)} successfully deleted.`);
      fetchReports();
    } catch (err: any) {
      console.error('Error deleting report:', err);
      setError(err?.message || 'Failed to delete report.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pb-12">
      {/* Header */}
      <header className="bg-brand-navy text-white p-6 border-b border-brand-border shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Operations Center</h1>
            <p className="text-slate-300 text-sm font-mono mt-0.5">Mount Lotus Funnel Data-Entry Panel</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-white hover:underline bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-brand font-semibold transition-all">
              ← View Public Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-brand-red text-white hover:bg-opacity-90 px-4 py-2 rounded-brand text-sm font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-brand-red font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 font-semibold">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Navigation Tabs & Import/Entry Area */}
        <div className="bg-white border border-brand-border rounded-brand p-6 shadow-sm">
          {/* Tabs header */}
          <div className="flex border-b border-brand-border mb-6">
            <button
              onClick={() => { setActiveTab('manual'); setError(null); setSuccess(null); }}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'manual'
                  ? 'border-brand-teal text-brand-teal bg-teal-50/30'
                  : 'border-transparent text-slate-500 hover:text-brand-navy hover:bg-slate-50/50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Manual Entry Form
            </button>
            <button
              onClick={() => { setActiveTab('import'); setError(null); setSuccess(null); }}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'border-brand-teal text-brand-teal bg-teal-50/30'
                  : 'border-transparent text-slate-500 hover:text-brand-navy hover:bg-slate-50/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Google Sheets & Excel Import Center
            </button>
          </div>

          {activeTab === 'manual' ? (
            <div>
              <div className="flex items-center gap-2 border-b border-brand-border pb-3 mb-6">
                <Plus className="w-5 h-5 text-brand-teal" />
                <h2 className="text-md font-bold text-brand-navy">Add Daily Funnel Report</h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                {/* Group 1: General */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Report Date
                    </label>
                    <input
                      type="date"
                      required
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg focus:ring-1 focus:ring-brand-teal focus:border-brand-teal font-medium"
                    />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Meta Campaigns & Reception Logs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Meta Clicks (CTA)</label>
                      <input
                        type="number"
                        min="0"
                        value={metaCallToAction}
                        onChange={(e) => setMetaCallToAction(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reception Tracked</label>
                      <input
                        type="number"
                        min="0"
                        value={receptionTrackingMeta}
                        onChange={(e) => setReceptionTrackingMeta(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Missed Leads</label>
                      <input
                        type="number"
                        min="0"
                        value={missedMetaLeads}
                        onChange={(e) => setMissedMetaLeads(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Total Received Calls (All)</label>
                      <input
                        type="number"
                        min="0"
                        value={totalReceivedCalls}
                        onChange={(e) => setTotalReceivedCalls(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Meta Appointments Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Appointments from Meta</label>
                      <input
                        type="number"
                        min="0"
                        value={appointmentsFromMeta}
                        onChange={(e) => setAppointmentsFromMeta(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">No Appointments from Meta</label>
                      <input
                        type="number"
                        min="0"
                        value={noAppointmentsFromMeta}
                        onChange={(e) => setNoAppointmentsFromMeta(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">General Appointments (All Sources)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Total Appointments</label>
                      <input
                        type="number"
                        min="0"
                        value={totalAppointments}
                        onChange={(e) => setTotalAppointments(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Completed</label>
                      <input
                        type="number"
                        min="0"
                        value={completed}
                        onChange={(e) => setCompleted(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Cancelled</label>
                      <input
                        type="number"
                        min="0"
                        value={cancelled}
                        onChange={(e) => setCancelled(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">No Show</label>
                      <input
                        type="number"
                        min="0"
                        value={noShow}
                        onChange={(e) => setNoShow(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Cataract Surgeries</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Total Cataract Surgeries</label>
                      <input
                        type="number"
                        min="0"
                        value={totalCataractSurgeries}
                        onChange={(e) => setTotalCataractSurgeries(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Surgery from Meta</label>
                      <input
                        type="number"
                        min="0"
                        value={cataractSurgeryFromMeta}
                        onChange={(e) => setCataractSurgeryFromMeta(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Surgery from Other</label>
                      <input
                        type="number"
                        min="0"
                        value={cataractSurgeryFromOther}
                        onChange={(e) => setCataractSurgeryFromOther(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-bg font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-brand-teal text-white hover:bg-opacity-90 px-6 py-2.5 rounded-brand font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Save Daily Entry
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-brand-border rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <h4 className="font-bold text-brand-navy">Google Sheet Sharing Requirements</h4>
                    <p>
                      For direct sync to succeed, the Google Sheet must be shared so that <strong>&quot;Anyone with the link can view&quot;</strong>.
                    </p>
                    <p>
                      Alternatively, click <strong>File &gt; Share &gt; Publish to web</strong> in Google Sheets, or download the sheet as an Excel/CSV file and drop it in the uploader below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Sheets Sync Link */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Google Sheets Sharing Link
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 border border-brand-border rounded-lg text-sm bg-brand-bg focus:ring-1 focus:ring-brand-teal focus:border-brand-teal font-medium font-mono text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleGoogleSync}
                    disabled={importLoading || actionLoading}
                    className="bg-brand-teal text-white hover:bg-opacity-90 px-6 py-2.5 rounded-brand font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
                  >
                    {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Sync Google Sheet
                  </button>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-brand-border hover:border-brand-teal rounded-lg p-8 transition-colors text-center bg-brand-bg group cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-brand-teal mx-auto mb-3 transition-colors" />
                <p className="text-sm font-bold text-slate-700">Drag &amp; drop your Excel or CSV here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse files (.xlsx, .xls, .csv)</p>
              </div>

              {/* Parsed Data Preview & Save */}
              {parsedData.length > 0 && (
                <div className="border-t border-brand-border pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-brand-navy">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-bold">Import Preview ({parsedData.length} records ready)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setParsedData([])}
                        className="px-4 py-2 border border-brand-border rounded-brand text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                      >
                        Clear Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={actionLoading}
                        className="bg-brand-teal text-white hover:bg-opacity-90 px-5 py-2 rounded-brand font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Confirm Import &amp; Save
                      </button>
                    </div>
                  </div>

                  <div className="border border-brand-border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-brand-border text-[11px] text-left text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2 text-center">Meta CTA</th>
                          <th className="px-3 py-2 text-center">Recep. Log</th>
                          <th className="px-3 py-2 text-center">Missed Leads</th>
                          <th className="px-3 py-2 text-center">Meta Appts</th>
                          <th className="px-3 py-2 text-center">Meta Surg.</th>
                          <th className="px-3 py-2 text-center">Total Appts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border bg-white font-mono">
                        {parsedData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-bold text-brand-navy">{row.report_date}</td>
                            <td className="px-3 py-2 text-center">{row.meta_call_to_action}</td>
                            <td className="px-3 py-2 text-center">{row.reception_tracking_meta}</td>
                            <td className="px-3 py-2 text-center text-brand-red">{row.missed_meta_leads}</td>
                            <td className="px-3 py-2 text-center">{row.appointments_from_meta}</td>
                            <td className="px-3 py-2 text-center text-brand-amber font-bold">{row.cataract_surgery_from_meta}</td>
                            <td className="px-3 py-2 text-center font-bold">{row.total_appointments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <div className="bg-slate-50 p-2 text-center text-[10px] text-slate-500 border-t border-brand-border font-medium">
                        And {parsedData.length - 10} more rows...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing reports list */}
        <div className="bg-white border border-brand-border rounded-brand p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-teal" />
              <h2 className="text-md font-bold text-brand-navy">Historical Logs & Entries</h2>
            </div>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-brand-teal flex items-center gap-1.5 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Records
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              <Loader2 className="w-8 h-8 text-brand-teal animate-spin mx-auto mb-3" />
              Loading records database...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium border border-dashed border-brand-border rounded-lg">
              No historical data logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border text-xs">
                <thead className="bg-brand-bg text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-left">Date</th>
                    <th className="px-3 py-3 text-center">Meta CTA</th>
                    <th className="px-3 py-3 text-center">Recep. Log</th>
                    <th className="px-3 py-3 text-center">Missed Leads</th>
                    <th className="px-3 py-3 text-center">Meta Appts</th>
                    <th className="px-3 py-3 text-center">Meta Surg.</th>
                    <th className="px-3 py-3 text-center">Total Appts</th>
                    <th className="px-3 py-3 text-center">Comp/Canc/NoShow</th>
                    <th className="px-3 py-3 text-center">Total Surg (Oth)</th>
                    <th className="px-3 py-3 text-center">Total Calls</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border font-medium text-slate-700 bg-white">
                  {reports.map((row) => {
                    const isEditing = editingId === row.id;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-4 whitespace-nowrap font-bold text-brand-navy">
                          {formatDateString(row.report_date)}
                        </td>

                        {/* Inline editor conditional inputs */}
                        {isEditing ? (
                          <>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.meta_call_to_action ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, meta_call_to_action: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.reception_tracking_meta ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, reception_tracking_meta: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.missed_meta_leads ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, missed_meta_leads: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.appointments_from_meta ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, appointments_from_meta: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.cataract_surgery_from_meta ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, cataract_surgery_from_meta: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.total_appointments ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, total_appointments: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="px-1 py-2 text-center font-mono whitespace-nowrap">
                              <input
                                type="number"
                                value={editForm.completed ?? 0}
                                placeholder="Comp"
                                onChange={(e) => setEditForm({ ...editForm, completed: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-10 px-1 py-1 border border-brand-border rounded text-center"
                              />
                              /
                              <input
                                type="number"
                                value={editForm.cancelled ?? 0}
                                placeholder="Canc"
                                onChange={(e) => setEditForm({ ...editForm, cancelled: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-10 px-1 py-1 border border-brand-border rounded text-center"
                              />
                              /
                              <input
                                type="number"
                                value={editForm.no_show ?? 0}
                                placeholder="NS"
                                onChange={(e) => setEditForm({ ...editForm, no_show: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-10 px-1 py-1 border border-brand-border rounded text-center"
                              />
                            </td>
                            <td className="px-1 py-2 text-center font-mono whitespace-nowrap">
                              <input
                                type="number"
                                value={editForm.total_cataract_surgeries ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, total_cataract_surgeries: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-12 px-1 py-1 border border-brand-border rounded text-center"
                              />
                              (
                              <input
                                type="number"
                                value={editForm.cataract_surgery_from_other ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, cataract_surgery_from_other: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-12 px-1 py-1 border border-brand-border rounded text-center"
                              />
                              )
                            </td>
                            <td className="px-1 py-2 text-center">
                              <input
                                type="number"
                                value={editForm.total_received_calls ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, total_received_calls: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-14 px-1 py-1 border border-brand-border rounded text-center font-mono font-bold"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-4 text-center font-mono font-bold text-brand-teal">{row.meta_call_to_action}</td>
                            <td className="px-3 py-4 text-center font-mono">{row.reception_tracking_meta}</td>
                            <td className="px-3 py-4 text-center font-mono text-brand-red">{row.missed_meta_leads}</td>
                            <td className="px-3 py-4 text-center font-mono">{row.appointments_from_meta}</td>
                            <td className="px-3 py-4 text-center font-mono text-brand-amber font-bold">{row.cataract_surgery_from_meta}</td>
                            <td className="px-3 py-4 text-center font-mono font-bold">{row.total_appointments}</td>
                            <td className="px-3 py-4 text-center font-mono text-slate-500">
                              {row.completed} / {row.cancelled} / {row.no_show}
                            </td>
                            <td className="px-3 py-4 text-center font-mono text-brand-navy font-bold">
                              {row.total_cataract_surgeries} <span className="text-[10px] text-slate-400 font-normal">({row.cataract_surgery_from_other})</span>
                            </td>
                            <td className="px-3 py-4 text-center font-mono">{row.total_received_calls}</td>
                          </>
                        )}

                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdate(row.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-slate-500 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(row)}
                                className="p-1.5 text-slate-500 hover:text-brand-teal bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(row.id, row.report_date)}
                                className="p-1.5 text-brand-red hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
