import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

async function getSupabaseClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return await createServerClient();
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
}

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
  'cataract surgery from other': 'cataract_surgery_from_other',
  'patient visits': 'patient_visits',
  'visits': 'patient_visits',
  'testing completed': 'testing_completed',
  'testing': 'testing_completed',
  'conversions total': 'conversions_total',
  'conversions': 'conversions_total',
  'retention repeat visits': 'retention_repeat_visits',
  'repeat visits': 'retention_repeat_visits',
  'retention referrals': 'retention_referrals',
  'referrals': 'retention_referrals',
  'retention reviews': 'retention_reviews',
  'reviews': 'retention_reviews'
};

const campaignHeaderMapping: { [key: string]: string } = {
  'date': 'metric_date',
  'metric date': 'metric_date',
  'leads date': 'metric_date',
  'campain name': 'campaign_name',
  'campaign name': 'campaign_name',
  'platform': 'platform',
  'reach': 'reach',
  'impressions': 'impressions',
  'video views': 'video_views',
  'link clicks': 'link_clicks',
  'whatsapp clicks': 'whatsapp_clicks',
  'call clicks': 'call_clicks'
};

function parseDateValue(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;
  
  // If it's a number, it could be an Excel serial date
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  const str = String(val).trim();
  
  // Try direct parsing
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().split('T')[0];
  }
  
  // Try parsing common formats like DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    if (year < 100) year += 2000;
    
    // Check if it looks like DD/MM/YYYY
    if (day <= 31 && month <= 12 && year > 1900) {
      const d = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
    
    // Check if it looks like MM/DD/YYYY
    if (day <= 12 && month <= 31 && year > 1900) {
      const d = new Date(Date.UTC(year, day - 1, month));
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
  }
  
  return null;
}

function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

export async function POST(request: NextRequest) {
  try {
    // Validate SYNC_SECRET if configured
    const syncSecret = process.env.SYNC_SECRET;
    if (syncSecret) {
      const authHeader = request.headers.get('Authorization');
      const urlSecret = request.nextUrl.searchParams.get('secret');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (urlSecret !== syncSecret && bearerToken !== syncSecret) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or missing sync secret' }, { status: 401 });
      }
    }

    const body = await request.json();

    // Fallback to legacy URL-based sheet import if url is provided
    if (body.url) {
      return handleUrlImport(body.url, body.type);
    }

    const rawRows: Record<string, unknown>[] = body.rows || [];
    if (!rawRows.length) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    const mappedRows: any[] = [];
    const skippedRows: any[] = [];

    rawRows.forEach((row, idx) => {
      const mappedRow: any = {};
      let hasData = false;

      Object.entries(row).forEach(([key, value]) => {
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
            mappedRow[dbColumn] = clampNonNegative(isNaN(numVal) ? 0 : numVal);
            hasData = true;
          }
        }
      });

      if (mappedRow.report_date) {
        // Fill missing columns with default 0s
        Object.values(headerMapping).forEach((col) => {
          if (col !== 'report_date' && mappedRow[col] === undefined) {
            mappedRow[col] = 0;
          }
        });
        mappedRows.push(mappedRow);
      } else if (hasData) {
        skippedRows.push({ rowIndex: idx + 2, rowData: row, reason: 'Missing or invalid Date' });
      }
    });

    if (!mappedRows.length) {
      return NextResponse.json({ error: 'No valid rows found' }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const { error: upsertError } = await supabase
      .from('daily_funnel_reports')
      .upsert(mappedRows, { onConflict: 'report_date' });

    if (upsertError) {
      console.error('Database sync error:', upsertError);
      return NextResponse.json({ error: `Failed to save synced records: ${upsertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      importedCount: mappedRows.length,
      skipped: skippedRows,
    });

  } catch (err: any) {
    console.error('Error in import-sheet route:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

// Keep the existing URL-based import logic for fallback / manual admin imports
async function handleUrlImport(url: string, type?: string): Promise<NextResponse> {
  let isCampaign = type === 'campaign';
  if (!type) {
    isCampaign = url.toLowerCase().includes('campaign') || url.toLowerCase().includes('campain');
  }

  let fetchUrl = url;

  if (url.includes('/edit') && !url.includes('/pub')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid Google Sheet URL format' }, { status: 400 });
    }
    const spreadsheetId = match[1];
    const sheetNameParam = isCampaign ? 'Campain Metrics Daily' : 'Leads';
    fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetNameParam)}`;
  }

  const response = await fetch(fetchUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      return NextResponse.json({
        error: 'Access Denied: The Google Sheet is private or not found. Please ensure the sharing settings are set to "Anyone with the link can view" or "Publish to web".'
      }, { status: 403 });
    }
    return NextResponse.json({ error: `Failed to fetch sheet: Status code ${response.status}` }, { status: 400 });
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
  
  if (!type && !isCampaign) {
    isCampaign = workbook.SheetNames.some(
      (name) => name.trim().toLowerCase().includes('campaign') || name.trim().toLowerCase().includes('campain')
    );
  }

  const targetSheetName = isCampaign
    ? (workbook.SheetNames.find(name => name.trim().toLowerCase().includes('campaign') || name.trim().toLowerCase().includes('campain')) || workbook.SheetNames[0])
    : (workbook.SheetNames.find(name => name.trim().toLowerCase() === 'leads') || workbook.SheetNames[0]);

  const sheet = workbook.Sheets[targetSheetName];
  const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

  if (rawRows.length === 0) {
    return NextResponse.json({ error: 'The Google Sheet appears to be empty.' }, { status: 400 });
  }

  const mappedRows: any[] = [];
  const skippedRows: any[] = [];
  const currentMapping = isCampaign ? campaignHeaderMapping : headerMapping;
  const dateField = isCampaign ? 'metric_date' : 'report_date';

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const mappedRow: any = {};
    let hasData = false;

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = normalizeHeader(key);
      const dbColumn = currentMapping[normalizedKey];
      if (dbColumn) {
        if (dbColumn === dateField) {
          const parsedDate = parseDateValue(value);
          if (parsedDate) {
            mappedRow[dbColumn] = parsedDate;
            hasData = true;
          }
        } else if (dbColumn === 'campaign_name' || dbColumn === 'platform') {
          mappedRow[dbColumn] = value !== null ? String(value).trim() : '';
          hasData = true;
        } else {
          const numVal = value !== null && value !== '' ? Number(value) : 0;
          mappedRow[dbColumn] = clampNonNegative(isNaN(numVal) ? 0 : numVal);
          hasData = true;
        }
      }
    }

    if (mappedRow[dateField]) {
      if (isCampaign && !mappedRow.campaign_name) {
        skippedRows.push({ rowIndex: idx + 1, rowData: row, reason: 'Missing Campaign Name' });
      } else {
        for (const col of Object.values(currentMapping) as string[]) {
          if (col !== dateField && col !== 'campaign_name' && col !== 'platform' && mappedRow[col] === undefined) {
            mappedRow[col] = 0;
          }
        }
        mappedRows.push(mappedRow);
      }
    } else if (hasData) {
      skippedRows.push({ rowIndex: idx + 1, rowData: row, reason: `Missing or invalid ${isCampaign ? 'Date' : 'Leads Date'}` });
    }
  }

  if (mappedRows.length > 0) {
    const supabase = await getSupabaseClient();
    const targetTable = isCampaign ? 'campaign_daily_metrics' : 'daily_funnel_reports';
    const conflictKeys = isCampaign ? 'metric_date,campaign_name' : 'report_date';
    
    const { error: upsertError } = await supabase
      .from(targetTable)
      .upsert(mappedRows, { onConflict: conflictKeys });

    if (upsertError) {
      console.error('Database sync error:', upsertError);
      return NextResponse.json({ error: `Failed to save synced records: ${upsertError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    data: mappedRows,
    skipped: skippedRows,
    totalCount: rawRows.length,
    importedCount: mappedRows.length,
    sheetUsed: targetSheetName,
    type: isCampaign ? 'campaign' : 'leads'
  });
}
