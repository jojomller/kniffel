// 01 Block – Startseite der App

import { h } from '../vdom.js';
import { CATS, totals, filled, totalTurns, isOver, activeCol, canAddCol, colLabel } from '../lib/game.js';
import { fmtPar } from '../lib/format.js';
import { icStats, icErase, icPlus, underline, strike, writeLine, die } from './icons.js';

export function blockView(app, ui, A) {
  const g = app.current;
  const n = g.columns.length;
  const f = filled(g);
  const over = isOver(g);
  const active = over ? -1 : activeCol(g);
  const labW = n >= 4 ? 112 : (n === 3 ? 124 : 140);
  const fs = n <= 2 ? 28 : (n === 3 ? 26 : 22);
  const headFs = n <= 2 ? 26 : (n === 3 ? 23 : 19);
  const lfs = n >= 4 ? 13 : (n === 3 ? 14 : 15);
  const sums = g.columns.map(c => totals(c.scores));
  const flash = ui.flash;

  const cells = [];
  cells.push(h('div', { class: 'nh nh-lab' }, h('span', { class: 'cap', style: 'font-size:10px' }, 'Spieler*innen')));
  g.columns.forEach((c, i) => {
    cells.push(h('button', {
      class: 'nh-col' + (i === active ? ' act' : ''),
      'aria-label': colLabel(c, i) + ': Name ändern' + (i === active ? ', ist dran' : ''),
      onClick: () => A.openNames(i)
    },
    c.name ? h('span', { class: 'wax', style: `font-size:${headFs}px` }, c.name) : h('span', { class: 'nh-empty' }, 'Name'),
    i === active && underline()));
  });

  for (const cat of CATS) {
    const sep = cat.id === 'u6' ? ' sep' : '';
    cells.push(h('div', { class: 'rl' + sep },
      cat.face && die(cat.face),
      h('span', { class: 'rl-name', style: `font-size:${lfs}px` }, cat.label),
      h('span', { class: 'rl-hint' }, n >= 4 ? '' : (cat.hint || ''))));

    g.columns.forEach((c, i) => {
      const v = c.scores[cat.id];
      const has = v !== undefined;
      const isAct = i === active;
      const isNew = flash && flash.col === i && flash.cat === cat.id;
      let content = null;
      if (has && v > 0) content = h('span', { key: 'v' + v, class: 'wax' + (isNew ? ' write' : ''), style: `font-size:${fs}px` }, String(v));
      else if (has) content = strike(isNew ? 'write-strike' : '');
      else if (isAct) content = writeLine();
      cells.push(h('div', { class: 'rc' + sep + (isAct ? ' act' : '') },
        (has || isAct) && h('button', {
          class: 'cellbtn',
          'aria-label': colLabel(c, i) + ': ' + cat.label + (has ? (v === 0 ? ' gestrichen' : ' ' + v) + ', ändern' : ' eintragen'),
          onClick: () => A.tapCell(i, cat.id)
        }, content)));
    });

    if (cat.id === 'u6') {
      cells.push(h('div', { class: 'rl act sep' },
        h('span', { class: 'cap', style: 'flex:1;color:var(--ink)' }, 'Bonus'),
        h('span', { class: 'rl-hint' }, n >= 3 ? '' : '+35')));
      sums.forEach(s => {
        cells.push(h('div', { class: 'rc act sep', 'aria-label': s.up >= 63 ? 'Bonus erreicht, plus 35' : 'Oben ' + s.up + ' von 63, Kurs ' + fmtPar(s.par) },
          s.up >= 63
            ? h('span', { class: 'wax', style: 'font-size:24px' }, '+35')
            : [
              h('span', { class: 'bonus-up', 'aria-hidden': 'true' }, String(s.up), n <= 2 && h('span', null, ' / 63')),
              h('span', { class: 'par', 'aria-hidden': 'true' }, fmtPar(s.par))
            ]));
      });
    }
  }

  cells.push(h('div', { class: 'tot-lab' }, h('span', { class: 'cap', style: 'color:var(--ink)' }, 'Gesamt')));
  sums.forEach((s, i) => cells.push(h('div', { class: 'tot' + (i === active ? ' act' : '') },
    h('span', { class: 'wax', style: `font-size:${n <= 2 ? 36 : 28}px;line-height:1` }, String(s.total)))));

  return [
    h('header', { class: 'head' },
      h('button', { class: 'icbtn', 'aria-label': 'Statistik öffnen', onClick: A.openStats }, icStats()),
      h('div', { class: 'head-mid' },
        h('h1', { class: 'wax logo' }, 'kniffel'),
        h('span', { class: 'cap', style: 'font-size:10px' }, over ? 'Spiel beendet' : 'Zug ' + (f + 1) + ' / ' + totalTurns(g))),
      h('div', { class: 'head-right' },
        canAddCol(g) && h('button', { class: 'icbtn', 'aria-label': 'Person hinzufügen', onClick: A.addColumn }, icPlus()),
        h('button', { class: 'icbtn', 'aria-label': 'Neues Spiel – Block leeren', onClick: A.openErase }, icErase()))),
    h('div', { class: 'sheetgrid' + (over ? ' with-bar' : ''), style: `--cols:${labW}px repeat(${n}, minmax(0, 1fr))` }, cells),
    over && !ui.snack && !ui.sheet &&
      h('button', { class: 'overbar', onClick: () => A.openResult(g.id, 'block') }, 'Spiel beendet · Ergebnis')
  ];
}
