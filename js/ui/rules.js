// 09 Spielregeln & Wertung (scrollt)

import { h } from '../vdom.js';
import { icBack, titleLine, strikeSmall } from './icons.js';

const STEPS = [
  ['1', 'Bis zu dreimal würfeln', 'Alle 5 Würfel werfen. Danach beliebig viele zur Seite legen und den Rest erneut werfen – höchstens dreimal pro Zug.'],
  ['2', 'Ein Feld wählen', 'Nach dem letzten Wurf trägst du das Ergebnis in genau ein freies Feld deiner Spalte ein.'],
  ['3', 'Oder streichen', 'Passt kein Feld oder lohnt es sich nicht, streichst du ein freies Feld mit 0.'],
  ['4', 'Weitergeben', 'Dann ist die nächste Person dran. Nach 13 Runden sind alle Felder voll und das Spiel endet.']
];
const UPPER = [
  ['1er bis 6er', 'Nur die Würfel mit dieser Augenzahl zählen. Drei Fünfer = 15.', '0–30'],
  ['Bonus', 'Automatisch bei mindestens 63 im oberen Block.', '+35']
];
const LOWER = [
  ['Dreierpasch', 'Mindestens 3 gleiche – Summe aller 5 Würfel.', '5–30'],
  ['Viererpasch', 'Mindestens 4 gleiche – Summe aller 5 Würfel.', '5–30'],
  ['Full House', '3 gleiche und 2 gleiche, z. B. 5-5-5-2-2.', '25'],
  ['Kleine Straße', '4 aufeinanderfolgende Zahlen, z. B. 2-3-4-5.', '30'],
  ['Große Straße', '5 aufeinanderfolgende Zahlen, 1–5 oder 2–6.', '40'],
  ['Kniffel', '5 gleiche.', '50'],
  ['Chance', 'Beliebiger Wurf – Summe aller 5 Würfel.', '5–30']
];
const TIPS = [
  ['+', 'Person hinzufügen', 'Plus oben rechts neben dem Radierer, bis zu 5 Personen. Nur vor dem ersten Eintrag.'],
  ['Aa', 'Namen eintragen', 'Namen im Block antippen, bekannten Namen wählen oder „Neuer Name“ eintippen.'],
  ['1', 'Punkte eintragen', 'Freies Feld in der markierten Spalte antippen und den Wert wählen oder eintippen.'],
  ['↺', 'Rückgängig', 'Nach jedem Eintrag erscheint unten kurz „Rückgängig“.'],
  ['✎', 'Korrigieren', 'Ein bereits gefülltes Feld antippen und neuen Wert wählen.'],
  ['⌫', 'Neues Spiel', 'Radierer oben rechts: Punkte weg, Namen bleiben, die nächste Person beginnt.'],
  ['=', 'Gleichstand', 'Bei gleicher Punktzahl teilen sich alle den Platz.']
];
const JUMPS = [['ablauf', 'Ablauf'], ['wertung', 'Wertung'], ['bonus', 'Bonus'], ['app', 'In der App']];

const jump = id => {
  const el = document.getElementById('r-' + id);
  if (!el) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

const rrow = ([f, c, p]) => h('div', { class: 'rrow' },
  h('div', null, h('b', null, f), h('span', null, c)),
  h('span', { class: 'wax' }, p));

export function rulesView(app, ui, A) {
  return [
    h('div', { class: 'topbar' },
      h('button', { class: 'icbtn', 'aria-label': 'Zurück zur Statistik', onClick: A.back }, icBack())),
    h('div', { class: 'ptitle' },
      h('h1', { class: 'wax', style: 'font-size:44px' }, 'spielregeln'),
      titleLine(210),
      h('p', { class: 'rules-intro' }, 'Kniffel mit 5 Würfeln, 13 Feldern pro Person. Wer am Ende die meisten Punkte hat, gewinnt.')),
    h('nav', { class: 'jump', 'aria-label': 'Abschnitte' }, JUMPS.map(([id, t]) => h('button', { onClick: () => jump(id) }, t))),

    h('section', { class: 'rsect', id: 'r-ablauf' },
      h('h2', { class: 'cap' }, 'Ablauf eines Zugs'),
      STEPS.map(([n, t, d]) => h('div', { class: 'step' },
        h('span', { class: 'wax' }, n),
        h('div', null, h('b', null, t), h('span', null, d))))),

    h('section', { class: 'rsect', id: 'r-wertung' },
      h('h2', { class: 'cap' }, 'Wertung'),
      h('span', { class: 'rsub' }, 'Oberer Block'),
      UPPER.map(rrow),
      h('span', { class: 'rsub', style: 'padding-top:18px' }, 'Unterer Block'),
      LOWER.map(rrow),
      h('div', { class: 'rnote' }, strikeSmall(), h('span', null, 'Passt nichts, muss ein freies Feld gestrichen werden – es zählt 0.'))),

    h('section', { class: 'rsect', id: 'r-bonus' },
      h('h2', { class: 'cap', style: 'margin-bottom:10px' }, 'Bonus'),
      h('div', { class: 'bonusbox' },
        h('span', { class: 'wax' }, '+35'),
        h('span', null, 'wenn der obere Block zusammen mindestens 63 ergibt. Das sind genau drei von jeder Zahl.')),
      h('p', { class: 'rtext' }, 'Im Block zeigt die Bonus-Zeile „33 / 63“ und daneben den Kurs: ',
        h('strong', null, '+5'), ' heißt, du liegst 5 Punkte über dem Soll von drei pro Zahl.')),

    h('section', { class: 'rsect', id: 'r-app' },
      h('h2', { class: 'cap' }, 'In der App'),
      TIPS.map(([k, t, d]) => h('div', { class: 'tip' },
        h('i', { 'aria-hidden': 'true' }, k),
        h('div', null, h('b', null, t), h('span', null, d))))),
    h('div', { class: 'rules-end' })
  ];
}
