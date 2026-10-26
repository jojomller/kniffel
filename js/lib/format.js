// Formatierung für Anzeige-Texte

const pad = n => String(n).padStart(2, '0');

export function fmtDate(ts) {
  const d = new Date(ts);
  return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
}

export function fmtIsoDate(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// Kurs im oberen Block: +5 / ±0 / −3 (echtes Minuszeichen)
export function fmtPar(p) {
  if (p > 0) return '+' + p;
  if (p === 0) return '±0';
  return '−' + Math.abs(p);
}

export function fmtDiff(d) {
  return d === 0 ? '±0' : '−' + Math.abs(d);
}

// „JoJo“, „JoJo & Juli“, „JoJo, Juli & Vivi“
export function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}
