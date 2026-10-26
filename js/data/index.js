// Einziger Zugang der Oberfläche zu den Daten. Adapter austauschbar (IndexedDB, Demo, später z. B. Supabase).

import { createIdbAdapter } from './idb-adapter.js';
import { createMemoryAdapter } from './memory-adapter.js';
import { normalizeState } from '../lib/game.js';

export async function createStore() {
  const demo = /^#demo\b/.test(location.hash);
  let adapter;
  if (demo) adapter = createMemoryAdapter({ demo: true });
  else {
    try {
      adapter = await createIdbAdapter();
    } catch (e) {
      console.warn('IndexedDB nicht verfügbar, es wird nichts gespeichert:', e);
      adapter = createMemoryAdapter({ demo: false });
    }
    // Daten nicht von iOS aufräumen lassen
    try { navigator.storage?.persist?.(); } catch (e) { /* egal */ }
  }

  // Speichern nacheinander, damit ein älterer Stand nie einen neueren überschreibt
  let queue = Promise.resolve();
  return {
    demo,
    kind: adapter.kind,
    async load() {
      let raw;
      try { raw = await adapter.load(); } catch (e) { console.warn('Laden fehlgeschlagen:', e); }
      return normalizeState(raw);
    },
    save(state) {
      const snapshot = structuredClone(state);
      queue = queue.then(() => adapter.save(snapshot)).catch(e => console.warn('Speichern fehlgeschlagen:', e));
      return queue;
    },
    replaceAll(state) {
      const snapshot = structuredClone(state);
      queue = queue.then(() => adapter.replaceAll(snapshot));
      return queue;
    }
  };
}
