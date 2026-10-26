// Kniffel: Zustand, Aktionen, Start, Service-Worker-Registrierung

import { render } from './vdom.js';
import { createStore } from './data/index.js';
import { exportBackup, readBackup } from './data/backup.js';
import * as G from './lib/game.js';
import { view } from './ui/view.js';
import { sumValid } from './ui/sheets.js';

const root = document.getElementById('app');
let store = null;
let app = null; // AppState: { current, knownNames, archive, theme } – wird gespeichert
// Oberflächen-Zustand – wird nicht gespeichert
const ui = {
  page: 'block', from: 'block', resultId: null,
  sheet: null, typed: '', typing: false, nameDraft: '', nameError: '',
  snack: null, flash: null, autoResult: false, pendingImport: null
};
let snackTimer = 0;
let opener = null;

function draw() {
  render(root, view(app, ui, A));
}

function save() {
  store.save(app);
}

function applyTheme() {
  const html = document.documentElement;
  G.THEMES.forEach(t => html.classList.remove(t));
  html.classList.add(app.theme);
  const paper = getComputedStyle(html).getPropertyValue('--paper').trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && paper) meta.setAttribute('content', paper);
  try { localStorage.setItem('kniffel-theme', app.theme); } catch (e) { /* nur Komfort */ }
}

function showSnack(text, undo = false) {
  clearTimeout(snackTimer);
  ui.snack = { text, undo };
  snackTimer = setTimeout(() => {
    ui.snack = null;
    ui.flash = null;
    // Nach dem letzten Eintrag: Ergebnis zeigen, sobald „Rückgängig“ verschwunden ist
    if (ui.autoResult && app.current.status === 'finished' && ui.page === 'block' && !ui.sheet) {
      ui.page = 'result'; ui.from = 'block'; ui.resultId = app.current.id;
    }
    ui.autoResult = false;
    draw();
  }, 4000);
}

function clearSnack() {
  clearTimeout(snackTimer);
  ui.snack = null;
  ui.flash = null;
  ui.autoResult = false;
}

function openSheet(sheet, extra = {}) {
  if (!ui.sheet) opener = document.activeElement;
  Object.assign(ui, { sheet, typed: '', typing: false, nameDraft: '', nameError: '' }, extra);
  draw();
}

function closeSheet() {
  ui.sheet = null;
  ui.typing = false;
  ui.pendingImport = null;
  draw();
  const el = opener;
  opener = null;
  if (el && el.isConnected && typeof el.focus === 'function') el.focus({ preventScroll: true });
}

const label = i => G.colLabel(app.current.columns[i], i);

const A = {
  // Navigation
  openStats() { ui.sheet = null; ui.page = 'stats'; draw(); },
  openRules() { ui.page = 'rules'; draw(); },
  back() { ui.page = ui.page === 'rules' ? 'stats' : 'block'; draw(); },
  showBlock() { ui.page = 'block'; draw(); },
  openResult(id, from) { clearSnack(); ui.sheet = null; ui.page = 'result'; ui.resultId = id; ui.from = from || 'block'; draw(); },
  closeResult() { ui.page = ui.from === 'stats' ? 'stats' : 'block'; draw(); },

  // Sheets
  closeSheet,
  openErase() { openSheet({ type: 'erase' }); },
  openNames(col) { openSheet({ type: 'names', col }); },
  tapCell(col, cat) {
    const cur = app.current.columns[col].scores[cat];
    const kind = G.CAT[cat].kind;
    openSheet({ type: 'entry', col, cat, edit: cur !== undefined, cur },
      { typed: kind === 'sum' && cur ? String(cur) : '' });
  },

  // Punkte
  commitValue(v) {
    const sh = ui.sheet;
    if (!sh || sh.type !== 'entry') return;
    const r = G.commit(app, sh.col, sh.cat, v);
    if (!r.ok) return;
    save();
    const g = app.current;
    const text = r.edited
      ? label(sh.col) + ': ' + G.CAT[sh.cat].label + ' geändert'
      : (r.finished ? 'Letztes Feld eingetragen' : label(G.activeCol(g)) + ' ist dran');
    ui.flash = { col: sh.col, cat: sh.cat };
    ui.autoResult = r.finished;
    showSnack(text, true);
    closeSheet();
  },
  typeDigit(d) {
    const t = ui.typed;
    if (t.length >= 2) return;
    ui.typed = (t === '0' ? '' : t) + d;
    draw();
  },
  backspace() { ui.typed = ui.typed.slice(0, -1); draw(); },
  commitSum() {
    const v = sumValid(ui.typed);
    if (v !== null) A.commitValue(v);
  },
  undo() {
    const last = G.undo(app);
    clearSnack();
    if (last) save();
    draw();
  },

  // Namen & Spalten
  pickName(name) {
    const sh = ui.sheet;
    if (!sh || sh.type !== 'names') return;
    const err = G.setName(app, sh.col, name);
    if (err) { ui.nameError = err; draw(); return; }
    save();
    closeSheet();
  },
  startTyping() { ui.typing = true; ui.nameError = ''; draw(); },
  nameInput(v) { ui.nameDraft = v; if (ui.nameError) { ui.nameError = ''; draw(); } },
  confirmName() { A.pickName(ui.nameDraft); },
  addColumn() {
    const col = G.addColumn(app);
    if (col < 0) return;
    save();
    openSheet({ type: 'names', col });
  },
  removeColumn() {
    const sh = ui.sheet;
    if (!sh || !G.removeColumn(app, sh.col)) return;
    save();
    closeSheet();
  },

  // Neues Spiel
  doErase() {
    G.erase(app);
    clearSnack();
    ui.sheet = null;
    ui.page = 'block';
    save();
    draw();
  },

  // Farbstil
  setTheme(t) {
    if (!G.THEMES.includes(t)) return;
    app.theme = t;
    applyTheme();
    save();
    draw();
  },

  // Backup
  async exportBackup() {
    try {
      const r = await exportBackup(app);
      if (r !== 'aborted') { showSnack(r === 'shared' ? 'Backup geteilt' : 'Backup gespeichert'); draw(); }
    } catch (e) {
      console.warn('Backup:', e);
      showSnack('Backup ging nicht'); draw();
    }
  },
  pickBackup() { document.getElementById('backup-file')?.click(); },
  async importFile(file) {
    try {
      const state = await readBackup(file);
      openSheet({ type: 'import' }, { pendingImport: state });
    } catch (e) {
      showSnack(e.message || 'Die Datei ist kein Kniffel-Backup.'); draw();
    }
  },
  async confirmImport() {
    const s = ui.pendingImport;
    if (!s) return;
    app = s;
    applyTheme();
    clearSnack();
    closeSheet();
    try {
      await store.replaceAll(app);
      showSnack('Backup geladen');
    } catch (e) {
      console.warn('Backup laden:', e);
      showSnack('Backup geladen, aber nicht gespeichert');
    }
    draw();
  }
};

// iOS: Sheet über die Bildschirmtastatur schieben
function watchKeyboard() {
  const vv = window.visualViewport;
  if (!vv) return;
  const html = document.documentElement;
  const update = () => {
    const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    const open = kb > 80;
    html.style.setProperty('--kb', open ? kb + 'px' : '0px');
    html.classList.toggle('kb-open', open);
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  // iOS schiebt die Seite beim Fokussieren manchmal hoch – danach zurücksetzen
  window.addEventListener('focusout', () => setTimeout(() => { if (window.scrollY) window.scrollTo(0, 0); }, 50));
}

async function start() {
  store = await createStore();
  app = await store.load();
  applyTheme();
  watchKeyboard();
  draw();
}

start().catch(e => {
  console.error(e);
  root.textContent = 'Kniffel konnte nicht starten: ' + (e && e.message ? e.message : e);
});

if ('serviceWorker' in navigator && !/[?&]nosw/.test(location.search)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('Service Worker:', e));
  });
}
