// Run: node tests/lib.test.mjs   (Node 22+, no npm needed)
import assert from 'node:assert/strict';
import { toISODate, fromISODate, startOfWeek, weekDates, isoWeek, formatDay, formatNumeric, formatDuration } from '../js/lib/date.js';
import { withDefaults, incrementFor, DEFAULT_SETTINGS } from '../js/lib/model.js';

const d = new Date(2026, 10, 2, 23, 30);          // Mon 2 Nov 2026, late evening
assert.equal(toISODate(d), '2026-11-02');
assert.equal(fromISODate('2026-02-30'), null);
assert.equal(toISODate(fromISODate('2026-11-08')), '2026-11-08');
assert.equal(toISODate(startOfWeek(new Date(2026, 10, 8))), '2026-11-02');   // Sunday → Monday
assert.deepEqual(weekDates(new Date(2026, 10, 4)), ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
assert.equal(isoWeek(new Date(2026, 10, 2)), 45);
assert.equal(isoWeek(new Date(2027, 0, 1)), 53);     // 1 Jan 2027 belongs to W53 of 2026
assert.equal(formatDay(d), 'Mon 2 Nov 2026');
assert.equal(formatNumeric(d), '02.11.2026');
assert.equal(formatDuration(65_000), '1:05');
assert.equal(formatDuration(7_505_000), '2:05:05');

const s = withDefaults({ weightGoal: { target: 80 }, increments: { dumbbell: 1 } });
assert.deepEqual(s.weightGoal, { start: 75.5, target: 80 });
assert.equal(s.restTimerSec, 90);
assert.equal(s.increments.dumbbell, 1);
assert.equal(s.increments.barbell, 2.5);
assert.equal(incrementFor({ equipment: 'machine' }, null), 5);
assert.equal(incrementFor({ equipment: 'dumbbell', increment: 1.25 }, null), 1.25);
assert.equal(DEFAULT_SETTINGS.weeklyTargets.gym, 4);
console.log('All lib tests passed');

// ---- Phase 2: week ------------------------------------------------------
import { weekTargets, summarizeWeek } from '../js/lib/week.js';

const wt = DEFAULT_SETTINGS.weeklyTargets;
assert.deepEqual(weekTargets(0, wt), { gym: 4, climbing: 1, swim: 1 });
assert.deepEqual(weekTargets(1, wt), { gym: 4, climbing: 1, swim: 1 });
assert.deepEqual(weekTargets(2, wt), { gym: 3, climbing: 2, swim: 1 });

const dates = weekDates(new Date(2026, 10, 4));
const sum = summarizeWeek(dates, {
  strength: [{ date: '2026-11-02', endedAt: 1 }, { date: '2026-11-03', endedAt: null }],   // unfinished ignored
  climbs: [{ date: '2026-11-03' }, { date: '2026-11-04' }],
  swims: [],
  habits: [{ date: '2026-11-02', yogaAM: true, creatine: true }],
}, withDefaults(null), '2026-11-04');
assert.deepEqual(sum.done, { gym: 1, climbing: 2, swim: 0 });
assert.equal(sum.targets.gym, 3);
assert.equal(sum.days[0].habitsDone, 2);
assert.equal(sum.days[5].isFuture, true);
console.log('Phase 2 tests passed');

// ---- Phase 3: workout ---------------------------------------------------
import * as W from '../js/lib/workout.js';
import { SEED_TEMPLATES } from '../js/lib/model.js';

assert.equal(W.parseLoad('17,5'), 17.5);
assert.equal(W.parseLoad(' 20 '), 20);
assert.equal(W.parseLoad('-2'), null);
assert.equal(W.parseLoad('abc'), null);
assert.equal(W.parseReps('12'), 12);
assert.equal(W.parseReps('1.5'), null);
assert.equal(W.stepLoad(17.5, 2, 1), 19.5);
assert.equal(W.stepLoad(1, 2.5, -1), 0);
assert.equal(W.stepLoad(10, 1.25, 1), 11.25);
assert.equal(W.stepReps(0, -1), 0);
assert.equal(W.formatLoad(17.5), '17.5');
assert.equal(W.formatLoad(20), '20');

const upper = SEED_TEMPLATES[0];
const s1 = W.buildSession({ id: 's1', template: upper, sessions: [], now: 1000, date: '2026-11-02' });
assert.equal(s1.exercises.length, 6);
assert.deepEqual(s1.exercises[1].sets[0], { reps: 12, load: 17.5, completed: false });
assert.equal(s1.exercises[0].sets.length, 3);

// finish s1 with progress on the press, partial fly
s1.exercises[1].sets = [{ reps: 12, load: 17.5, completed: true }, { reps: 10, load: 20, completed: true }, { reps: 8, load: 20, completed: false }];
s1.exercises[3].sets = [{ reps: 13, load: 48, completed: true }, { reps: 16, load: 48, completed: true }, { reps: 16, load: 48, completed: true }];
s1.endedAt = 2000;

// next session pre-fills from the last completed sets, set by set
const s2 = W.buildSession({ id: 's2', template: upper, sessions: [s1], now: 3000, date: '2026-11-05' });
assert.deepEqual(s2.exercises[1].sets.map((s) => [s.reps, s.load]), [[12, 17.5], [10, 20], [10, 20]]);
assert.deepEqual(s2.exercises[3].sets.map((s) => s.reps), [13, 16, 16]);
assert.deepEqual(s2.exercises[0].sets[0], { reps: 5, load: 0, completed: false });   // no history → template

// an unfinished session never feeds the pre-fill
const draft = { ...s1, id: 'd', endedAt: null, startedAt: 9999 };
assert.equal(W.lastSetsFor([s1, draft], 'machine-fly').length, 3);

// swap + undo
const swapped = W.swapBlock(s2.exercises[4], 'barbell-curl', [s1]);
assert.equal(swapped.exerciseId, 'barbell-curl');
assert.equal(swapped.substitutedFrom, 'db-curl');
assert.equal(swapped.sets.length, 3);
assert.equal(swapped.sets[0].load, 0);
const back = W.swapBlock(swapped, 'db-curl', [s1]);
assert.equal(back.exerciseId, 'db-curl');
assert.equal(back.substitutedFrom, null);

// add / remove sets
assert.equal(W.addSet(s2.exercises[0]).sets.length, 4);
assert.equal(W.removeSet({ sets: [{ reps: 1, load: 0 }] }).sets.length, 1);

// rest + stats + increases
assert.equal(W.restRemaining(10_000, 9_001), 1);
assert.equal(W.restRemaining(null, 5), null);
s2.exercises[1].sets[0] = { reps: 10, load: 22, completed: true };
s2.endedAt = 3000 + 47 * 60_000;
assert.deepEqual(W.sessionStats(s2), { durationMs: 47 * 60_000, completedSets: 1, totalSets: 18 });
assert.deepEqual(W.loadIncreases(s2, [s1, s2]), [{ exerciseId: 'semi-incline-db-press', from: 20, to: 22 }]);
assert.equal(W.firstOpenBlock(s2), 0);
assert.equal(W.flattenSets(s2).length, 18);
assert.deepEqual(W.moveItem([1, 2, 3], 2, 0), [3, 1, 2]);
assert.equal(W.slugify('Goblet Squat (KB)'), 'goblet-squat-kb');
console.log('Phase 3 tests passed');

// ---- 0.4: scores, propagation, last line, habits ------------------------
import { consistency, currentWeight, goalProgress } from '../js/lib/scores.js';
import { HABITS, GRADES } from '../js/lib/model.js';

assert.deepEqual(HABITS, ['yogaAM', 'meditationAM', 'creatine', 'whey', 'collagen', 'dogWalk']);
assert.equal(GRADES[0], '4'); assert.equal(GRADES.at(-1), '8c'); assert.ok(GRADES.includes('6b+'));

// consistency: started Mon 2 Nov, today Wed 4 Nov → expected = 6 × 3/7
const T4 = withDefaults(null).weeklyTargets;
assert.deepEqual(consistency({}, T4, '2026-11-04'), { pct: null, since: null, done: 0, expected: 0 });
let c4 = consistency({ strength: [{ date: '2026-11-02', endedAt: 1 }, { date: '2026-11-03', endedAt: null }] }, T4, '2026-11-04');
assert.equal(c4.since, '2026-11-02'); assert.equal(c4.done, 1);
assert.ok(Math.abs(c4.expected - 18 / 7) < 1e-9);
assert.ok(Math.abs(c4.pct - 7 / 18) < 1e-9);
// full week 1 perfect (4 gym, 1 climb, 1 swim), Monday of week 2 nothing → still high, capped ≤ 100 %
const wk1 = { strength: ['02', '03', '05', '06', '07'].map((d) => ({ date: `2026-11-${d}`, endedAt: 1 })), climbs: [{ date: '2026-11-04' }], swims: [{ date: '2026-11-07' }] };
const c9 = consistency(wk1, T4, '2026-11-09');
assert.equal(c9.done, 6);                       // 5th gym session capped at the target of 4
assert.ok(Math.abs(c9.expected - (6 + 6 / 7)) < 1e-9);
assert.ok(c9.pct > 0.87 && c9.pct <= 1);
// 2 climbs → gym target 3
const c2 = consistency({ strength: ['02', '03', '05'].map((d) => ({ date: `2026-11-${d}`, endedAt: 1 })), climbs: [{ date: '2026-11-04' }, { date: '2026-11-06' }], swims: [{ date: '2026-11-07' }] }, T4, '2026-11-08');
assert.equal(c2.pct, 1);

// weight
const ws = [{ date: '2026-10-20', kg: 74 }, { date: '2026-11-01', kg: 75.4 }, { date: '2026-11-03', kg: 75.5 }, { date: '2026-11-05', kg: 76.2 }];
assert.deepEqual(currentWeight(ws, '2026-11-05').kg, 75.7);
assert.equal(currentWeight(ws, '2026-11-05').count, 3);
assert.equal(currentWeight(ws, '2026-10-25').kg, 74);           // nothing in 7 days → latest
assert.equal(currentWeight([], '2026-11-05'), null);
const G = { start: 75.5, target: 79 };
assert.equal(goalProgress(75.5, G), 0);
assert.ok(Math.abs(goalProgress(77.25, G) - 0.5) < 1e-9);
assert.equal(goalProgress(80, G), 1);
assert.equal(goalProgress(74, G), 0);
assert.equal(goalProgress(null, G), null);

// propagation: editing set 1 updates later uncompleted sets only
const blk = { sets: [{ reps: 12, load: 20, completed: false }, { reps: 12, load: 17.5, completed: true }, { reps: 10, load: 17.5, completed: false }] };
const pb = W.propagate(blk, 0, 'load', 20);
assert.deepEqual(pb.sets.map((s) => s.load), [20, 17.5, 20]);
assert.deepEqual(W.propagate(blk, 2, 'reps', 8).sets.map((s) => s.reps), [12, 12, 10]);   // last set: nothing after it
assert.equal(W.removeBlock({ exercises: [1, 2, 3] }, 1).exercises.join(), '1,3');

// "Last:" text
assert.equal(W.formatLast([{ reps: 12, load: 17.5 }, { reps: 12, load: 17.5 }, { reps: 12, load: 17.5 }]), '3×12 · 17.5 kg');
assert.equal(W.formatLast([{ reps: 13, load: 48 }, { reps: 16, load: 48 }, { reps: 16, load: 48 }]), '13/16/16 · 48 kg');
assert.equal(W.formatLast([{ reps: 12, load: 17.5 }, { reps: 10, load: 20 }]), '12×17.5 · 10×20 kg');
assert.equal(W.formatLast([{ reps: 5, load: 0 }, { reps: 5, load: 0 }], true), '2×5 · BW');
assert.equal(W.formatLast([]), null);
console.log('0.4 tests passed');

// ---- 0.5: plan ------------------------------------------------------------
import { planDays, TEMPLATES, EXERCISES } from '../js/data/phase1.js';
import { countPlanned, remainingPlanned, plannedTemplateId } from '../js/lib/plan.js';

const pd = planDays();
assert.equal(pd.length, 56);
assert.equal(pd[0].date, '2026-11-02'); assert.equal(pd.at(-1).date, '2026-12-27');
assert.deepEqual(pd.slice(0, 7).map((d) => d.items.map((i) => i.templateId || i.kind).join() || 'rest'),
  ['rest', 'p1-lower-a', 'climb', 'rest', 'p1-full-body', 'swim', 'rest']);
assert.deepEqual(pd.slice(7, 14).map((d) => d.items.map((i) => i.templateId || i.kind).join() || 'rest'),
  ['p1-upper-a', 'p1-lower-a', 'climb', 'p1-upper-b', 'p1-lower-b', 'swim', 'rest']);
assert.deepEqual(countPlanned(pd.slice(0, 7)), { gym: 2, climbing: 1, swim: 1 });
assert.deepEqual(countPlanned(pd.slice(7, 14)), { gym: 4, climbing: 1, swim: 1 });
const exIds = new Set(EXERCISES.map((e) => e.id));
for (const tp of TEMPLATES) for (const e of tp.exercises) assert.ok(exIds.has(e.exerciseId), e.exerciseId);
assert.equal(TEMPLATES.find((x) => x.id === 'p1-full-body').exercises.reduce((n, e) => n + e.sets, 0), 14);

assert.deepEqual(remainingPlanned([{ kind: 'strength', templateId: 'x' }], { gym: 1 }), []);
assert.equal(remainingPlanned([{ kind: 'climb' }], { gym: 1 }).length, 1);
assert.equal(plannedTemplateId(pd[1]), 'p1-lower-a');

// week targets from the plan: week 1 = 2 gym in Move
const wk1Sum = summarizeWeek(pd.slice(0, 7).map((d) => d.date), {}, withDefaults(null), '2026-11-03', pd);
assert.deepEqual(wk1Sum.targets, { gym: 2, climbing: 1, swim: 1 });
assert.equal(wk1Sum.fromPlan, true);

// consistency with plan: first session Tue 3 (Lower A day) → 100 %; skipping Thursday (rest) isn't a miss
const P = (list) => list.map(([d]) => ({ date: d, endedAt: 1 }));
let cp = consistency({ strength: P([['2026-11-03']]) }, T4, '2026-11-03', pd);
assert.equal(cp.pct, 1);
cp = consistency({ strength: P([['2026-11-03']]), climbs: [{ date: '2026-11-04' }] }, T4, '2026-11-06', pd);
assert.equal(cp.expected, 2);              // Tue gym + Wed climb due; Thu rest; Fri not done yet
assert.equal(cp.pct, 1);
cp = consistency({ strength: P([['2026-11-03']]), climbs: [{ date: '2026-11-04' }] }, T4, '2026-11-07', pd);
assert.equal(cp.expected, 3);              // Friday full body now missed
assert.ok(Math.abs(cp.pct - 2 / 3) < 1e-9);
const fb = TEMPLATES.find((x) => x.id === 'p1-full-body');
const sFB = W.buildSession({ id: 'f', template: fb, sessions: [], now: 1, date: '2026-11-06' });
assert.deepEqual(sFB.exercises[0].target, { sets: 3, reps: 10, repsMax: 12, restSec: 120 });
assert.equal(W.formatTarget(sFB.exercises[0].target), '3 × 10–12 · 2 min');
assert.equal(W.formatTarget({ sets: 2, reps: 12, repsMax: 15, restSec: 90 }), '2 × 12–15 · 90 s');
console.log('0.5 tests passed');
