// Bottom-Sheets: Namen (02), 1er–6er (03), Summe (04), Festwert (05), Radierer (06), Backup laden

import { h } from '../vdom.js';
import { CAT, filled, colLabel, canRemoveCol, nextStarter } from '../lib/game.js';
import { fmtDate } from '../lib/format.js';
import { icClose, icPlus, icBackspace, strikeKey, strikeBig, die } from './icons.js';

const WORD = ['', 'Einser', 'Zweier', 'Dreier', 'Vierer', 'Fünfer', 'Sechser'];
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function sheetView(app, ui, A) {
  const sh = ui.sheet;
  if (!sh) return null;
  const g = app.current;
  let parts;
  if (sh.type === 'names') parts = namesSheet(app, ui, A, sh);
  else if (sh.type === 'erase') parts = eraseSheet(g, A);
  else if (sh.type === 'import') parts = importSheet(ui, A);
  else parts = entrySheet(g, ui, A, sh);

  return [
    h('button', { key: 'scrim', class: 'scrim', 'aria-label': 'Schließen', tabindex: '-1', onClick: A.closeSheet }),
    h('div', {
      key: 'sheet-' + sh.type + '-' + (sh.col ?? '') + '-' + (sh.cat ?? ''),
      class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sh-title', tabindex: '-1',
      onKeyDown: e => onKey(e, ui, A),
      oncreate: el => el.focus({ preventScroll: true })
    },
    h('div', { class: 'grip', onTouchStart: swipeStart, onTouchMove: swipeMove, onTouchEnd: e => swipeEnd(e, A) }, h('span')),
    h('div', { class: 'sh-head', onTouchStart: swipeStart, onTouchMove: swipeMove, onTouchEnd: e => swipeEnd(e, A) },
      parts.face && die(parts.face, { size: 34, pip: 5.5, border: 2, radius: 9, color: 'var(--ink)' }),
      h('div', { class: 'sh-titles' },
        h('span', { class: 'cap' }, parts.cap),
        h('h2', { id: 'sh-title', class: 'sh-title' }, parts.title)),
      h('button', { class: 'sh-close', 'aria-label': 'Abbrechen', onClick: A.closeSheet }, icClose())),
    parts.body)
  ];
}

// ---------- Eintragen ----------

function entrySheet(g, ui, A, sh) {
  const cat = CAT[sh.cat];
  const who = colLabel(g.columns[sh.col], sh.col);
  const cap = who + (sh.edit ? ' · ändern' : ' · Zug ' + (filled(g) + 1));
  if (cat.kind === 'count') return { cap, title: cat.label, face: cat.face, body: countBody(cat, sh, A) };
  if (cat.kind === 'sum') return { cap, title: cat.label, body: sumBody(ui, A) };
  return { cap, title: cat.label, body: fixedBody(cat, sh, A) };
}

function countBody(cat, sh, A) {
  return [
    h('p', { class: 'sh-q' }, 'Wie viele ' + WORD[cat.face] + ' liegen?'),
    h('div', { class: 'tiles3' }, [0, 1, 2, 3, 4, 5].map(k => {
      const v = k * cat.face;
      const ring = sh.edit && sh.cur === v ? ' ring' : (k === 3 ? ' ring-thin' : '');
      return h('button', {
        class: 'tile' + ring,
        'aria-label': v + ' Punkte, ' + (k === 0 ? 'keine' : k) + ' ' + WORD[cat.face] + (k === 3 ? ', Soll' : ''),
        onClick: () => A.commitValue(v)
      },
      h('span', { class: 'wax' }, String(v)),
      h('span', { class: 'cap' }, k === 0 ? 'keine' : k + ' ×'),
      k === 3 && h('span', { class: 'tile-soll' }, 'SOLL'));
    }))
  ];
}

export const sumValid = typed => {
  const num = typed === '' ? NaN : parseInt(typed, 10);
  return num >= 5 && num <= 30 ? num : null;
};

function sumBody(ui, A) {
  const typed = ui.typed;
  const valid = sumValid(typed) !== null;
  const hint = typed === '' ? 'Summe aller 5 Würfel · 5–30' : (valid ? 'Summe aller 5 Würfel' : 'Nur 5 – 30 möglich');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', '<'].map(k => {
    if (k === 'x') return h('button', { class: 'key flat', 'aria-label': 'Streichen, 0 eintragen', onClick: () => A.commitValue(0) },
      strikeKey(), h('small', null, 'Streichen'));
    if (k === '<') return h('button', { class: 'key flat', 'aria-label': 'Ziffer löschen', onClick: A.backspace }, icBackspace());
    return h('button', { class: 'key', onClick: () => A.typeDigit(k) }, k);
  });
  return [
    h('div', { class: 'sumdisplay' + (valid ? ' ring' : ''), role: 'status', 'aria-live': 'polite', 'aria-label': typed ? 'Eingabe ' + typed + '. ' + hint : hint },
      typed !== '' && h('span', { class: 'wax' }, typed),
      h('span', { class: 'cursor', 'aria-hidden': 'true' }),
      h('span', { class: 'sumhint' + (typed !== '' && !valid ? ' bad' : ''), 'aria-hidden': 'true' }, hint)),
    h('div', { class: 'keypad' }, keys),
    h('button', { class: 'btn-primary', style: 'min-height:56px', disabled: !valid, onClick: A.commitSum }, 'Eintragen')
  ];
}

function fixedBody(cat, sh, A) {
  return [
    h('div', { class: 'dicerow' },
      cat.example.map(d => die(d, { size: 30, pip: 4.6, border: 1.5, radius: 8 })),
      h('span', null, cat.rule)),
    h('div', { class: 'tiles2' },
      h('button', { class: 'bigtile ring', 'aria-label': cat.fixed + ' Punkte eintragen', onClick: () => A.commitValue(cat.fixed) },
        h('span', { class: 'wax' }, String(cat.fixed)),
        h('span', { class: 'cap' }, 'Eintragen')),
      h('button', { class: 'bigtile out' + (sh.edit && sh.cur === 0 ? ' ring' : ''), 'aria-label': 'Streichen, 0 eintragen', onClick: () => A.commitValue(0) },
        strikeBig(),
        h('span', { class: 'cap' }, 'Streichen · 0')))
  ];
}

// ---------- Namen ----------

function namesSheet(app, ui, A, sh) {
  const g = app.current;
  const col = g.columns[sh.col];
  const chips = app.knownNames.map(k => {
    const idx = g.columns.findIndex(c => c.name && c.name.toLocaleLowerCase('de') === k.toLocaleLowerCase('de'));
    const taken = idx >= 0 && idx !== sh.col;
    const cur = idx === sh.col;
    return h('button', {
      class: 'chip' + (cur ? ' on' : ''), disabled: taken, 'aria-pressed': cur ? 'true' : 'false',
      'aria-label': k + (taken ? ', steht in Spalte ' + (idx + 1) : ''),
      onClick: () => A.pickName(k)
    },
    h('span', { class: 'wax' }, k),
    taken && h('span', { class: 'chip-where' }, 'Spalte ' + (idx + 1)));
  });
  const body = [];
  if (chips.length) body.push(h('span', { class: 'cap' }, 'Schon gespielt'));
  body.push(h('div', { class: 'chips' },
    chips,
    h('button', { class: 'chip chip-new' + (ui.typing ? ' on' : ''), 'aria-expanded': ui.typing ? 'true' : 'false', onClick: A.startTyping },
      icPlus(16, 2.4), 'Neuer Name')));
  if (ui.typing) {
    body.push(
      h('label', { for: 'nm', class: 'cap', style: 'padding-top:4px' }, 'Name eintippen'),
      h('div', { class: 'namefield' },
        h('input', {
          id: 'nm', type: 'text', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done',
          maxlength: '12', placeholder: 'z. B. Lena', value: ui.nameDraft,
          onInput: e => A.nameInput(e.target.value),
          onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); A.confirmName(); } },
          oncreate: el => el.focus()
        }),
        h('button', { onClick: A.confirmName }, 'Übernehmen')));
  }
  if (ui.nameError) body.push(h('p', { class: 'note bad', role: 'alert' }, ui.nameError));
  if (canRemoveCol(g)) {
    body.push(h('button', { class: 'textlink', style: 'align-self:flex-start', onClick: A.removeColumn }, 'Spalte entfernen'));
  }
  return { cap: 'Spalte ' + (sh.col + 1), title: col && col.name ? 'Name ändern' : 'Wer spielt mit?', body };
}

// ---------- Radierer ----------

function eraseSheet(g, A) {
  const nx = nextStarter(g);
  return {
    cap: 'Radierer', title: 'Neues Spiel?',
    body: [
      h('p', { class: 'sh-text' }, 'Alle Punkte werden ausradiert. Die Namen bleiben stehen, ',
        h('strong', null, colLabel(g.columns[nx], nx)), ' beginnt.'),
      h('button', { class: 'btn-primary', onClick: A.doErase }, 'Block leeren'),
      h('button', { class: 'btn-secondary', onClick: A.closeSheet }, 'Weiterspielen')
    ]
  };
}

// ---------- Backup laden ----------

function importSheet(ui, A) {
  const s = ui.pendingImport;
  const games = s ? s.archive.length : 0;
  const last = s && s.archive.length ? Math.max(...s.archive.map(a => a.finishedAt || 0)) : 0;
  return {
    cap: 'Backup', title: 'Backup laden?',
    body: [
      h('p', { class: 'sh-text' },
        'Block, Statistik und Namen auf diesem Gerät werden durch das Backup ersetzt. Es enthält ',
        h('strong', null, games === 1 ? '1 Spiel' : games + ' Spiele'),
        last ? ', das letzte vom ' + fmtDate(last) + '.' : '.'),
      h('button', { class: 'btn-primary', onClick: A.confirmImport }, 'Backup laden'),
      h('button', { class: 'btn-secondary', onClick: A.closeSheet }, 'Abbrechen')
    ]
  };
}

// ---------- Tastatur, Fokus-Falle, Wischen ----------

function onKey(e, ui, A) {
  const sheet = e.currentTarget;
  if (e.key === 'Escape') { e.preventDefault(); A.closeSheet(); return; }
  if (e.key === 'Tab') {
    const list = [...sheet.querySelectorAll(FOCUSABLE)];
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }
  const sh = ui.sheet;
  if (sh && sh.cat && CAT[sh.cat].kind === 'sum' && e.target.tagName !== 'INPUT') {
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); A.typeDigit(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); A.backspace(); }
    else if (e.key === 'Enter' && e.target === sheet) { e.preventDefault(); A.commitSum(); }
  }
}

let swipe = null;
function swipeStart(e) {
  if (e.target.closest('button')) return;
  const sheet = e.currentTarget.closest('.sheet');
  swipe = { y: e.touches[0].clientY, dy: 0, sheet };
  sheet.style.transition = 'none';
}
function swipeMove(e) {
  if (!swipe) return;
  swipe.dy = Math.max(0, e.touches[0].clientY - swipe.y);
  swipe.sheet.style.transform = swipe.dy ? `translateY(${swipe.dy}px)` : '';
}
function swipeEnd(e, A) {
  if (!swipe) return;
  const { sheet, dy } = swipe;
  swipe = null;
  if (dy > 80) { A.closeSheet(); return; }
  sheet.style.transition = 'transform 180ms ease-out';
  sheet.style.transform = '';
}
