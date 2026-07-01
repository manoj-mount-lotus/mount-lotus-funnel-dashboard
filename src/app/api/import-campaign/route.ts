import { NextRequest, NextResponse } from 'next/server';
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

const headerMapping: Record<string, string> = {
  'date':              'metric_date',
  'metric date':       'metric_date',
  'leads date':        'metric_date',
  'campain name':      'campaign_name',
  'campaign name':     'campaign_name',
  'platform':          'platform',
  'reach':             'reach',
  'impressions':       'impressions',
  'video views':       'video_views',
  'link clicks':       'link_clicks',
  'whatsapp clicks':   'whatsapp_clicks',
  'call clicks':       'call_clicks',
};

function norm(s: string): string {
  return String(s || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
}

function parseDateValue(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;
  
  let dateObj: Date | null = null;

  if (val instanceof Date) {
    dateObj = val;
  } else if (typeof val === 'number') {
    dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else {
    const str = String(val).trim();
    // Check if it is already yyyy-mm-dd
    const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    // Adjust for the local timezone offset to get the intended calendar date
    const offsetMs = dateObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(dateObj.getTime() - offsetMs);
    const y = adjustedDate.getUTCFullYear();
    const m = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(adjustedDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);
    
    if (p3 < 100) p3 += 2000;
    
    if (p1 <= 31 && p2 <= 12 && p3 > 1900) {
      return `${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    if (p1 <= 12 && p2 <= 31 && p3 > 1900) {
      return `${p3}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }
  }

  return null;
}

const NUMERIC_COLS = ['reach','impressions','video_views','link_clicks','whatsapp_clicks','call_clicks'];

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
    const rawRows: Record<string, unknown>[] = body.rows || [];

    if (!rawRows.length) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    const mappedRows: any[] = [];
    const skippedRows: { row: number; reason: string }[] = [];

    rawRows.forEach((row, idx) => {
      const mappedRow: any = {};
      let hasData = false;

      Object.entries(row).forEach(([k, v]) => {
        const col = headerMapping[norm(k)];
        if (!col) return;

        if (col === 'metric_date') {
          const d = parseDateValue(v);
          if (d) {
            mappedRow[col] = d;
            hasData = true;
          }
        } else if (col === 'campaign_name' || col === 'platform') {
          mappedRow[col] = String(v ?? '').trim();
          hasData = true;
        } else {
          const n = parseFloat(String(v ?? ''));
          mappedRow[col] = isNaN(n) ? 0 : Math.max(0, n);
          hasData = true;
        }
      });

      if (!mappedRow.metric_date) {
        skippedRows.push({ row: idx + 2, reason: 'Missing or invalid date' });
        return;
      }

      if (!mappedRow.campaign_name) {
        skippedRows.push({ row: idx + 2, reason: 'Missing campaign name' });
        return;
      }

      // Fill missing numeric columns with 0
      NUMERIC_COLS.forEach((col) => {
        if (mappedRow[col] === undefined) mappedRow[col] = 0;
      });

      if (!mappedRow.platform) mappedRow.platform = 'Meta';

      mappedRows.push(mappedRow);
    });

    if (!mappedRows.length) {
      return NextResponse.json({ error: 'No valid rows found' }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const { error: upsertError } = await supabase
      .from('campaign_daily_metrics')
      .upsert(mappedRows, { onConflict: 'metric_date,campaign_name' });

    if (upsertError) {
      console.error('Database sync error:', upsertError);
      return NextResponse.json({ error: `Failed to save synced records: ${upsertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      importedCount: mappedRows.length,
      skipped: skippedRows,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
