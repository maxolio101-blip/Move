// Pure: parse the clipboard produced by the iOS Shortcut.
// Expected: MOVE_STEPS|YYYY-MM-DD|NUMBER
// Tolerates: surrounding whitespace/newlines, grouping separators
// (8,432 · 8’432 · 8'432 · 8 432) and a decimal part (8432.0 → 8432).

import { fromISODate } from './date.js';

export const MAX_STEPS = 150000;

/** @returns {{ok:true,date:string,steps:number} | {ok:false,error:string}} error is a strings.js key */
export function parseStepsClipboard(text, todayISO) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'steps.errEmpty' };
  const parts = text.trim().split('|').map((p) => p.trim());
  if (parts.length !== 3 || parts[0] !== 'MOVE_STEPS') return { ok: false, error: 'steps.errFormat' };

  const [, date, raw] = parts;
  if (!fromISODate(date)) return { ok: false, error: 'steps.errDate' };
  if (todayISO && date > todayISO) return { ok: false, error: 'steps.errFuture' };

  const steps = parseStepNumber(raw);
  if (steps == null) return { ok: false, error: 'steps.errNumber' };
  return { ok: true, date, steps };
}

/** '8’432' → 8432 · '8432.0' → 8432 · '8,432.6' → 8433 · 'abc' → null */
export function parseStepNumber(raw) {
  let s = String(raw ?? '').replace(/[\s  '’]/g, '');
  if (!s) return null;
  // A trailing [.,] followed by 1–2 digits is a decimal part; other [.,] are grouping.
  const dec = /[.,](\d{1,2})$/.exec(s);
  let frac = 0;
  if (dec) { frac = Number(`0.${dec[1]}`); s = s.slice(0, dec.index); }
  s = s.replace(/[.,]/g, '');
  if (!/^\d+$/.test(s)) return null;
  const n = Math.round(Number(s) + frac);
  return n >= 0 && n <= MAX_STEPS ? n : null;
}
