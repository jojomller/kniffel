// Demo-Modus (#demo): zeigt ein laufendes Spiel und ein paar beendete Spiele, speichert nichts.

import { CATS, newGame } from '../lib/game.js';

// Kleiner fester Zufall, damit die Demo bei jedem Start gleich aussieht
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function fullScores(r) {
  const s = {};
  for (const c of CATS) {
    if (c.kind === 'count') s[c.id] = c.face * Math.min(5, Math.floor(r() * 3) + 2 - (r() < 0.2 ? 2 : 0));
    else if (c.kind === 'sum') s[c.id] = r() < 0.08 ? 0 : 14 + Math.floor(r() * 14);
    else s[c.id] = r() < (c.id === 'kn' ? 0.6 : 0.25) ? 0 : c.fixed;
  }
  return s;
}

const DAY = 864e5;

function demoState() {
  const r = rng(7);
  const now = Date.now();
  const games = [
    [['Juli', 'Vivi'], 92], [['JoJo', 'Juli', 'Mo'], 86], [['JoJo', 'Juli'], 79],
    [['JoJo', 'Vivi'], 75], [['JoJo', 'Vivi'], 48], [['Juli', 'Mo'], 30]
  ];
  const archive = games.map(([names, ago], i) => {
    const g = newGame(names, i % names.length, now - ago * DAY);
    g.columns.forEach(c => { c.scores = fullScores(r); });
    g.status = 'finished';
    g.finishedAt = g.createdAt + 40 * 6e4;
    delete g.history;
    return g;
  });
  const current = newGame(['JoJo', 'Juli'], 0, now - 15 * 6e4);
  current.columns[0].scores = { u1: 3, u4: 12, u6: 18, ks: 30 };
  current.columns[1].scores = { u2: 6, u5: 20, fh: 25, kn: 0 };
  current.history = [];
  return { v: 1, current, knownNames: ['JoJo', 'Juli', 'Vivi', 'Mo'], archive, theme: 't-wax' };
}

export function createMemoryAdapter({ demo = true } = {}) {
  let saved = demo ? demoState() : undefined;
  return {
    kind: 'memory',
    auth: null,
    load: async () => (saved ? structuredClone(saved) : undefined),
    save: async () => {},
    replaceAll: async () => {}
  };
}
