// Data access used by the views. Every write goes to IndexedDB immediately.
import { get, put, getKV, getKeyRange, getByDateRange, getAll, del, setKV } from './db.js';
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

// ---- Exercises & templates ---------------------------------------------


export async function getExercises() {
  return (await getAll('exercises')).sort((a, b) => a.name.localeCompare(b.name));
}
export async function exerciseMap() {
  return new Map((await getAll('exercises')).map((e) => [e.id, e]));
}
export const putExercise = (e) => put('exercises', e);

export async function getTemplates() {
  return (await getAll('templates')).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}
export const getTemplate = (id) => get('templates', id);
export const putTemplate = (t) => put('templates', t);
export const deleteTemplate = (id) => del('templates', id);

// ---- Strength sessions --------------------------------------------------

export const getAllStrength = () => getAll('strength');
export const getSession = (id) => get('strength', id);
export const deleteSession = (id) => del('strength', id);

// Writes are queued so rapid taps are stored in order, never out of order.
let queue = Promise.resolve();
export function saveSession(session) {
  const copy = structuredClone(session);
  const p = queue.then(() => put('strength', copy));
  queue = p.catch((e) => console.error('[save]', e));   // one failure never blocks later saves
  return p;
}

export async function getActiveSessionId() { return ((await getKV('meta')) || {}).activeWorkoutId || null; }
export async function setActiveSessionId(id) {
  const meta = (await getKV('meta')) || {};
  await setKV('meta', { ...meta, activeWorkoutId: id });
}
