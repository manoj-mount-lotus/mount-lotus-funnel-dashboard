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
  
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

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
