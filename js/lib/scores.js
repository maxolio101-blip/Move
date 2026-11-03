// Pure: the two Today scores.
//  • Consistency — sessions done vs weekly targets, since the first session in Move.
//  • Goal — progress of body weight from start to target, on the 7-day average.
import { fromISODate, toISODate, startOfWeek, addDays } from './date.js';
import { weekTargets } from './week.js';
import { countPlanned } from './plan.js';

/**
 * @param data { strength[], climbs[], swims[] }  records with .date (strength: finished only count)
 * @returns { pct: 0..1|null, since: ISO|null, done, expected }
 *
 * Per week: each activity counts up to its target (5 gym sessions don't hide a
 * missed swim). The expected total is prorated for the first and the current
 * week, so the score doesn't drop on Monday morning or penalise a mid-week start.
 * Weeks with a plan use it instead: a planned session counts once its day is
 * over (or as soon as it's done), so a day off isn't a miss unless planned.
 */
export function consistency(data, weeklyTargets, todayISO, plan = []) {
  const planBy = new Map((plan || []).map((d) => [d.date, d]));
  const gym = (data.strength || []).filter((s) => s.endedAt).map((s) => s.date);
  const climb = (data.climbs || []).map((s) => s.date);
  const swim = (data.swims || []).map((s) => s.date);
  const all = [...gym, ...climb, ...swim].filter((d) => d <= todayISO).sort();
  if (!all.length) return { pct: null, since: null, done: 0, expected: 0 };

  const since = all[0];
  const today = fromISODate(todayISO);
  let done = 0, expected = 0;
  for (let mon = startOfWeek(fromISODate(since)); mon <= today; mon = addDays(mon, 7)) {
    const from = toISODate(mon), to = toISODate(addDays(mon, 6));
    const inWeek = (d) => d >= from && d <= to && d >= since && d <= todayISO;
    const c = { gym: gym.filter(inWeek).length, climbing: climb.filter(inWeek).length, swim: swim.filter(inWeek).length };
    const weekPlan = [];
    for (let i = 0; i < 7; i++) { const p = planBy.get(toISODate(addDays(mon, i))); if (p) weekPlan.push(p); }

    if (weekPlan.length) {
      // Planned week: what was due before today, plus today's items once done.
      const inRange = (d) => d >= since && d <= todayISO;
      const all = countPlanned(weekPlan, inRange);
      const past = countPlanned(weekPlan, (d) => d >= since && d < todayISO);
      const todayP = countPlanned(weekPlan, (d) => d === todayISO);
      const doneToday = {
        gym: gym.filter((d) => d === todayISO).length,
        climbing: climb.filter((d) => d === todayISO).length,
        swim: swim.filter((d) => d === todayISO).length,
      };
      let earnedW = 0, expectedW = 0;
      for (const k of ['gym', 'climbing', 'swim']) {
        earnedW += Math.min(c[k], all[k]);
        expectedW += past[k] + Math.min(todayP[k], doneToday[k]);
      }
      done += Math.min(earnedW, expectedW);     // early sessions count once their day is due
      expected += expectedW;
      continue;
    }

    const tg = weekTargets(c.climbing, weeklyTargets);
    let days = 0;
    for (let i = 0; i < 7; i++) { const d = toISODate(addDays(mon, i)); if (d >= since && d <= todayISO) days++; }
    for (const k of ['gym', 'climbing', 'swim']) {
      done += Math.min(c[k], tg[k]);
      expected += tg[k] * (days / 7);
    }
  }
  return { pct: expected > 0 ? Math.min(1, done / expected) : null, since, done, expected };
}

/** Mean of weigh-ins within the last 7 days (today included); falls back to the latest one. */
export function currentWeight(weights, todayISO) {
  const list = [...(weights || [])].filter((w) => w.date <= todayISO).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!list.length) return null;
  const from = toISODate(addDays(fromISODate(todayISO), -6));
  const recent = list.filter((w) => w.date >= from);
  const src = recent.length ? recent : [list[list.length - 1]];
  const avg = src.reduce((s, w) => s + w.kg, 0) / src.length;
  return { kg: Math.round(avg * 10) / 10, count: recent.length, latest: list[list.length - 1] };
}

/** 0..1 progress from start to target (works for gain or loss goals). */
export function goalProgress(currentKg, goal) {
  if (currentKg == null || !goal) return null;
  const span = goal.target - goal.start;
  if (span === 0) return 1;
  return Math.max(0, Math.min(1, (currentKg - goal.start) / span));
}
