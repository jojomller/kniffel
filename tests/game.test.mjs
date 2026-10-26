// Tests der Spiellogik: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../js/lib/game.js';

const fresh = (names = ['JoJo', 'Juli']) => {
  const s = G.initialState(names);
  s.current = G.newGame(names);
  return s;
};

// Füllt das Spiel in Zugreihenfolge mit festen Werten
function playOut(s, valueFor) {
  const g = s.current;
  let last;
  while (!G.isOver(g)) {
    const col = G.activeCol(g);
    const cat = G.CATS.find(c => g.columns[col].scores[c.id] === undefined);
    last = G.commit(s, col, cat.id, valueFor(col, cat));
    assert.ok(last.ok, 'commit ' + col + ' ' + cat.id);
  }
  return last;
}

test('totals: Bonus ab 63, Kurs', () => {
  const t = G.totals({ u1: 3, u2: 6, u3: 9, u4: 12, u5: 15, u6: 18 });
  assert.equal(t.up, 63); assert.equal(t.bonus, 35); assert.equal(t.par, 0); assert.equal(t.total, 98);
  const t2 = G.totals({ u1: 3, u4: 12, u6: 18, ks: 30 });
  assert.equal(t2.par, 0 + 0 + 0); assert.equal(t2.up, 33); assert.equal(t2.low, 30); assert.equal(t2.bonus, 0);
  assert.equal(G.totals({ u5: 25 }).par, 10);
  assert.equal(G.totals({ u2: 0 }).par, -6);
});

test('isValidValue', () => {
  assert.ok(G.isValidValue('u3', 9)); assert.ok(!G.isValidValue('u3', 10)); assert.ok(!G.isValidValue('u3', 18));
  assert.ok(G.isValidValue('k3', 0)); assert.ok(G.isValidValue('k3', 5)); assert.ok(!G.isValidValue('k3', 4)); assert.ok(!G.isValidValue('k3', 31));
  assert.ok(G.isValidValue('fh', 25)); assert.ok(G.isValidValue('fh', 0)); assert.ok(!G.isValidValue('fh', 30));
});

test('Zugfolge, nur aktive Spalte, Ändern wechselt den Zug nicht', () => {
  const s = fresh();
  assert.equal(G.activeCol(s.current), 0);
  assert.equal(G.commit(s, 1, 'u1', 3).ok, false);
  assert.ok(G.commit(s, 0, 'u1', 3).ok);
  assert.equal(G.activeCol(s.current), 1);
  const r = G.commit(s, 0, 'u1', 2);
  assert.ok(r.ok && r.edited);
  assert.equal(G.activeCol(s.current), 1);
  assert.equal(s.current.columns[0].scores.u1, 2);
});

test('Undo stellt alten Wert wieder her oder löscht', () => {
  const s = fresh();
  G.commit(s, 0, 'k3', 22);
  G.commit(s, 0, 'k3', 18);
  G.undo(s);
  assert.equal(s.current.columns[0].scores.k3, 22);
  G.undo(s);
  assert.equal(s.current.columns[0].scores.k3, undefined);
  assert.equal(G.undo(s), null);
});

test('Spielende → Archiv; Undo nach Ende holt es zurück', () => {
  const s = fresh();
  const r = playOut(s, (col, cat) => (cat.kind === 'count' ? 3 * cat.face : cat.kind === 'sum' ? 20 : cat.fixed));
  assert.ok(r.finished);
  assert.equal(s.current.status, 'finished');
  assert.equal(s.archive.length, 1);
  assert.equal(G.totals(s.archive[0].columns[0].scores).total, 63 + 35 + 60 + 145);
  // Ändern nach Ende aktualisiert die Kopie im Archiv
  G.commit(s, 0, 'ch', 30);
  assert.equal(s.archive[0].columns[0].scores.ch, 30);
  assert.equal(s.archive.length, 1);
  G.undo(s); // Änderung zurück
  G.undo(s); // letzter Eintrag zurück → läuft wieder
  assert.equal(s.current.status, 'running');
  assert.equal(s.archive.length, 0);
});

test('Gleichstand teilt Platz 1', () => {
  const s = fresh(['JoJo', 'Juli', 'Vivi']);
  playOut(s, (col, cat) => (col === 2 ? 0 : (cat.kind === 'fixed' ? cat.fixed : cat.kind === 'sum' ? 10 : cat.face)));
  const rows = G.ranking(s.current);
  assert.deepEqual(rows.map(r => r.rank), [1, 1, 3]);
  assert.equal(G.winners(s.current).length, 2);
  const st = G.playerStats(s.archive);
  assert.equal(st.find(p => p.name === 'JoJo').wins, 1);
  assert.equal(st.find(p => p.name === 'Juli').wins, 1);
  assert.equal(st.find(p => p.name === 'Vivi').wins, 0);
});

test('Namen: eindeutig, gemerkt, zuletzt benutzte zuerst', () => {
  const s = fresh(['JoJo', 'Juli']);
  s.knownNames = ['JoJo', 'Juli'];
  assert.match(G.setName(s, 1, 'jojo'), /Spalte 1/);
  assert.equal(G.setName(s, 1, '  Vivi  '), null);
  assert.equal(s.current.columns[1].name, 'Vivi');
  assert.deepEqual(s.knownNames, ['Vivi', 'JoJo', 'Juli']);
  assert.equal(G.setName(s, 0, 'Abcdefghijklmnop'), null);
  assert.equal(s.current.columns[0].name.length, 12);
});

test('Spalten nur vor dem ersten Eintrag, max. 5', () => {
  const s = fresh();
  assert.equal(G.addColumn(s), 2);
  assert.equal(G.addColumn(s), 3);
  assert.equal(G.addColumn(s), 4);
  assert.equal(G.addColumn(s), -1);
  assert.ok(G.removeColumn(s, 4));
  G.commit(s, 0, 'u1', 1);
  assert.equal(G.addColumn(s), -1);
  assert.equal(G.removeColumn(s, 1), false);
});

test('Radierer: Namen bleiben, nächste Person beginnt', () => {
  const s = fresh();
  G.commit(s, 0, 'u1', 1);
  G.erase(s);
  assert.equal(G.filled(s.current), 0);
  assert.equal(s.current.startIndex, 1);
  assert.equal(G.activeCol(s.current), 1);
  assert.deepEqual(s.current.columns.map(c => c.name), ['JoJo', 'Juli']);
  assert.equal(s.archive.length, 0);
});

test('normalizeState verwirft Unsinn und behält Gültiges', () => {
  const s = G.normalizeState({
    current: { columns: [{ name: 'A', scores: { u1: 2, u2: 3, fh: 25, zz: 1 } }, { name: 'B' }], startIndex: 7 },
    knownNames: ['A', 'a', ' B ', 3],
    archive: [{ columns: [{ name: 'X', scores: { u1: 1 } }] }],
    theme: 'pink'
  });
  assert.deepEqual(s.current.columns[0].scores, { u1: 2, fh: 25 });
  assert.equal(s.current.startIndex, 1);
  assert.deepEqual(s.knownNames, ['A', 'B']);
  assert.equal(s.archive.length, 0); // unfertiges Spiel gehört nicht ins Archiv
  assert.equal(s.theme, 't-wax');
  assert.equal(G.normalizeState(null).current.columns.length, 2);
});
