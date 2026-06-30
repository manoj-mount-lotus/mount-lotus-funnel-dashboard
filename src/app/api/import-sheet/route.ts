import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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
  'cataract surgery from other': 'cataract_surgery_from_other'
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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Google Sheet URL is required' }, { status: 400 });
    }

    let fetchUrl = url;

    // Convert standard /edit URLs to the CSV export URL.
    // If it is a /pub (published) URL, we can fetch it directly as is.
    if (url.includes('/edit') && !url.includes('/pub')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid Google Sheet URL format' }, { status: 400 });
      }
      const spreadsheetId = match[1];
      fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return NextResponse.json({
          error: 'Access Denied: The Google Sheet is private or not found. Please ensure the sharing settings are set to "Anyone with the link can view" or "Publish to web".'
        }, { status: 403 });
      }
      return NextResponse.json({ error: `Failed to fetch sheet: Status code ${response.status}` }, { status: 400 });
    }

    // Read as ArrayBuffer to support both CSV and XLSX binary formats autodetected by sheetjs
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'The Google Sheet appears to be empty.' }, { status: 400 });
    }

    // Map rows to database schema
    const mappedRows: any[] = [];
    const skippedRows: any[] = [];

    for (let idx = 0; idx < rawRows.length; idx++) {
      const row = rawRows[idx];
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
            // Numeric field
            const numVal = value !== null && value !== '' ? Number(value) : 0;
            mappedRow[dbColumn] = isNaN(numVal) ? 0 : numVal;
            hasData = true;
          }
        }
      }

      if (mappedRow.report_date) {
        // Fill default zeros for missing columns to prevent database constraints errors
        for (const col of Object.values(headerMapping)) {
          if (col !== 'report_date' && mappedRow[col] === undefined) {
            mappedRow[col] = 0;
          }
        }
        mappedRows.push(mappedRow);
      } else if (hasData) {
        skippedRows.push({ rowIndex: idx + 1, rowData: row, reason: 'Missing or invalid Leads Date' });
      }
    }

    return NextResponse.json({
      success: true,
      data: mappedRows,
      skipped: skippedRows,
      totalCount: rawRows.length,
      importedCount: mappedRows.length
    });

  } catch (err: any) {
    console.error('Error fetching/parsing Google Sheet:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while parsing the sheet' }, { status: 500 });
  }
}
