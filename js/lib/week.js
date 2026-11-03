// Pure: weekly targets and the Mon→Sun summary shown on Today.
import { HABITS } from './model.js';
import { countPlanned } from './plan.js';

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
 * @param data    { strength[], climbs[], swims[], habits[] } (records with .date)
 * @param settings  withDefaults() settings
 * @param todayISO
 * @param plan    plan days (optional) — when the week has any, targets come from the plan
 */
export function summarizeWeek(dates, data, settings, todayISO, plan = []) {
  const planBy = new Map((plan || []).map((d) => [d.date, d]));
  const byDate = (list) => {
    const m = new Map();
    for (const r of list || []) m.set(r.date, [...(m.get(r.date) || []), r]);
    return m;
  };
  const gym = byDate((data.strength || []).filter((s) => s.endedAt));   // only finished sessions count
  const climb = byDate(data.climbs);
  const swim = byDate(data.swims);
  const habits = new Map((data.habits || []).map((h) => [h.date, h]));

  const days = dates.map((date) => {
    const h = habits.get(date);
    return {
      date,
      isToday: date === todayISO,
      isFuture: date > todayISO,
      gym: (gym.get(date) || []).length,
      climb: (climb.get(date) || []).length,
      swim: (swim.get(date) || []).length,
      habitsDone: h ? HABITS.filter((k) => h[k]).length : 0,
      planned: planBy.get(date)?.items || null,
    };
  });

  const count = (k) => days.reduce((n, d) => n + d[k], 0);
  const done = { gym: count('gym'), climbing: count('climb'), swim: count('swim') };
  const weekPlan = dates.map((d) => planBy.get(d)).filter(Boolean);
  const targets = weekPlan.length ? countPlanned(weekPlan) : weekTargets(done.climbing, settings.weeklyTargets);
  return { days, done, targets, fromPlan: weekPlan.length > 0 };
}
