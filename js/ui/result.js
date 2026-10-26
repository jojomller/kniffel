// 07 Ergebnis

import { h } from '../vdom.js';
import { ranking, colLabel, nextStarter } from '../lib/game.js';
import { fmtDate, fmtDiff, joinNames } from '../lib/format.js';
import { icStats, icClose, circle } from './icons.js';

export function findGame(app, id) {
  if (app.current.id === id) return app.current;
  return app.archive.find(a => a.id === id) || null;
}

export function resultView(app, ui, A) {
  const g = findGame(app, ui.resultId);
  if (!g) return null;
  const rows = ranking(g);
  const top = rows[0].total;
  const win = rows.filter(r => r.rank === 1);
  const winText = joinNames(win.map(r => r.name));
  const len = winText.length;
  const winFs = len <= 5 ? 80 : len <= 7 ? 68 : len <= 10 ? 56 : len <= 14 ? 44 : 34;
  const isCurrent = g.id === app.current.id && g.status === 'finished';
  const nx = nextStarter(g);

  return [
    h('div', { class: 'res-top' },
      h('button', { class: 'icbtn', 'aria-label': 'Statistik öffnen', onClick: A.openStats }, icStats()),
      h('button', { class: 'icbtn', 'aria-label': 'Schließen', onClick: A.closeResult }, icClose(18, 2))),
    h('div', { class: 'res-hero' },
      h('span', { class: 'cap' }, 'Spiel beendet · ' + fmtDate(g.finishedAt || g.createdAt)),
      h('h1', { class: 'wax res-win', style: `font-size:${winFs}px;white-space:normal` }, winText),
      h('span', { class: 'cap', style: 'letter-spacing:.4em;color:var(--ink)' }, win.length > 1 ? 'gewinnen' : 'gewinnt'),
      h('div', { class: 'res-circle', role: 'img', 'aria-label': top + ' Punkte' },
        circle(),
        h('span', { class: 'wax', 'aria-hidden': 'true' }, String(top)))),
    h('div', { class: 'res-list', role: 'list', 'aria-label': 'Rangliste' }, rows.map(r =>
      h('div', { class: 'res-row', role: 'listitem' },
        h('span', { class: 'wax res-rank' }, String(r.rank)),
        h('div', { class: 'res-who' },
          h('span', { class: 'wax' }, r.name),
          h('span', { class: 'res-detail' }, 'Oben ' + r.up + (r.bonus ? ' + Bonus ' + r.bonus : '') + ' · Unten ' + r.low)),
        h('div', { class: 'res-sum' },
          h('span', { class: 'wax' }, String(r.total)),
          h('span', null, r.rank === 1 ? 'Sieg' : fmtDiff(r.total - top)))))),
    h('div', { class: 'res-actions' },
      isCurrent && h('button', { class: 'btn-primary', onClick: A.doErase },
        'Neues Spiel', h('small', null, 'Gleiche Namen · ' + colLabel(g.columns[nx], nx) + ' beginnt')),
      isCurrent
        ? h('button', { class: 'btn-secondary', onClick: A.showBlock }, 'Block ansehen')
        : h('button', { class: 'btn-secondary', onClick: A.closeResult }, 'Zurück'))
  ];
}
