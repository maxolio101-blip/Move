// Minimal promise wrapper around IndexedDB. No dependencies.
//
// Stores (schema v1):
//   kv          out-of-line keys: 'settings', 'meta'
//   exercises   keyPath id
//   templates   keyPath id
//   strength    keyPath id, index 'date'   (sets[] embedded in the session)
//   climbs      keyPath id, index 'date'
//   swims       keyPath id, index 'date'
//   habits      keyPath date               (one record per day)
//   steps       keyPath date               (one record per day; no longer shown)
//   weights     keyPath date               (one weigh-in per day, kg)
//   plan        keyPath date               (planned items per day)

export const DB_NAME = 'move';
export const DB_VERSION = 3;   // v2: + weights · v3: + plan
export const SCHEMA_VERSION = 1;          // version written into JSON backups

export const STORES = {
  kv: null,
  exercises: { keyPath: 'id' },
  templates: { keyPath: 'id' },
  strength: { keyPath: 'id', indexes: ['date'] },
  climbs: { keyPath: 'id', indexes: ['date'] },
  swims: { keyPath: 'id', indexes: ['date'] },
  habits: { keyPath: 'date' },
  steps: { keyPath: 'date' },
  weights: { keyPath: 'date' },
  plan: { keyPath: 'date' },
};

let dbPromise = null;

const promisify = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, cfg] of Object.entries(STORES)) {
        if (db.objectStoreNames.contains(name)) continue;
        const store = cfg ? db.createObjectStore(name, { keyPath: cfg.keyPath }) : db.createObjectStore(name);
        (cfg?.indexes || []).forEach((ix) => store.createIndex(ix, ix));
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error); };
    req.onblocked = () => console.warn('[db] upgrade blocked by another open tab');
  });
  return dbPromise;
}

async function run(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    let result;
    Promise.resolve(fn(tx.objectStore(storeName))).then((r) => { result = r; }, reject);
    tx.oncomplete = () => resolve(result);       // resolve only once durable
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const get = (store, key) => run(store, 'readonly', (s) => promisify(s.get(key)));
export const getAll = (store) => run(store, 'readonly', (s) => promisify(s.getAll()));
export const put = (store, value, key) => run(store, 'readwrite', (s) => promisify(key === undefined ? s.put(value) : s.put(value, key)));
export const del = (store, key) => run(store, 'readwrite', (s) => promisify(s.delete(key)));
export const clear = (store) => run(store, 'readwrite', (s) => promisify(s.clear()));
export const count = (store) => run(store, 'readonly', (s) => promisify(s.count()));

/** All records whose `date` index falls within [from, to] (ISO strings, inclusive). */
export const getByDateRange = (store, from, to) =>
  run(store, 'readonly', (s) => promisify(s.index('date').getAll(IDBKeyRange.bound(from, to))));

/** All records whose primary key falls within [from, to] — for date-keyed stores (habits, steps). */
export const getKeyRange = (store, from, to) =>
  run(store, 'readonly', (s) => promisify(s.getAll(IDBKeyRange.bound(from, to))));

/** Atomic multi-store write: fn receives { storeName: IDBObjectStore }. */
export async function transaction(storeNames, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, 'readwrite');
    const stores = Object.fromEntries(storeNames.map((n) => [n, tx.objectStore(n)]));
    try { fn(stores); } catch (e) { tx.abort(); reject(e); return; }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

// ---- Key/value helpers ---------------------------------------------------

export const getKV = (key) => get('kv', key);
export const setKV = (key, value) => put('kv', value, key);

/** Ask the browser not to evict our data. Safe to call repeatedly. */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return null;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}

export async function storageEstimate() {
  try { return navigator.storage?.estimate ? await navigator.storage.estimate() : null; }
  catch { return null; }
}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
