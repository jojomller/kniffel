// Wählt die Seite (Block, Statistik, Regeln, Ergebnis) und legt Leiste und Sheets darüber

import { h } from '../vdom.js';
import { blockView } from './block.js';
import { statsView } from './stats.js';
import { rulesView } from './rules.js';
import { resultView } from './result.js';
import { sheetView } from './sheets.js';

export function view(app, ui, A) {
  let page = ui.page;
  let body = null;
  if (page === 'result') body = resultView(app, ui, A);
  if (!body && page === 'result') page = 'block';
  if (page === 'stats') body = statsView(app, ui, A);
  else if (page === 'rules') body = rulesView(app, ui, A);
  else if (page === 'block') body = blockView(app, ui, A);

  return h('main', { key: 'page-' + page, class: 'page page-' + page + (page === 'rules' || page === 'stats' ? ' scroll' : '') },
    body,
    ui.snack && h('div', { key: 'snack', class: 'snack', role: 'status' },
      h('span', { class: 'snack-text' }, ui.snack.text),
      ui.snack.undo && h('button', { class: 'snack-btn', onClick: A.undo }, 'Rückgängig')),
    sheetView(app, ui, A));
}
