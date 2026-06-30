'use client';

import React from 'react';
import { FunnelData } from '@/lib/getFunnelData';
import { Megaphone, MousePointerClick, Users, CalendarCheck, UserCheck, Microscope, Eye, Award, HelpCircle } from 'lucide-react';

interface KpiFunnelViewProps {
  data: FunnelData;
}

export default function KpiFunnelView({ data }: KpiFunnelViewProps) {
  // Destructure metrics
  const { awareness, interest, leads, doctorAppointments, patientVisits, testing, conversions, retention, dropouts } = data;

  // Helper to format large numbers
  const fmt = (num: number) => num.toLocaleString('en-US');

  return (
    <div className="bg-white border border-brand-border rounded-brand p-6 shadow-sm space-y-8">
      {/* Top Header info */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Hospital Funnel Analysis</h2>
          <p className="text-slate-500 text-xs mt-0.5">Aggregated funnel stages and transition dropouts</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational View Active
          </span>
        </div>
      </div>

      {/* Main Funnel Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left column - MARKETING & OPERATIONS Brackets (lg:col-span-1) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col justify-between py-2 text-center text-xs font-bold font-mono">
          <div className="flex-1 flex flex-col justify-center items-center relative pr-4">
            <div className="absolute inset-y-0 right-1 border-r-2 border-brand-teal/30 border-dashed rounded-r-md"></div>
            <div className="rotate-275 text-brand-teal uppercase tracking-widest my-auto py-2 bg-white z-10 font-bold whitespace-nowrap">
              Marketing
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center relative pr-4 mt-4">
            <div className="absolute inset-y-0 right-1 border-r-2 border-emerald-500/30 border-dashed rounded-r-md"></div>
            <div className="rotate-275 text-emerald-700 uppercase tracking-widest my-auto py-2 bg-white z-10 font-bold whitespace-nowrap">
              Operations
            </div>
          </div>
        </div>

        {/* Center Funnel Bars (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* STAGE 1: Awareness */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(0% 0%, 100% 0%, 94% 100%, 6% 100%)' }} 
              className="bg-gradient-to-r from-brand-navy to-slate-800 text-white p-4 h-20 flex items-center justify-between px-[8%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-brand-teal">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">1. Brand Awareness</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Reach: {fmt(awareness.reach)} | Impr: {fmt(awareness.impressions)} | Video: {fmt(awareness.videoViews)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(awareness.reach)}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Reached People</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 1: Attention Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[8%] mr-[8%]">
            <span className="font-medium text-slate-400">Attention Loss</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.attention)} Dropouts
            </span>
          </div>

          {/* STAGE 2: Interest */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(6% 0%, 94% 0%, 88% 100%, 12% 100%)' }} 
              className="bg-gradient-to-r from-brand-teal to-teal-700 text-white p-4 h-20 flex items-center justify-between px-[14%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-brand-bg">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">2. Interest &amp; Intent</h4>
                  <p className="text-[10px] text-teal-100 font-medium">Link: {fmt(interest.linkClicks)} | WA: {fmt(interest.whatsappClicks)} | Call Click: {fmt(interest.callClicks)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(interest.total)}</div>
                <div className="text-[9px] text-teal-200 uppercase font-bold tracking-wider">Active Clicks</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 2: Inquiry Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[14%] mr-[14%]">
            <span className="font-medium text-slate-400">Inquiry Loss</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.inquiry)} Dropouts
            </span>
          </div>

          {/* STAGE 3: Leads */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)' }} 
              className="bg-gradient-to-r from-[#179695] to-teal-500 text-white p-4 h-20 flex items-center justify-between px-[20%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-slate-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">3. Leads Inquiries</h4>
                  <p className="text-[10px] text-teal-50 font-medium">Total received phone call logs</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(leads)}</div>
                <div className="text-[9px] text-teal-100 uppercase font-bold tracking-wider">Inbound Leads</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 3: Booking Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[20%] mr-[20%]">
            <span className="font-medium text-slate-400">Booking Loss</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.booking)} Dropouts
            </span>
          </div>

          {/* STAGE 4: Doctor Appointments */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(18% 0%, 82% 0%, 76% 100%, 24% 100%)' }} 
              className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-4 h-20 flex items-center justify-between px-[25%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-emerald-100">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">4. Doctor Appointments</h4>
                  <p className="text-[10px] text-emerald-100 font-medium">Booked hospital consultations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(doctorAppointments)}</div>
                <div className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider">Appointments</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 4: No-Show Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[25%] mr-[25%]">
            <span className="font-medium text-slate-400">No Show / Reschedule</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.noShowReschedule)} Dropouts
            </span>
          </div>

          {/* STAGE 5: Patient Visits */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(24% 0%, 76% 0%, 70% 100%, 30% 100%)' }} 
              className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 h-20 flex items-center justify-between px-[30%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-emerald-50">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">5. Patient Visits</h4>
                  <p className="text-[10px] text-emerald-50 font-medium">Consulted with doctor at clinic</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(patientVisits)}</div>
                <div className="text-[9px] text-emerald-100 uppercase font-bold tracking-wider">Visits</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 5: Testing Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[30%] mr-[30%]">
            <span className="font-medium text-slate-400">Testing Loss</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.testingDropout)} Dropouts
            </span>
          </div>

          {/* STAGE 6: Testing */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 64% 100%, 36% 100%)' }} 
              className="bg-gradient-to-r from-teal-500 to-[#4CB5AE] text-white p-4 h-20 flex items-center justify-between px-[35%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-slate-100">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">6. Diagnostic Testing</h4>
                  <p className="text-[10px] text-teal-50 font-medium">Testing &amp; evaluations completed</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(testing)}</div>
                <div className="text-[9px] text-teal-100 uppercase font-bold tracking-wider">Tests</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 6: Treatment Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[35%] mr-[35%]">
            <span className="font-medium text-slate-400">Treatment Loss</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.treatmentDropout)} Dropouts
            </span>
          </div>

          {/* STAGE 7: Conversions */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(36% 0%, 64% 0%, 58% 100%, 42% 100%)' }} 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white p-4 h-20 flex items-center justify-between px-[39%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-slate-50">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">7. Conversions</h4>
                  <p className="text-[10px] text-emerald-50 font-medium">Admitted / Surgery confirmed</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono">{fmt(conversions)}</div>
                <div className="text-[9px] text-emerald-100 uppercase font-bold tracking-wider">Conversions</div>
              </div>
            </div>
          </div>

          {/* DROPOUT 7: Retention Dropout */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-6 py-0.5 border-l-2 border-dashed border-slate-200 ml-[39%] mr-[39%]">
            <span className="font-medium text-slate-400">Retention Loss</span>
            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {fmt(dropouts.retentionDropout)} Dropouts
            </span>
          </div>

          {/* STAGE 8: Retention */}
          <div className="relative group transition-all duration-300">
            <div 
              style={{ clipPath: 'polygon(42% 0%, 58% 0%, 52% 100%, 48% 100%)' }} 
              className="bg-gradient-to-r from-teal-600 to-teal-400 text-white p-4 h-20 flex items-center justify-between px-[42%]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full text-slate-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">8. Retention</h4>
                  <p className="text-[9px] text-teal-150 font-medium">Repeat / Referral / Reviews</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono">{fmt(retention)}</div>
                <div className="text-[8px] text-teal-100 uppercase font-bold tracking-wider">Retained</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column - Side dropout stats & captions (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-brand-border lg:pl-6">
          <div className="bg-slate-50 border border-brand-border rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-teal" /> Directional Dropout Note
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <strong>Attention Dropout</strong> mixes different units (people reached vs. ad action clicks). Therefore, top-of-funnel conversion rates are <em>directional metrics</em> rather than exact conversion values. Use these trends for high-level management strategy.
            </p>
          </div>

          {/* Funnel Health Metrics Summary */}
          <div className="bg-white border border-brand-border rounded-lg p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">Funnel Summary Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-brand-border rounded-lg p-3 bg-brand-bg">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Reach to Lead</div>
                <div className="text-lg font-bold font-mono text-brand-teal mt-0.5">
                  {awareness.reach > 0 ? ((leads / awareness.reach) * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
              <div className="border border-brand-border rounded-lg p-3 bg-brand-bg">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Lead to Visit</div>
                <div className="text-lg font-bold font-mono text-brand-teal mt-0.5">
                  {leads > 0 ? ((patientVisits / leads) * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
              <div className="border border-brand-border rounded-lg p-3 bg-brand-bg">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Visit to Convert</div>
                <div className="text-lg font-bold font-mono text-brand-teal mt-0.5">
                  {patientVisits > 0 ? ((conversions / patientVisits) * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
              <div className="border border-brand-border rounded-lg p-3 bg-brand-bg">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Conversion</div>
                <div className="text-lg font-bold font-mono text-brand-teal mt-0.5">
                  {awareness.reach > 0 ? ((conversions / awareness.reach) * 100).toFixed(4) : '0.00'}%
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom KPI Banner */}
      <div className="bg-brand-navy border border-slate-700 text-white rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-teal" />
          <span className="text-xs md:text-sm font-semibold">Primary Hospital Focus Metric:</span>
          <span className="text-xs md:text-sm font-bold bg-slate-800 text-brand-teal border border-slate-700 px-3 py-1 rounded-full font-mono">
            Doctor Appointments Booked ({fmt(doctorAppointments)})
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Mount Lotus Eye &amp; ENT Hospital © 2026
        </div>
      </div>
    </div>
  );
}
