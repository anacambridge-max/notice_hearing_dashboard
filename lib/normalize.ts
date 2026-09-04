export type Row = Record<string, string>;

const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const keys = (rows: Row[]) => rows.length ? Object.keys(rows[0]) : [];

function findKey(rows: Row[], candidates: string[]) {
  const all = keys(rows);
  return all.find(k => candidates.some(c => normalized(k).includes(c)));
}

export function value(row: Row, candidates: string[]) {
  const k = findKey([row], candidates);
  return k ? row[k] : '';
}

export function parseDate(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function deriveSchedule(rows: Row[]) {
  return rows.map((r, index) => ({
    ...r,
    __id: String(index + 1),
    __date: value(r, ['date', 'hearing date', 'scheduled date']),
    __centre: value(r, ['centre', 'center', 'location', 'venue']),
    __status: value(r, ['status', 'disposition', 'hearing status']) || 'Scheduled',
  }));
}

export function metrics(schedule: Row[]) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  const derived = deriveSchedule(schedule);
  let upcoming = 0;
  let completed = 0;
  for (const r of derived) {
    const d = parseDate(r.__date);
    if (d && d >= now && d <= end) upcoming++;
    if (/complete|closed|disposed|done/i.test(r.__status)) completed++;
  }
  const pending = Math.max(0, derived.length - completed);
  return { total: derived.length, upcoming, completed, pending };
}

export function groupByCentre(rows: Row[]) {
  const counts = new Map<string, number>();
  for (const r of deriveSchedule(rows)) counts.set(r.__centre || 'Unknown', (counts.get(r.__centre || 'Unknown') ?? 0) + 1);
  return [...counts.entries()].map(([centre, count]) => ({ centre, count })).sort((a, b) => b.count - a.count);
}

export function groupByDate(rows: Row[]) {
  const counts = new Map<string, number>();
  for (const r of deriveSchedule(rows)) {
    const d = parseDate(r.__date);
    const label = d ? d.toISOString().slice(0, 10) : (r.__date || 'Unknown');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
}
