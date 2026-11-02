// Pure: weekly targets and the Mon→Sun summary shown on Today.
import { HABITS } from './model.js';

/**
 * Targets for the week, given how many climbing sessions are logged.
 * 2 climbing sessions → gym target drops to 3 (climbing target becomes 2).
 */
export function weekTargets(climbCount, t) {
  const two = climbCount >= 2;
  return {
    gym: two ? t.gymWithTwoClimbs : t.gym,
    climbing: two ? 2 : t.climbing,
    swim: t.swim,
  };
}

/**
 * @param dates   7 ISO dates Mon→Sun
 * @param data    { strength[], climbs[], swims[], steps[], habits[] } (records with .date)
 * @param settings  withDefaults() settings
 * @param todayISO
 */
export function summarizeWeek(dates, data, settings, todayISO) {
  const byDate = (list) => {
    const m = new Map();
    for (const r of list || []) m.set(r.date, [...(m.get(r.date) || []), r]);
    return m;
  };
  const gym = byDate((data.strength || []).filter((s) => s.endedAt));   // only finished sessions count
  const climb = byDate(data.climbs);
  const swim = byDate(data.swims);
  const steps = new Map((data.steps || []).map((s) => [s.date, s.steps]));
  const habits = new Map((data.habits || []).map((h) => [h.date, h]));

  const days = dates.map((date) => {
    const h = habits.get(date);
    const st = steps.get(date);
    return {
      date,
      isToday: date === todayISO,
      isFuture: date > todayISO,
      gym: (gym.get(date) || []).length,
      climb: (climb.get(date) || []).length,
      swim: (swim.get(date) || []).length,
      steps: st ?? null,
      stepsMet: st != null && st >= settings.stepTarget,
      habitsDone: h ? HABITS.filter((k) => h[k]).length : 0,
    };
  });

  const count = (k) => days.reduce((n, d) => n + d[k], 0);
  const done = { gym: count('gym'), climbing: count('climb'), swim: count('swim') };
  return { days, done, targets: weekTargets(done.climbing, settings.weeklyTargets) };
}

/** Fraction 0..1 for the steps ring (capped). */
export const stepsProgress = (steps, target) => (target > 0 ? Math.min(1, Math.max(0, (steps || 0) / target)) : 0);
