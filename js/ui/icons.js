// Kontur-Icons (in --ink) und handgezeichnete Striche (in --pen, Klasse .hs)

import { h } from '../vdom.js';

const icon = (size, sw, ...d) =>
  h('svg', { width: size, height: size, viewBox: '0 0 24 24', class: 'ic', 'stroke-width': sw, 'aria-hidden': 'true' },
    d.map(p => h('path', { d: p })));

export const icStats = () => icon(22, 1.7, 'M4 20h16M7 20v-6M12 20V6M17 20v-9');
export const icErase = () => icon(23, 1.6,
  'M14.1 4.4a1.6 1.6 0 0 1 2.2 0l3.3 3.3a1.6 1.6 0 0 1 0 2.2L11 18.5H7.2l-3-3a1.6 1.6 0 0 1 0-2.2z', 'M8.6 9.9l5.5 5.5', 'M11 18.5h9');
export const icPlus = (size = 22, sw = 1.8) => icon(size, sw, 'M12 4.5v15M4.5 12h15');
export const icClose = (size = 16, sw = 2.2) => icon(size, sw, 'M6 6l12 12M18 6L6 18');
export const icBack = () => icon(22, 1.8, 'M15 5l-7 7 7 7');
export const icChevron = (muted) => {
  const s = icon(16, 1.8, 'M9 5l7 7-7 7');
  if (muted) s.props.style = 'stroke:var(--ink3);flex:none';
  return s;
};
export const icBackspace = () => icon(24, 1.7, 'M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z', 'M12 9.5l5 5M17 9.5l-5 5');
export const icBook = () => icon(22, 1.6,
  'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z', 'M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z');

const stroke = (w, hgt, vb, d, sw, extra = {}) =>
  h('svg', { width: w, height: hgt, viewBox: vb, 'aria-hidden': 'true', ...extra },
    h('path', { class: 'hs', d, 'stroke-width': sw }));

export const underline = () => stroke(36, 7, '0 0 40 7', 'M3 4.5 C 13 1.5, 25 6, 37 2.5', 2.8);
export const strike = (cls) => stroke(50, 14, '0 0 58 16', 'M4 10 C 13 3, 21 13, 30 7 S 47 4, 54 8', 3.6, { style: 'max-width:78%', class: cls || null });
export const strikeKey = () => stroke(30, 12, '0 0 34 12', 'M3 7.5 C 9 3, 14 10, 19 5.5 S 28 4, 31 6', 3);
export const strikeBig = () => stroke(76, 22, '0 0 76 22', 'M5 14 C 17 5, 28 19, 40 10 S 62 6, 71 11', 4);
export const strikeSmall = (w = 54, hgt = 15) => stroke(w, hgt, '0 0 58 16', 'M4 10 C 13 3, 21 13, 30 7 S 47 4, 54 8', 3.6, { style: 'flex:none' });
export const circle = () => stroke(230, 150, '0 0 230 150',
  'M38 92 C 22 44, 82 14, 140 18 C 196 22, 222 64, 196 104 C 172 138, 92 142, 52 120 C 24 104, 22 66, 56 42', 3.4);
export const titleLine = (w) => stroke(w, 14, '0 0 ' + (w + 10) + ' 14', 'M4 9 C ' + Math.round(w * .27) + ' 3, ' + Math.round(w * .62) + ' 13, ' + (w + 6) + ' 4', 3.6);

// Leeres Feld der aktiven Spalte: graue Schreiblinie
export const writeLine = () =>
  h('svg', { width: 32, height: 4, viewBox: '0 0 34 4', 'aria-hidden': 'true', class: 'writeline' },
    h('path', { d: 'M2 2.4 C 12 1.2, 22 3, 32 1.8', style: 'fill:none;stroke:var(--line2);stroke-width:2;stroke-linecap:round' }));

// Würfel mit Augen: n = Augenzahl, size = Kantenlänge, d = Augen-Durchmesser
const PIPS = { 1: ['c'], 2: ['tr', 'bl'], 3: ['tr', 'c', 'bl'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
export function die(n, { size = 19, pip = 3.4, border = 1.5, radius = 5, color = 'var(--ink2)' } = {}) {
  const inner = size - 2 * border;
  const a = inner * 0.27, m = inner * 0.5, z = inner * 0.73;
  const P = { tl: [a, a], tr: [z, a], ml: [a, m], c: [m, m], mr: [z, m], bl: [a, z], br: [z, z] };
  return h('span', {
    class: 'die', 'aria-hidden': 'true',
    style: `width:${size}px;height:${size}px;border:${border}px solid ${color};border-radius:${radius}px`
  }, PIPS[n].map(k => h('i', {
    style: `left:${(P[k][0] - pip / 2).toFixed(1)}px;top:${(P[k][1] - pip / 2).toFixed(1)}px;width:${pip}px;height:${pip}px;background:${color}`
  })));
}
