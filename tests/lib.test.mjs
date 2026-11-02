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
