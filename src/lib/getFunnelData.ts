import { createClient } from '@/lib/supabase/client';
import { DateRange } from './dateRanges';

export interface FunnelData {
  awareness: { reach: number; impressions: number; videoViews: number };
  interest: { linkClicks: number; whatsappClicks: number; callClicks: number; total: number };
  leads: number; // total received calls (acts as "Calls / Forms / Inquiries")
  doctorAppointments: number;
  patientVisits: number;
  testing: number;
  conversions: number;
  retention: number;
  dropouts: {
    attention: number;   // reach - interest total (approx, see note below)
    inquiry: number;     // interest total - leads
    booking: number;     // leads - doctorAppointments
    noShowReschedule: number; // doctorAppointments - patientVisits
    testingDropout: number;  // patientVisits - testing
    treatmentDropout: number; // testing - conversions
    retentionDropout: number; // conversions - retention
  };
}

export async function getFunnelData(range: DateRange): Promise<FunnelData> {
  const supabase = createClient();

  const { data: campaignRows, error: campaignErr } = await supabase
    .from('campaign_daily_metrics')
    .select('*')
    .gte('metric_date', range.start)
    .lte('metric_date', range.end);
  if (campaignErr) throw campaignErr;

  const { data: funnelRows, error: funnelErr } = await supabase
    .from('daily_funnel_reports')
    .select('*')
    .gte('report_date', range.start)
    .lte('report_date', range.end);
  if (funnelErr) throw funnelErr;

  const sum = (rows: any[], key: string) =>
    rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

  const reach = sum(campaignRows || [], 'reach');
  const impressions = sum(campaignRows || [], 'impressions');
  const videoViews = sum(campaignRows || [], 'video_views');
  const linkClicks = sum(campaignRows || [], 'link_clicks');
  const whatsappClicks = sum(campaignRows || [], 'whatsapp_clicks');
  const callClicks = sum(campaignRows || [], 'call_clicks');
  const interestTotal = linkClicks + whatsappClicks + callClicks;

  const leads = sum(funnelRows || [], 'reception_tracking_meta');
  const doctorAppointments = sum(funnelRows || [], 'appointments_from_meta');
  const patientVisits = sum(funnelRows || [], 'patient_visits');
  const testing = sum(funnelRows || [], 'testing_completed');
  const conversions = sum(funnelRows || [], 'conversions_total');
  const retention =
    sum(funnelRows || [], 'retention_repeat_visits') +
    sum(funnelRows || [], 'retention_referrals') +
    sum(funnelRows || [], 'retention_reviews');

  return {
    awareness: { reach, impressions, videoViews },
    interest: { linkClicks, whatsappClicks, callClicks, total: interestTotal },
    leads,
    doctorAppointments,
    patientVisits,
    testing,
    conversions,
    retention,
    dropouts: {
      attention: Math.max(0, reach - interestTotal),
      inquiry: Math.max(0, interestTotal - leads),
      booking: Math.max(0, leads - doctorAppointments),
      noShowReschedule: Math.max(0, doctorAppointments - patientVisits),
      testingDropout: Math.max(0, patientVisits - testing),
      treatmentDropout: Math.max(0, testing - conversions),
      retentionDropout: Math.max(0, conversions - retention),
    },
  };
}
