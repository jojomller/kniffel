// IndexedDB-Adapter (Standard). Namen von Datenbank und Store nie ändern.
// Der ganze AppState liegt als ein Datensatz unter dem Schlüssel „app“.

const DB_NAME = 'kniffel';
const DB_VERSION = 1;
const STORE = 'state';
const KEY = 'app';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blockiert'));
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function createIdbAdapter() {
  const db = await open();
  return {
    kind: 'idb',
    auth: null, // Platzhalter für eine spätere Anmeldung (z. B. Supabase)
    load: () => tx(db, 'readonly', s => s.get(KEY)),
    save: state => tx(db, 'readwrite', s => s.put(state, KEY)),
    replaceAll: state => tx(db, 'readwrite', s => s.put(state, KEY))
  };
}
