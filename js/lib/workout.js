// Pure strength-workout logic. No DOM, no storage.
//
// Session shape (stored in the `strength` store):
// {
//   id, date: 'YYYY-MM-DD', templateId, templateName,
//   startedAt, endedAt: null | ms,
//   restEndsAt: null | ms, restTotal: seconds,
//   exercises: [{
//     key,                      // stable id of this block within the session
//     exerciseId,               // what was actually done
//     substitutedFrom: null | exerciseId,   // set when swapped for this session only
//     sets: [{ reps, load, completed }]
//   }]
// }
// Sets are grouped per exercise block (instead of one flat SetEntry list) so
// a swap applies to the whole block and the order of exercises is explicit.
// `flattenSets()` gives the spec's SetEntry view (exercise, setIndex, …).

export const round2 = (n) => Math.round(n * 100) / 100;

/** Accepts '17.5', '17,5', ' 20 ' → number ≥ 0, or null. */
export function parseLoad(raw) {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = round2(Number(s));
  return n <= 1000 ? n : null;
}

export function parseReps(raw) {
  const s = String(raw ?? '').trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n <= 999 ? n : null;
}

export const stepLoad = (load, inc, dir) => Math.max(0, round2((load || 0) + dir * (inc || 0)));
export const stepReps = (reps, dir) => Math.max(0, (reps || 0) + dir);

/** '17.5' / '20' / '0' (no trailing zeros). */
export const formatLoad = (n) => String(round2(n || 0));

const finished = (s) => s && s.endedAt;

/**
 * The completed sets of the most recent finished session that contains
 * `exerciseId` with at least one completed set. Returns [] if none.
 */
export function lastSetsFor(sessions, exerciseId, excludeId = null) {
  const sorted = [...(sessions || [])].filter((s) => finished(s) && s.id !== excludeId)
    .sort((a, b) => b.startedAt - a.startedAt);
  for (const s of sorted) {
    const sets = s.exercises
      .filter((b) => b.exerciseId === exerciseId)
      .flatMap((b) => b.sets.filter((x) => x.completed));
    if (sets.length) return sets.map(({ reps, load }) => ({ reps, load }));
  }
  return [];
}

/**
 * Build `count` sets: values from the last session (set by set; extra sets
 * copy the last one), otherwise the template targets.
 */
export function prefillSets(count, target, last) {
  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const src = last.length ? last[Math.min(i, last.length - 1)] : target;
    return { reps: src.reps ?? 0, load: src.load ?? 0, completed: false };
  });
}

export function buildSession({ id, template, sessions, now, date }) {
  return {
    id,
    date,
    templateId: template.id,
    templateName: template.name,
    startedAt: now,
    endedAt: null,
    restEndsAt: null,
    restTotal: 0,
    exercises: template.exercises.map((te, i) => ({
      key: `${i}-${te.exerciseId}`,
      exerciseId: te.exerciseId,
      substitutedFrom: null,
      target: { sets: te.sets, reps: te.reps, repsMax: te.repsMax ?? null, restSec: te.restSec ?? null },
      sets: prefillSets(te.sets, { reps: te.reps, load: te.load }, lastSetsFor(sessions, te.exerciseId)),
    })),
  };
}

/** Swap a block's exercise for this session only. Keeps the number of sets and reps. */
export function swapBlock(block, newExerciseId, sessions) {
  const original = block.substitutedFrom || block.exerciseId;
  if (newExerciseId === original) {
    return { ...block, exerciseId: original, substitutedFrom: null };
  }
  const last = lastSetsFor(sessions, newExerciseId);
  const sets = block.sets.map((s, i) => {
    const src = last.length ? last[Math.min(i, last.length - 1)] : { reps: s.reps, load: 0 };
    return { reps: src.reps, load: src.load, completed: false };
  });
  return { ...block, exerciseId: newExerciseId, substitutedFrom: original, sets };
}

export function addSet(block) {
  const last = block.sets[block.sets.length - 1] || { reps: 0, load: 0 };
  return { ...block, sets: [...block.sets, { reps: last.reps, load: last.load, completed: false }] };
}

export function removeSet(block) {
  return block.sets.length > 1 ? { ...block, sets: block.sets.slice(0, -1) } : block;
}

// ---- Timers (timestamp based: correct after iOS suspends the app) --------

export const elapsed = (startedAt, now) => Math.max(0, now - startedAt);
export const restRemaining = (restEndsAt, now) => (restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : null);

// ---- Summary -------------------------------------------------------------

export function sessionStats(session, now = session.endedAt) {
  const sets = session.exercises.flatMap((b) => b.sets);
  return {
    durationMs: elapsed(session.startedAt, now ?? session.startedAt),
    completedSets: sets.filter((s) => s.completed).length,
    totalSets: sets.length,
  };
}

const maxLoad = (sets) => sets.reduce((m, s) => Math.max(m, s.load || 0), 0);

/** Exercises whose best completed load beat the previous session's best. */
export function loadIncreases(session, sessions) {
  const out = [];
  const seen = new Set();
  for (const b of session.exercises) {
    if (seen.has(b.exerciseId)) continue;
    seen.add(b.exerciseId);
    const done = session.exercises.filter((x) => x.exerciseId === b.exerciseId).flatMap((x) => x.sets.filter((s) => s.completed));
    if (!done.length) continue;
    const prev = lastSetsFor(sessions, b.exerciseId, session.id);
    if (!prev.length) continue;
    const from = maxLoad(prev), to = maxLoad(done);
    if (to > from) out.push({ exerciseId: b.exerciseId, from, to });
  }
  return out;
}

/** Spec's flat SetEntry view. */
export function flattenSets(session) {
  return session.exercises.flatMap((b) => b.sets.map((s, i) => ({
    exercise: b.exerciseId, setIndex: i, reps: s.reps, load: s.load,
    completed: s.completed, substitutedFrom: b.substitutedFrom || undefined,
  })));
}

/** Index of the first block that still has an uncompleted set (for resuming). */
export function firstOpenBlock(session) {
  const i = session.exercises.findIndex((b) => b.sets.some((s) => !s.completed));
  return i < 0 ? session.exercises.length - 1 : i;
}

// ---- Templates -----------------------------------------------------------

export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it);
  return copy;
}

export const slugify = (name) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'exercise';

/** After editing set `si`, copy `field` to every later set that isn't completed yet. */
export function propagate(block, si, field, value) {
  return {
    ...block,
    sets: block.sets.map((s, i) => (i > si && !s.completed ? { ...s, [field]: value } : s)),
  };
}

/** Remove a whole exercise from this session only. */
export function removeBlock(session, bi) {
  return { ...session, exercises: session.exercises.filter((_, i) => i !== bi) };
}

/** 'Last: 3×12 · 17.5 kg' style text; '12×17.5 · 10×20 kg' when sets differ. null if no history. */
export function formatLast(sets, isBodyweight = false) {
  if (!sets?.length) return null;
  const same = sets.every((s) => s.reps === sets[0].reps && s.load === sets[0].load);
  const kg = (l) => (isBodyweight && !l ? 'BW' : `${formatLoad(l)} kg`);
  if (same) return `${sets.length}×${sets[0].reps} · ${kg(sets[0].load)}`;
  const sameLoad = sets.every((s) => s.load === sets[0].load);
  if (sameLoad) return `${sets.map((s) => s.reps).join('/')} · ${kg(sets[0].load)}`;
  return sets.map((s) => `${s.reps}×${isBodyweight && !s.load ? 'BW' : formatLoad(s.load)}`).join(' · ') + (sets.some((s) => s.load) ? ' kg' : '');
}

/** '3 × 8–10 · 2 min' from a block target; null if none. */
export function formatTarget(target) {
  if (!target) return null;
  const reps = target.repsMax && target.repsMax !== target.reps ? `${target.reps}–${target.repsMax}` : `${target.reps}`;
  const rest = target.restSec ? (target.restSec % 60 === 0 ? `${target.restSec / 60} min` : `${target.restSec} s`) : null;
  return [`${target.sets} × ${reps}`, rest].filter(Boolean).join(' · ');
}
