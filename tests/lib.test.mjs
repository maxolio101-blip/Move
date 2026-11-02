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

const s = withDefaults({ stepTarget: 10000, increments: { dumbbell: 1 } });
assert.equal(s.stepTarget, 10000);
assert.equal(s.restTimerSec, 90);
assert.equal(s.increments.dumbbell, 1);
assert.equal(s.increments.barbell, 2.5);
assert.equal(incrementFor({ equipment: 'machine' }, null), 5);
assert.equal(incrementFor({ equipment: 'dumbbell', increment: 1.25 }, null), 1.25);
assert.equal(DEFAULT_SETTINGS.weeklyTargets.gym, 4);
console.log('All lib tests passed');

// ---- Phase 2: steps clipboard + week ------------------------------------
import { parseStepsClipboard, parseStepNumber } from '../js/lib/steps.js';
import { weekTargets, summarizeWeek, stepsProgress } from '../js/lib/week.js';

const T = '2026-11-02';
assert.deepEqual(parseStepsClipboard('MOVE_STEPS|2026-11-02|9840', T), { ok: true, date: T, steps: 9840 });
assert.deepEqual(parseStepsClipboard('  MOVE_STEPS|2026-11-01|8’432\n', T), { ok: true, date: '2026-11-01', steps: 8432 });
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-11-02|8,432.0', T).steps, 8432);
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-11-02|8 432', T).steps, 8432);
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-11-02|8432.6', T).steps, 8433);
assert.equal(parseStepsClipboard('', T).error, 'steps.errEmpty');
assert.equal(parseStepsClipboard('hello', T).error, 'steps.errFormat');
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-13-01|10', T).error, 'steps.errDate');
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-11-03|10', T).error, 'steps.errFuture');
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-11-02|-5', T).error, 'steps.errNumber');
assert.equal(parseStepsClipboard('MOVE_STEPS|2026-11-02|999999', T).error, 'steps.errNumber');
assert.equal(parseStepNumber('abc'), null);

const wt = DEFAULT_SETTINGS.weeklyTargets;
assert.deepEqual(weekTargets(0, wt), { gym: 4, climbing: 1, swim: 1 });
assert.deepEqual(weekTargets(1, wt), { gym: 4, climbing: 1, swim: 1 });
assert.deepEqual(weekTargets(2, wt), { gym: 3, climbing: 2, swim: 1 });

const dates = weekDates(new Date(2026, 10, 4));
const sum = summarizeWeek(dates, {
  strength: [{ date: '2026-11-02', endedAt: 1 }, { date: '2026-11-03', endedAt: null }],   // unfinished ignored
  climbs: [{ date: '2026-11-03' }, { date: '2026-11-04' }],
  swims: [],
  steps: [{ date: '2026-11-02', steps: 9000 }, { date: '2026-11-03', steps: 4000 }],
  habits: [{ date: '2026-11-02', yogaAM: true, creatine: true }],
}, withDefaults(null), '2026-11-04');
assert.deepEqual(sum.done, { gym: 1, climbing: 2, swim: 0 });
assert.equal(sum.targets.gym, 3);
assert.equal(sum.days[0].stepsMet, true);
assert.equal(sum.days[1].stepsMet, false);
assert.equal(sum.days[0].habitsDone, 2);
assert.equal(sum.days[5].isFuture, true);
assert.equal(stepsProgress(12000, 8000), 1);
assert.equal(stepsProgress(null, 8000), 0);
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
