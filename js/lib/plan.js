// Pure: planned days → weekly targets, per-day planned vs done.
// A plan day: { date, items: [{ kind: 'strength', templateId } | { kind: 'climb' } | { kind: 'swim' }] }
// (empty items = rest day). Weeks without plan days fall back to the default rule.

export const KIND_TO_ACTIVITY = { strength: 'gym', climb: 'climbing', swim: 'swim' };

export function countPlanned(days, filter = () => true) {
  const c = { gym: 0, climbing: 0, swim: 0 };
  for (const d of days || []) {
    if (!filter(d.date)) continue;
    for (const it of d.items || []) c[KIND_TO_ACTIVITY[it.kind]]++;
  }
  return c;
}

/** Remaining planned items for a day once what was done is matched off. */
export function remainingPlanned(items, done) {
  const left = { gym: done.gym || 0, climbing: done.climb || 0, swim: done.swim || 0 };
  return (items || []).filter((it) => {
    const a = KIND_TO_ACTIVITY[it.kind];
    if (left[a] > 0) { left[a]--; return false; }
    return true;
  });
}

/** First planned strength template of a day, if any. */
export const plannedTemplateId = (day) => (day?.items || []).find((i) => i.kind === 'strength')?.templateId || null;
