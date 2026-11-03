import { getKV, setKV, transaction, openDB } from './db.js';
import { DEFAULT_SETTINGS, SEED_EXERCISES, SEED_TEMPLATES } from './lib/model.js';
import * as P1 from './data/phase1.js';

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

const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

/**
 * Import the 8-week Phase 1 programme once. Never overwrites anything the
 * user already has (except giving the shared press its programme name).
 */
export async function importPlanIfNeeded() {
  const meta = (await getKV('meta')) || {};
  const done = meta.plansImported || [];
  if (done.includes(P1.PLAN_ID)) return false;

  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['exercises', 'templates', 'plan'], 'readwrite');
    const exS = tx.objectStore('exercises'), tpS = tx.objectStore('templates'), plS = tx.objectStore('plan');
    (async () => {
      for (const e of P1.EXERCISES) {
        const cur = await reqP(exS.get(e.id));
        exS.put(cur ? { ...cur, name: e.name } : { ...e, increment: null });
      }
      for (const t of P1.TEMPLATES) {
        if (!(await reqP(tpS.get(t.id)))) tpS.put(t);
      }
      for (const d of P1.planDays()) {
        if (!(await reqP(plS.get(d.date)))) plS.put(d);
      }
    })().catch((e) => { tx.abort(); reject(e); });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  await setKV('meta', { ...((await getKV('meta')) || {}), plansImported: [...done, P1.PLAN_ID] });
  return true;
}
