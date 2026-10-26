// 08 Statistik & Farbstil

import { h } from '../vdom.js';
import { playerStats, ranking } from '../lib/game.js';
import { fmtDate, joinNames } from '../lib/format.js';
import { icBack, icBook, icChevron, titleLine } from './icons.js';

const STYLES = [
  { cls: 't-wax', name: 'Wachs', sw: 3.6 },
  { cls: 't-pen', name: 'Kuli', sw: 2 },
  { cls: 't-pencil', name: 'Buntstift', sw: 3.6 }
];

export function statsView(app, ui, A) {
  const avgs = playerStats(app.archive);
  const maxAvg = Math.max(300, ...avgs.map(a => a.avg));
  const games = [...app.archive].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));

  return [
    h('div', { class: 'topbar' },
      h('button', { class: 'icbtn', 'aria-label': 'Zurück zum Block', onClick: A.back }, icBack())),
    h('div', { class: 'ptitle' },
      h('h1', { class: 'wax' }, 'statistik'),
      titleLine(190)),

    h('section', { class: 'sect', style: 'padding-top:16px' },
      h('div', { class: 'sect-head' },
        h('span', { class: 'cap' }, 'Durchschnitt'),
        h('span', null, avgs.length === 1 ? '1 Person · Punkte pro Spiel' : avgs.length + ' Personen · Punkte pro Spiel')),
      avgs.length
        ? h('div', { class: 'scrollbox', tabindex: '0', role: 'region', 'aria-label': 'Durchschnitt, scrollbar', style: 'max-height:166px' },
          avgs.map((a, i) => h('div', {
            key: a.name, class: 'avg-row',
            'aria-label': a.name + ': Durchschnitt ' + a.avg + ', ' + a.games + (a.games === 1 ? ' Spiel' : ' Spiele') + ', ' + a.wins + (a.wins === 1 ? ' Sieg' : ' Siege') + ', Bestwert ' + a.best
          },
          h('span', { class: 'wax', style: 'font-size:24px' }, a.name),
          h('div', { class: 'bar', 'aria-hidden': 'true' }, h('i', { class: i === 0 ? 'lead' : '', style: `width:${Math.round(a.avg / maxAvg * 100)}%` })),
          h('span', { class: 'wax', style: 'font-size:28px;text-align:right' }, String(a.avg)))))
        : h('p', { class: 'empty' }, 'Noch kein Spiel beendet. Nach dem ersten vollen Block steht hier, wer im Schnitt vorne liegt.')),

    h('section', { class: 'sect' },
      h('div', { class: 'sect-head' },
        h('span', { class: 'cap' }, 'Letzte Spiele'),
        h('span', null, games.length === 1 ? '1 Spiel' : games.length + ' Spiele')),
      games.length
        ? h('div', { class: 'scrollbox', tabindex: '0', role: 'region', 'aria-label': 'Letzte Spiele, scrollbar', style: 'max-height:178px' },
          games.map(g => {
            const rows = ranking(g);
            const win = rows.filter(r => r.rank === 1).map(r => r.name);
            return h('button', { key: g.id, class: 'game-row', onClick: () => A.openResult(g.id, 'stats') },
              h('div', null,
                h('span', null, g.columns.map((c, i) => c.name || 'Spalte ' + (i + 1)).join(' · ')),
                h('span', null, fmtDate(g.finishedAt || g.createdAt) + ' · Sieg ' + joinNames(win))),
              h('span', { class: 'wax' }, String(rows[0].total)),
              icChevron(true));
          }))
        : h('p', { class: 'empty' }, 'Beendete Spiele erscheinen hier.')),

    h('section', { class: 'sect' },
      h('span', { class: 'cap', id: 'farbstil' }, 'Farbstil'),
      h('div', { class: 'styles', role: 'radiogroup', 'aria-labelledby': 'farbstil' }, STYLES.map(o =>
        h('button', {
          class: 'style-opt', role: 'radio', 'aria-checked': app.theme === o.cls ? 'true' : 'false',
          onClick: () => A.setTheme(o.cls)
        },
        h('span', { class: 'style-pv ' + o.cls, 'aria-hidden': 'true' },
          h('span', { class: 'wax' }, '25'),
          h('svg', { width: 34, height: 10, viewBox: '0 0 58 16' },
            h('path', { class: 'hs', d: 'M4 10 C 13 3, 21 13, 30 7 S 47 4, 54 8', style: 'stroke-width:' + o.sw }))),
        h('span', null, o.name))))),

    h('div', { class: 'stats-foot' },
      h('button', { class: 'navrow', onClick: A.openRules },
        icBook(),
        h('span', null,
          h('span', null, 'Spielregeln & Wertung'),
          h('span', null, 'Ablauf, Punkte, Bonus und Bedienung')),
        icChevron()),
      h('div', { class: 'backup' },
        h('button', { class: 'textlink', onClick: A.exportBackup }, 'Backup sichern'),
        h('button', { class: 'textlink', onClick: A.pickBackup }, 'Backup laden'),
        h('input', {
          type: 'file', accept: 'application/json,.json', class: 'sr', tabindex: '-1', 'aria-hidden': 'true', id: 'backup-file',
          onChange: e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) A.importFile(f); }
        })))
  ];
}
