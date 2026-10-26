// Backup als eine JSON-Datei: kniffel-backup-JJJJ-MM-TT.json
// Import muss alte Formate dauerhaft lesen können: Format 1 = { app, format, exportedAt, data: AppState }.
// Eine nackte AppState-Datei (ohne Hülle) wird ebenfalls angenommen.

import { normalizeState } from '../lib/game.js';
import { fmtIsoDate } from '../lib/format.js';

const FORMAT = 1;

export async function exportBackup(state) {
  const body = JSON.stringify({ app: 'kniffel', format: FORMAT, exportedAt: new Date().toISOString(), data: state }, null, 2);
  const name = 'kniffel-backup-' + fmtIsoDate(Date.now()) + '.json';
  const file = new File([body], name, { type: 'application/json' });

  // iOS: Teilen-Sheet („In Dateien sichern“), sonst normaler Download
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'aborted';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

// Liest eine Backup-Datei und gibt einen geprüften AppState zurück (wirft bei unbrauchbarer Datei)
export async function readBackup(file) {
  let raw;
  try { raw = JSON.parse(await file.text()); } catch (e) { throw new Error('Die Datei ist kein Kniffel-Backup.'); }
  const data = raw && raw.app === 'kniffel' && raw.data ? raw.data : raw;
  if (!data || typeof data !== 'object' || (!data.current && !Array.isArray(data.archive))) {
    throw new Error('Die Datei ist kein Kniffel-Backup.');
  }
  return normalizeState(data);
}
