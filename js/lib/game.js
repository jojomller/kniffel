// Spiellogik: Datenmodell, Wertung und Aktionen. Rein, ohne DOM, damit sie mit `node --test` prüfbar ist.
// Aktionen ändern den übergebenen AppState direkt; die App speichert und zeichnet danach neu.

export const MAX_COLS = 5;
export const MAX_NAME = 12;
export const THEMES = ['t-wax', 't-pen', 't-pencil'];
export const STATE_VERSION = 1;

export const CATS = [
  { id: 'u1', label: '1er', face: 1, kind: 'count' },
  { id: 'u2', label: '2er', face: 2, kind: 'count' },
  { id: 'u3', label: '3er', face: 3, kind: 'count' },
  { id: 'u4', label: '4er', face: 4, kind: 'count' },
  { id: 'u5', label: '5er', face: 5, kind: 'count' },
  { id: 'u6', label: '6er', face: 6, kind: 'count' },
  { id: 'k3', label: 'Dreierpasch', hint: 'Σ', kind: 'sum' },
  { id: 'k4', label: 'Viererpasch', hint: 'Σ', kind: 'sum' },
  { id: 'fh', label: 'Full House', hint: '25', kind: 'fixed', fixed: 25, rule: '3 gleiche + 2 gleiche', example: [5, 5, 5, 2, 2] },
  { id: 'ks', label: 'Kl. Straße', hint: '30', kind: 'fixed', fixed: 30, rule: '4 in Folge', example: [1, 2, 3, 4, 6] },
  { id: 'gs', label: 'Gr. Straße', hint: '40', kind: 'fixed', fixed: 40, rule: '5 in Folge', example: [2, 3, 4, 5, 6] },
  { id: 'kn', label: 'Kniffel', hint: '50', kind: 'fixed', fixed: 50, rule: '5 gleiche', example: [4, 4, 4, 4, 4] },
  { id: 'ch', label: 'Chance', hint: 'Σ', kind: 'sum' }
];
export const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
export const UPPER = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
export const LOWER = ['k3', 'k4', 'fh', 'ks', 'gs', 'kn', 'ch'];

// ---------- Wertung ----------

export function totals(s) {
  const up = UPPER.reduce((a, c) => a + (s[c] ?? 0), 0);
  const low = LOWER.reduce((a, c) => a + (s[c] ?? 0), 0);
  const bonus = up >= 63 ? 35 : 0;
  // Kurs: Abstand zum Soll von drei Würfeln je Zahl, nur über die gefüllten Felder
  const par = UPPER.reduce((a, c, i) => (s[c] === undefined ? a : a + s[c] - 3 * (i + 1)), 0);
  return { up, low, bonus, par, total: up + bonus + low };
}

export function isValidValue(catId, v) {
  const c = CAT[catId];
  if (!c || !Number.isInteger(v)) return false;
  if (c.kind === 'count') return v >= 0 && v <= 5 * c.face && v % c.face === 0;
  if (c.kind === 'sum') return v === 0 || (v >= 5 && v <= 30);
  return v === 0 || v === c.fixed;
}

// ---------- Abgeleitete Werte (nie speichern) ----------

export const filled = g => g.columns.reduce((n, c) => n + Object.keys(c.scores).length, 0);
export const totalTurns = g => 13 * g.columns.length;
export const isOver = g => g.columns.length > 0 && filled(g) >= totalTurns(g);
export const activeCol = g => (g.startIndex + filled(g)) % g.columns.length;
export const canAddCol = g => filled(g) === 0 && g.columns.length < MAX_COLS;
export const canRemoveCol = g => filled(g) === 0 && g.columns.length > 1;
export const nextStarter = g => (g.startIndex + 1) % g.columns.length;
export const colLabel = (col, i) => col.name || 'Spalte ' + (i + 1);
export const sameName = (a, b) => a.trim().toLocaleLowerCase('de') === b.trim().toLocaleLowerCase('de');

// Rangliste mit gleichem Platz bei gleicher Punktzahl (1, 1, 3 …)
export function ranking(g) {
  const rows = g.columns.map((col, i) => ({ i, name: colLabel(col, i), ...totals(col.scores) }));
  rows.sort((a, b) => b.total - a.total || a.i - b.i);
  rows.forEach((r, k) => { r.rank = k > 0 && r.total === rows[k - 1].total ? rows[k - 1].rank : k + 1; });
  return rows;
}
export const winners = g => ranking(g).filter(r => r.rank === 1);

// Durchschnitt, Siege und Bestwert je Name aus dem Archiv
export function playerStats(archive) {
  const by = new Map();
  for (const g of archive) {
    const top = ranking(g)[0]?.total;
    g.columns.forEach(col => {
      if (!col.name) return;
      const key = col.name.toLocaleLowerCase('de');
      const t = totals(col.scores).total;
      const p = by.get(key) || { name: col.name, games: 0, wins: 0, sum: 0, best: 0 };
      p.games++; p.sum += t; p.best = Math.max(p.best, t);
      if (t === top) p.wins++;
      by.set(key, p);
    });
  }
  return [...by.values()]
    .map(p => ({ name: p.name, games: p.games, wins: p.wins, best: p.best, avg: Math.round(p.sum / p.games) }))
    .sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name, 'de'));
}

// ---------- Erzeugen ----------

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newGame(names, startIndex = 0, now = Date.now()) {
  const columns = names.map(name => ({ name, scores: {} }));
  return { id: uid(), columns, startIndex: startIndex % columns.length, history: [], status: 'running', createdAt: now };
}

export function initialState(knownNames = []) {
  return {
    v: STATE_VERSION,
    current: newGame([knownNames[0] || '', knownNames[1] || '']),
    knownNames: [...knownNames],
    archive: [],
    theme: 't-wax'
  };
}

// ---------- Aktionen ----------

function archiveCopy(g) {
  return {
    id: g.id, startIndex: g.startIndex, status: 'finished', createdAt: g.createdAt, finishedAt: g.finishedAt,
    columns: g.columns.map(c => ({ name: c.name, scores: { ...c.scores } }))
  };
}

// Status und Archiv an den Füllstand anpassen. Gibt true zurück, wenn das Spiel gerade fertig wurde.
function syncStatus(state, now) {
  const g = state.current;
  const idx = state.archive.findIndex(a => a.id === g.id);
  if (isOver(g)) {
    const justFinished = g.status !== 'finished';
    if (justFinished) { g.status = 'finished'; g.finishedAt = now; }
    if (idx >= 0) state.archive[idx] = archiveCopy(g); else state.archive.push(archiveCopy(g));
    return justFinished;
  }
  if (g.status === 'finished') { g.status = 'running'; delete g.finishedAt; }
  if (idx >= 0) state.archive.splice(idx, 1);
  return false;
}

export function rememberName(state, name) {
  state.knownNames = [name, ...state.knownNames.filter(k => !sameName(k, name))];
}

// Gibt null bei Erfolg zurück, sonst einen Hinweistext
export function setName(state, col, raw) {
  const g = state.current;
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
  if (!name || !g.columns[col]) return 'Bitte einen Namen eingeben.';
  const other = g.columns.findIndex((c, i) => i !== col && c.name && sameName(c.name, name));
  if (other >= 0) return name + ' steht schon in Spalte ' + (other + 1) + '.';
  g.columns[col].name = name;
  rememberName(state, name);
  if (g.status === 'finished') syncStatus(state, g.finishedAt);
  return null;
}

export function addColumn(state) {
  const g = state.current;
  if (!canAddCol(g)) return -1;
  g.columns.push({ name: '', scores: {} });
  return g.columns.length - 1;
}

export function removeColumn(state, col) {
  const g = state.current;
  if (!canRemoveCol(g) || !g.columns[col]) return false;
  g.columns.splice(col, 1);
  if (g.startIndex >= g.columns.length) g.startIndex = 0;
  return true;
}

// Trägt einen Wert ein oder ändert ihn. Ergebnis: { ok, edited, finished }
export function commit(state, col, catId, value, now = Date.now()) {
  const g = state.current;
  const c = g.columns[col];
  if (!c || !isValidValue(catId, value)) return { ok: false };
  const prev = c.scores[catId];
  const edited = prev !== undefined;
  if (!edited && (isOver(g) || col !== activeCol(g))) return { ok: false };
  c.scores[catId] = value;
  g.history.push(prev === undefined ? { col, cat: catId, at: now } : { col, cat: catId, prev, at: now });
  const finished = syncStatus(state, now);
  return { ok: true, edited, finished };
}

export function undo(state, now = Date.now()) {
  const g = state.current;
  const last = g.history.pop();
  if (!last) return null;
  const c = g.columns[last.col];
  if (c) {
    if (last.prev === undefined) delete c.scores[last.cat]; else c.scores[last.cat] = last.prev;
  }
  syncStatus(state, now);
  return last;
}

// Radierer: Punkte weg, Namen bleiben, die nächste Person beginnt
export function erase(state, now = Date.now()) {
  const g = state.current;
  state.current = newGame(g.columns.map(c => c.name), nextStarter(g), now);
}

// ---------- Laden / Import absichern ----------

function cleanScores(raw) {
  const s = {};
  if (raw && typeof raw === 'object') {
    for (const c of CATS) {
      const v = raw[c.id];
      if (isValidValue(c.id, v)) s[c.id] = v;
    }
  }
  return s;
}

function cleanColumns(raw) {
  const cols = Array.isArray(raw) ? raw.slice(0, MAX_COLS) : [];
  return cols.map(c => ({
    name: typeof c?.name === 'string' ? c.name.trim().slice(0, MAX_NAME) : '',
    scores: cleanScores(c?.scores)
  }));
}

function cleanGame(raw, now) {
  const columns = cleanColumns(raw?.columns);
  if (!columns.length) return null;
  const n = columns.length;
  const g = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    columns,
    startIndex: Number.isInteger(raw.startIndex) ? ((raw.startIndex % n) + n) % n : 0,
    history: Array.isArray(raw.history)
      ? raw.history.filter(h => h && Number.isInteger(h.col) && h.col < n && CAT[h.cat])
        .map(h => (h.prev === undefined ? { col: h.col, cat: h.cat, at: +h.at || now } : { col: h.col, cat: h.cat, prev: h.prev, at: +h.at || now }))
      : [],
    status: 'running',
    createdAt: +raw.createdAt || now
  };
  if (isOver(g)) { g.status = 'finished'; g.finishedAt = +raw.finishedAt || g.createdAt; }
  return g;
}

export function normalizeState(raw, now = Date.now()) {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const known = Array.isArray(raw.knownNames)
    ? raw.knownNames.filter(k => typeof k === 'string' && k.trim()).map(k => k.trim().slice(0, MAX_NAME))
    : [];
  const knownNames = known.filter((k, i) => known.findIndex(x => sameName(x, k)) === i);
  const archive = (Array.isArray(raw.archive) ? raw.archive : [])
    .map(g => cleanGame(g, now))
    .filter(g => g && g.status === 'finished')
    .map(g => archiveCopy(g));
  const current = cleanGame(raw.current, now) || initialState(knownNames).current;
  const state = {
    v: STATE_VERSION,
    current,
    knownNames,
    archive,
    theme: THEMES.includes(raw.theme) ? raw.theme : 't-wax'
  };
  if (current.status === 'finished' && !archive.some(a => a.id === current.id)) archive.push(archiveCopy(current));
  return state;
}
