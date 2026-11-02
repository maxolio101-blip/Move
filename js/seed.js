import { getKV, setKV, transaction } from './db.js';
import { DEFAULT_SETTINGS, SEED_EXERCISES, SEED_TEMPLATES } from './lib/model.js';

/** First-launch setup. Idempotent: does nothing once `meta.seededAt` exists. */
export async function seedIfNeeded() {
  const meta = (await getKV('meta')) || {};
  if (meta.seededAt) return meta;

  await transaction(['kv', 'exercises', 'templates'], ({ kv, exercises, templates }) => {
    kv.put(structuredClone(DEFAULT_SETTINGS), 'settings');
    SEED_EXERCISES.forEach((e) => exercises.put(e));
    SEED_TEMPLATES.forEach((t) => templates.put(t));
  });

  const next = { ...meta, seededAt: Date.now(), activeWorkoutId: null };
  await setKV('meta', next);
  return next;
}
