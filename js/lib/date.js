// Pure date helpers. Local time, ISO dates (YYYY-MM-DD) as storage keys,
// weeks start on Monday, European display format.

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar date as 'YYYY-MM-DD' (never UTC — avoids off-by-one at night). */
export function toISODate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → Date at local midnight. Returns null if invalid. */
export function fromISODate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return toISODate(d) === iso ? d : null;   // rejects 2026-02-30
}

export function addDays(d, n) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  return r;
}

/** Monday of the week containing d (local midnight). */
export function startOfWeek(d = new Date()) {
  const day = (d.getDay() + 6) % 7;          // Mon=0 … Sun=6
  return addDays(d, -day);
}

/** The 7 ISO dates Mon→Sun of the week containing d. */
export function weekDates(d = new Date()) {
  const mon = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(mon, i)));
}

/** ISO-8601 week number. */
export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** European style: 'Mon 2 Nov 2026' (withYear=false → 'Mon 2 Nov'). */
export function formatDay(d, withYear = true) {
  const s = `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return withYear ? `${s} ${d.getFullYear()}` : s;
}

/** Numeric European date: '02.11.2026'. */
export function formatNumeric(d) {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Elapsed ms → 'm:ss' or 'h:mm:ss'. Timestamp based, so iOS suspension is harmless. */
export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
