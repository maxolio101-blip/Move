// Data access used by the views. Every write goes to IndexedDB immediately.
import { get, put, getKV, getKeyRange, getByDateRange } from './db.js';
import { withDefaults, HABITS } from './lib/model.js';

export async function loadSettings() { return withDefaults(await getKV('settings')); }

// ---- Habits -------------------------------------------------------------

export function emptyHabits(date) {
  return Object.fromEntries([['date', date], ...HABITS.map((k) => [k, false])]);
}

export async function getHabits(date) {
  return { ...emptyHabits(date), ...((await get('habits', date)) || {}) };
}

/** Toggle one habit for a date; returns the saved record. */
export async function setHabit(date, key, value) {
  const rec = { ...(await getHabits(date)), [key]: value, updatedAt: Date.now() };
  await put('habits', rec);
  return rec;
}

// ---- Steps --------------------------------------------------------------

export const getSteps = (date) => get('steps', date);

export async function saveSteps(date, steps, source) {
  const rec = { date, steps, source, updatedAt: Date.now() };
  await put('steps', rec);
  return rec;
}

// ---- Week ---------------------------------------------------------------

export async function loadWeek(dates) {
  const [from, to] = [dates[0], dates[6]];
  const [strength, climbs, swims, steps, habits] = await Promise.all([
    getByDateRange('strength', from, to),
    getByDateRange('climbs', from, to),
    getByDateRange('swims', from, to),
    getKeyRange('steps', from, to),
    getKeyRange('habits', from, to),
  ]);
  return { strength, climbs, swims, steps, habits };
}
