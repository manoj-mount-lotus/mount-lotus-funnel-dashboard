export type DateFilterMode = 'today' | 'date' | 'week' | 'month' | 'year' | 'selectYear';

export interface DateRange {
  start: string; // ISO yyyy-mm-dd, inclusive
  end: string;   // ISO yyyy-mm-dd, inclusive
  label: string;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function getRange(mode: DateFilterMode, opts: { date?: string; year?: number } = {}): DateRange {
  const now = new Date();

  if (mode === 'today') {
    const iso = toISO(now);
    return { start: iso, end: iso, label: 'Today' };
  }

  if (mode === 'date') {
    const d = opts.date || toISO(now);
    return { start: d, end: d, label: d };
  }

  if (mode === 'week') {
    const day = now.getDay(); // 0 = Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toISO(monday), end: toISO(sunday), label: 'This Week' };
  }

  if (mode === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: toISO(first), end: toISO(last), label: 'This Month' };
  }

  if (mode === 'year') {
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { start: toISO(first), end: toISO(last), label: 'This Year' };
  }

  // selectYear
  const y = opts.year || now.getFullYear();
  const first = new Date(y, 0, 1);
  const last = new Date(y, 11, 31);
  return { start: toISO(first), end: toISO(last), label: String(y) };
}
