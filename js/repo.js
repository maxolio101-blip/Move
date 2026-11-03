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

// ---- Week ---------------------------------------------------------------

/** Everything dated within [from, to] (ISO, inclusive). */
export async function loadRange(from, to) {
  const [strength, climbs, swims, habits] = await Promise.all([
    getByDateRange('strength', from, to),
    getByDateRange('climbs', from, to),
    getByDateRange('swims', from, to),
    getKeyRange('habits', from, to),
  ]);
  return { strength, climbs, swims, habits };
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

export const loadWeek = (dates) => loadRange(dates[0], dates[dates.length - 1]);

/** Everything needed for the consistency score (all time). */
export async function loadActivity() {
  const [strength, climbs, swims] = await Promise.all([getAll('strength'), getAll('climbs'), getAll('swims')]);
  return { strength, climbs, swims };
}

// ---- Body weight --------------------------------------------------------

export const getWeights = () => getAll('weights');
export const getWeight = (date) => get('weights', date);
export const saveWeight = (date, kg) => put('weights', { date, kg, updatedAt: Date.now() });
export const deleteWeight = (date) => del('weights', date);

// ---- Climbing & swim ----------------------------------------------------

export const saveClimb = (c) => put('climbs', c);
export const saveSwim = (s) => put('swims', s);
export async function lastOf(store) {
  const all = await getAll(store);
  return all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || 0) - (a.createdAt || 0)))[0] || null;
}
export async function sessionsOn(date) {
  const [strength, climbs, swims] = await Promise.all([
    getByDateRange('strength', date, date), getByDateRange('climbs', date, date), getByDateRange('swims', date, date),
  ]);
  return { strength: strength.filter((s) => s.endedAt), climbs, swims };
}

// ---- Settings -----------------------------------------------------------

export async function updateSettings(patch) {
  const next = { ...withDefaults(await getKV('settings')), ...patch };
  await setKV('settings', next);
  return next;
}

// ---- Plan ---------------------------------------------------------------

export const getPlanRange = (from, to) => getKeyRange('plan', from, to);
export const getAllPlan = () => getAll('plan');
export const getPlanDay = (date) => get('plan', date);
export async function setPlanDay(date, items) {
  const cur = (await get('plan', date)) || { date };
  await put('plan', { ...cur, date, items, editedAt: Date.now() });
}
