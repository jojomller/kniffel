# Kniffel – Redesign-Spezifikation (v2) für die Umsetzung

> Arbeitsgrundlage für Claude Code. Visuelle Referenz: Design-Canvas „Kniffel Redesign“ (Reihe 1 = Stil Wachs-Rot mit allen Screens, Reihe 2 = Stile Kuli & Buntstift + Stil-Übersicht, Reihe 3 = Spiellogik). Das Artboard **01 Block** ist ein spielbarer Prototyp und dient als Referenz-Implementierung.
>
> **Auftrag an Claude Code:** Baue die bestehende App im vorhandenen Tech-Stack auf dieses Design um.
> - **Online-Modus komplett entfernen** (Code, Screens, Abhängigkeiten). Es wird nur lokal auf einem Gerät gespielt.
> - **Kein Startmenü mehr.** Die App öffnet direkt im Block.
> - Keine iOS-Systemtastatur für Punkte. Für Namen gibt es die Tastatur nur nach Tap auf „Neuer Name“.

---

## 1. Designprinzipien

1. **Ein Blatt Papier, ein Stift.** Die UI ist ruhig und einfarbig. Farbe kommt nur über das, was „von Hand“ geschrieben wird.
2. **Die Stiftfarbe ist reserviert** für Titel, Namen, eingetragene Zahlen, Streich-Linien, Unterstreichungen und Kreise. Nie für Buttons, Flächen oder Fließtext.
3. **Jeder Eintrag in 2–4 Taps.** Keine Validierungsfehler möglich.
4. **Keine Deko.** Keine Schatten außer Hairlines, keine Verläufe auf Flächen, keine Emojis.

---

## 2. Farbstile (Themes)

Drei Stile, wählbar in der Statistik unter „Farbstil“. Die Wahl gilt sofort app-weit und wird lokal gespeichert. Alles läuft über CSS-Variablen auf dem Root-Element (`class="t-wax" | "t-pen" | "t-pencil"`).

| Token | Stil 1 · Wachs (`t-wax`) | Stil 2 · Kuli (`t-pen`) | Stil 3 · Buntstift (`t-pencil`) | Verwendung |
|---|---|---|---|---|
| `--paper` | `#F2F2F0` | `#FBF7E6` | `#FBF6EE` | Hintergrund |
| `--paper2` | `#E8E8E5` | `#F2EBD1` | `#F3EADB` | aktive Spalte, Kacheln, Bonus-Zeile |
| `--line` | `#D9D9D5` | `#E4DBBD` | `#E8DCC8` | Raster, Trenner |
| `--line2` | `#BDBDB8` | `#CDBF97` | `#D3C2A6` | Abschnitte, Outlines, Schreiblinie |
| `--ink` | `#2A2A28` | `#25272D` | `#3A322A` | Text, Primär-Button, Icons |
| `--ink2` | `#4A4A47` | `#464851` | `#5C5246` | sekundärer Text, Würfelaugen |
| `--ink3` | `#666662` | `#5E605F` | `#6B6155` | Labels, Hinweise (≥ 4.5:1) |
| `--pen` | `#CF2A18` | `#1F3FA6` | `#E06A18` | Stiftfarbe (SVG-Striche, Fallback) |
| `--scrim` | `rgba(42,42,40,.45)` | `rgba(37,39,45,.42)` | `rgba(58,50,42,.38)` | Abdunklung hinter Sheets |

Stil 3 ist bewusst hell und freundlich: helles Beige, leuchtendes Orange ohne dunklen/bräunlichen Unterton.
| Handschrift | Gochi Hand 400 | Caveat 600 | Patrick Hand 400 | |

Radien: 9 / 12 / 16 / 24 (Sheet oben). Abstände im 4-px-Raster, Seitenrand 20 px (Block: 16 px). Touch-Ziele ≥ 44 × 44 px.

### 2.1 Die Stift-Textur („Font-Design“)
Die Handschrift wird über `background-clip: text` mit einer stilspezifischen Textur gefüllt. Alle Parameter sind Variablen, damit Stile auch verschachtelt funktionieren (z. B. die Vorschau-Kacheln im Farbstil-Picker).

```css
.t-wax {
  --wfont: 'Gochi Hand', cursive; --wweight: 400;
  /* Saftiges Wachs: Verlauf hell→dunkel, glänzende Körner, fette Kontur, leichter Wachs-Rand */
  --wimg: radial-gradient(circle at 30% 35%, rgba(242,242,240,.5) 0 .45px, transparent .8px),
          radial-gradient(circle at 70% 65%, rgba(255,170,150,.45) 0 .7px, transparent 1.1px),
          linear-gradient(172deg, #E2402A, #CC2412 55%, #B11A0B);
  --wsize: 4px 4px, 7px 6px, 100% 100%;
  --wstroke: .03em #C8210F;
  --wfilter: drop-shadow(0 0 .6px rgba(200,33,15,.5));
  --hsd: none; --hso: 1;
}
.t-pen {
  --wfont: 'Caveat', cursive; --wweight: 600;
  /* Kugelschreiber: glatte Tinte mit feinen Schreibrillen */
  --wimg: repeating-linear-gradient(100deg, transparent 0 3px, rgba(251,247,230,.22) 3px 4px),
          linear-gradient(180deg, #2A4BBE, #17348E);
  --wsize: auto, 100% 100%;
  --wstroke: 0 transparent; --wfilter: none;
  --hsd: none; --hso: 1;
}
.t-pencil {
  --wfont: 'Patrick Hand', cursive; --wweight: 400;
  /* Buntstift: schräge Schraffur + Papierkorn */
  --wimg: repeating-linear-gradient(-55deg, rgba(251,246,238,.55) 0 .7px, transparent .7px 2.4px),
          radial-gradient(circle at 40% 40%, rgba(251,246,238,.6) 0 .5px, transparent .9px),
          linear-gradient(#F0832F, #E06A18 60%, #D85F10);
  --wsize: auto, 3px 3px, 100% 100%;
  --wstroke: .015em rgba(232,112,30,.5); --wfilter: none;
  --hsd: 14 1.5; --hso: .9;
}

.wax {
  font-family: var(--wfont); font-weight: var(--wweight);
  color: var(--pen);                       /* Fallback */
  font-size-adjust: .5;                    /* gleicht die drei Schriften optisch an */
  background-image: var(--wimg); background-size: var(--wsize);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: var(--wstroke);     /* macht Wachs „fettiger“ */
  filter: var(--wfilter);
}
/* Handgezeichnete SVG-Striche (Unterstrich, Streichung, Kreis) */
.hs { fill: none; stroke: var(--pen); stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: var(--hsd); opacity: var(--hso); }
.t-pen .hs { stroke-width: 2px; }          /* Kuli = dünner Strich */
```
Hinweis: kein `text-shadow` auf `.wax` verwenden, es übermalt die geclippte Textur. Für Kanten-Effekte immer `filter: drop-shadow()`.

**Eigene Schrift (optional, später):** Ziffern 0–9 und Kleinbuchstaben pro Stift (Wachsmaler, Kuli, Buntstift) auf Papier schreiben, scannen, mit Calligraphr/FontForge zu woff2 machen, `--wfont` tauschen. Die Textur bleibt gleich.

### 2.2 Schriften
Alle Google Fonts (OFL). Für Offline/PWA lokal als woff2 bündeln.
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Gochi+Hand&family=Instrument+Sans:wght@400;500;600;700&family=Patrick+Hand&display=swap">
```
| Token | Schrift | Größe | Verwendung |
|---|---|---|---|
| `hand-title` | `.wax` | 62–64, rotate(−3°) | `statistik` |
| `hand-logo` | `.wax` | 30, rotate(−2°) | `kniffel` im Block-Kopf |
| `hand-name` | `.wax` | 26 (2 Sp.) / 23 (3) / 19 (4+) | Namen im Block |
| `hand-cell` | `.wax` | 28 / 26 / 22 | Zellwerte |
| `hand-total` | `.wax` | 36 / 28 | Gesamt |
| `ui-title` | Instrument Sans 700 | 24 | Sheet-Titel |
| `ui-row` | Instrument Sans 500 | 15 (14 / 13 bei mehr Spalten) | Feldnamen |
| `ui-hint` | Instrument Sans 400 | 13 | Hinweise |
| `ui-cap` | Instrument Sans 600 | 11, uppercase, +0.16em | Labels |

### 2.3 Handgezeichnete Elemente (SVG, Klasse `.hs`)
| Element | Pfad (viewBox) | stroke-width |
|---|---|---|
| Unterstrich | `M3 4.5 C 13 1.5, 25 6, 37 2.5` (0 0 40 7) | 2.8 |
| Streich-Linie | `M4 10 C 13 3, 21 13, 30 7 S 47 4, 54 8` (0 0 58 16) | 3.4–3.6 |
| Kreis | `M38 92 C 22 44, 82 14, 140 18 C 196 22, 222 64, 196 104 C 172 138, 92 142, 52 120 C 24 104, 22 66, 56 42` (0 0 230 150) | 3.4 |
| Schreiblinie (leer, am Zug) | `M2 2.4 C 12 1.2, 22 3, 32 1.8` (0 0 34 4), Farbe `--line2` | 2 |

Icons: Kontur 1.6–1.8 px in `--ink`, 22–24 px: Diagramm (Statistik), Radiergummi (Neues Spiel), Pfeil zurück, ×, Backspace.

---

## 3. Navigation (gesamt)

```
           ┌───────────── Block (Start, immer) ─────────────┐
 Statistik ◄── Icon oben links        Radierer oben rechts ──► Sheet „Neues Spiel?“
   │  └─ Farbstil wählen                                       
   └─ Zurück ► Block          Spielende ► Ergebnis ► „Neues Spiel“ / „Block ansehen“
```
Nur zwei Seiten (Block, Statistik) + Ergebnis. Alles andere sind Bottom-Sheets über dem Block.

---

## 4. Screens

### 01 Block (Startseite der App)
- **Kopf** (Raster `96px 1fr 96px`): links Statistik-Icon (öffnet neue Seite), Mitte `kniffel` + „Zug x / y“ (bzw. „Spiel beendet“), rechts **„+“ (Person hinzufügen) direkt neben dem Radiergummi** (Neues Spiel), beide als 44-px-Icon-Buttons.
- **„+“:** fügt eine Spalte hinzu und öffnet direkt das Namen-Sheet. Sichtbar, solange weniger als 5 Personen im Block sind; bei 5 ausgeblendet. Außerdem nur vor dem ersten Eintrag (danach würde die Zugfolge nicht mehr stimmen).
- **Namenszeile:** Feld-Spalte („SPIELER*INNEN“) + eine Spalte pro Person. Namen in Handschrift. Ohne Namen: graues „Name“ mit gestrichelter Linie. Aktive Person: Spalte `--paper2` + Unterstrich.
- **Standard:** 2 Spalten, vorbelegt mit den Namen der letzten Runde. Maximal 5.
- **Spaltenbreiten:** Feld-Spalte 140 px (2 Personen), 124 px (3), 112 px (4–5); Personen-Spalten teilen den Rest gleich.
- **Zeilen 44 px:** 1er–6er (mit Würfel-Icon) · Bonus-Zeile (`--paper2`, „33 / 63“ + Kurs-Pill ±; bei ≥ 63 handschriftlich „+35“) · Dreierpasch … Chance (rechts grauer Hinweis Σ / 25 / 30 / 40 / 50) · Gesamt (2 px `--ink` oben).
- **Antippbar:** leere Felder der aktiven Spalte (Schreiblinie) und alle gefüllten Felder (zum Ändern). Leere Felder anderer Spalten nicht.
- **Leiste nach jedem Eintrag** (unten, `--ink`-Pill, 4 s, `role="status"`): „Juli ist dran“ + „RÜCKGÄNGIG“.
- **Spielende:** Leiste „Spiel beendet · Ergebnis“ → öffnet Ergebnis.

### 02 Namen-Sheet
Titel „Wer spielt mit?“ / „Name ändern“, Label „Spalte n“. **Chips „Schon gespielt“** mit allen bekannten Namen in Handschrift; Namen in anderen Spalten sind ausgegraut mit Hinweis „Spalte 1“. Chip **„+ Neuer Name“** blendet Textfeld + „Übernehmen“ ein (Enter übernimmt, max. 12 Zeichen); erst jetzt erscheint die Tastatur. Neue Namen landen automatisch in der Liste. „Spalte entfernen“ (Textlink), nur vor dem ersten Eintrag.

### 03 Eintragen · 1er–6er
Würfel-Icon + „JoJo · Zug 9“ + Feldname. Frage „Wie viele Dreier liegen?“. 3 × 2 Kacheln mit fertigem Punktwert (0, 3 … 15) + „keine / 1× … 5×“. 3×-Kachel trägt „SOLL“. Ein Tap = eintragen.

### 04 Eintragen · Dreierpasch / Viererpasch / Chance – Zahl eingeben
- **Anzeige** (80 px, `--paper2`): getippte Zahl in Handschrift, roter/blauer/oranger Cursor, rechts Hinweis „Summe aller 5 Würfel · 5–30“. Bei gültigem Wert 2-px-Rahmen `--ink`; bei ungültigem Hinweis „Nur 5 – 30 möglich“.
- **Eigenes Zahlenfeld** 3 × 4 (52 px): 1–9, unten links **Streichen** (Streich-Linie + Text, trägt sofort 0 ein), 0, Backspace. Max. 2 Ziffern.
- **„Eintragen“** (Primär), nur aktiv bei 5–30.
- Ändern eines bestehenden Werts: Anzeige ist vorbefüllt.

### 05 Eintragen · Festwert (Full House, Kl./Gr. Straße, Kniffel)
Beispielwurf + Regel in einem Satz. Zwei Kacheln: **[Wert] Eintragen** und **Streichen · 0**.

### 06 Radierer · „Neues Spiel?“
Text: „Alle Punkte werden ausradiert. Die Namen bleiben stehen, Juli beginnt.“ Buttons **Block leeren** (Primär) / **Weiterspielen**. Unfertiges Spiel wird verworfen und zählt nicht.

### 07 Ergebnis
„Spiel beendet · Datum“, Sieger*in in Handschrift + „GEWINNT“, Punktzahl im handgezeichneten Kreis, Rangliste (Platz, Name, „Oben 66 + Bonus 35 · Unten 167“, Gesamt, Abstand). **Neues Spiel** („Gleiche Namen · Juli beginnt“) und **Block ansehen**. Oben links Statistik, oben rechts × zurück zum Block.

### 08 Statistik (eigene Seite)
Zurück-Pfeil zum Block · Titel `statistik` ·
- **Durchschnitt** je Person (Balken, führende Person in Stiftfarbe), Kopf zeigt „4 Personen“.
- **Letzte Spiele** (antippbar → Ergebnis), Kopf zeigt „5 Spiele“.
- Beide Listen sind **einzeln in sich scrollbar**: `max-height` ≈ 3,4 Zeilen (Durchschnitt 166 px, Spiele 178 px), `overflow-y: auto`, `overscroll-behavior: contain`, dünne Scrollbar in `--line2`, oben/unten Hairline. Die angeschnittene 4. Zeile zeigt, dass man scrollen kann. Container sind fokussierbar (`tabindex="0"`, `role="region"`).
- **Farbstil**: drei Vorschau-Kacheln (jeweils im eigenen Stil gerendert, „25“ + Streich-Linie), gewählte mit Ring; `role="radiogroup"`.
- **Ganz unten:** Button „Spielregeln & Wertung“ (Buch-Icon, Untertitel „Ablauf, Punkte, Bonus und Bedienung“) → öffnet Seite 09.

### 09 Spielregeln & Wertung (eigene Seite, scrollt)
Zurück zur Statistik · Titel `spielregeln` · Sprung-Chips „Ablauf / Wertung / Bonus / In der App“ ·
- **Ablauf eines Zugs:** bis zu dreimal würfeln, Würfel beiseitelegen, ein Feld wählen oder streichen, weitergeben; nach 13 Runden Ende.
- **Wertung:** oberer und unterer Block mit Bedingung, Beispiel und Punkten (Punkte in Handschrift); Hinweis zum Streichen.
- **Bonus:** +35 ab 63, Erklärung des Kurs-Werts.
- **In der App:** Person hinzufügen, Namen, Punkte eintragen, Rückgängig, Korrigieren, Neues Spiel, Gleichstand.

---

## 5. Datenmodell (TypeScript-Referenz)

```ts
type CategoryId = 'u1'|'u2'|'u3'|'u4'|'u5'|'u6'|'k3'|'k4'|'fh'|'ks'|'gs'|'kn'|'ch';
type Theme = 't-wax' | 't-pen' | 't-pencil';

interface Column { name: string; scores: Partial<Record<CategoryId, number>>; }

interface Game {
  id: string;
  columns: Column[];           // 1–5, Reihenfolge = Spielreihenfolge
  startIndex: number;          // wer beginnt
  history: { col: number; cat: CategoryId; prev?: number; at: number }[];
  status: 'running' | 'finished';
  createdAt: number; finishedAt?: number;
}

interface AppState {
  current: Game;               // der Block – existiert immer
  knownNames: string[];        // für die Namen-Chips, zuletzt benutzte zuerst
  archive: Game[];             // abgeschlossene Spiele → Statistik
  theme: Theme;
}
```
Abgeleitet (nie speichern):
```ts
const filled = (g: Game) => g.columns.reduce((n, c) => n + Object.keys(c.scores).length, 0);
const totalTurns = (g: Game) => 13 * g.columns.length;
const activeCol  = (g: Game) => (g.startIndex + filled(g)) % g.columns.length;
const canAddCol  = (g: Game) => filled(g) === 0 && g.columns.length < 5;
```

---

## 6. Spiellogik

### 6.1 Wertung
```ts
function totals(s: Partial<Record<CategoryId, number>>) {
  const upIds = ['u1','u2','u3','u4','u5','u6'] as const;
  const lowIds = ['k3','k4','fh','ks','gs','kn','ch'] as const;
  const up  = upIds.reduce((a, c) => a + (s[c] ?? 0), 0);
  const low = lowIds.reduce((a, c) => a + (s[c] ?? 0), 0);
  const bonus = up >= 63 ? 35 : 0;
  const par = upIds.reduce((a, c, i) => s[c] === undefined ? a : a + s[c]! - 3 * (i + 1), 0); // Bonus-Kurs
  return { up, low, bonus, par, total: up + bonus + low };
}
```
Erlaubte Werte: 1er–6er → `{0..5} × Augenzahl`; Pasch/Chance → `0` oder `5..30`; Festwerte → `0` oder 25 / 30 / 40 / 50.

### 6.2 Aktionen
- `setName(col, name)`: trimmen, nicht leer, nicht in anderer Spalte (case-insensitive); zu `knownNames` hinzufügen.
- `addColumn()` / `removeColumn(col)`: nur wenn `filled == 0`.
- `commit(col, cat, value)`: `prev` merken, schreiben, History pushen, speichern, Leiste zeigen. Wenn `filled == totalTurns`: `status = finished`, ins Archiv, Ergebnis öffnen.
- `undo()`: letzten History-Eintrag zurücksetzen (`prev` wiederherstellen oder Feld löschen). Aktive Spalte ergibt sich automatisch. Funktioniert auch nach Spielende (Status zurück auf `running`, aus Archiv entfernen).
- `erase()`: alle Scores leeren, History leeren, `startIndex = (startIndex + 1) % n`, Namen behalten.
- Ändern eines gefüllten Feldes: gleicher Ablauf wie `commit`, Zug wechselt dabei nicht (Anzahl gefüllter Felder bleibt gleich).

### 6.3 Persistenz
Ganzer `AppState` nach jeder Aktion in localStorage/IndexedDB. Beim Start: `current` laden; existiert keiner, leerer Block mit 2 Spalten und den ersten beiden `knownNames`.

### 6.4 Statistik
Nur `archive` (abgeschlossene Spiele, alle Spalten mit Namen). Pro Name: Spiele, Siege, Ø, Bestwert. Letzte Spiele chronologisch.

### 6.5 Ende & Gleichstand
Rang nach `total`. Gleiche Punkte = gleicher Platz, im Ergebnis „JoJo & Juli gewinnen“.

---

## 7. Bewegung & Barrierefreiheit
- Eintragen: Zahl „schreibt“ sich per `clip-path`-Wipe (220 ms), Streich-Linie per `stroke-dashoffset` (240 ms). Sheets von unten (260 ms). `prefers-reduced-motion` respektieren.
- Echte `<button>`/`<a>`; Zellen mit `aria-label` („JoJo: Dreierpasch eintragen“ / „… 19, ändern“). Sheets `role="dialog" aria-modal="true"`, Fokus-Falle, Wisch/Scrim/× schließt. Leiste `role="status"`.
- Kontraste: Text ≥ 4.5:1; Stiftfarbe nur ≥ 24 px (Buntstift-Orange erreicht 3:1).
- Safe-Area-Insets beachten, keine gemalte Statusleiste.

## 8. Abnahme-Checkliste
- [ ] App startet ohne Menü direkt im Block, mit 2 Spalten und letzten Namen.
- [ ] Namen per Chip wählbar, neuer Name per „+ Neuer Name“ mit Tastatur; „+“ neben dem Radierer fügt Personen hinzu und verschwindet bei 5.
- [ ] Statistik-Icon oben links öffnet eigene Seite; Radiergummi oben rechts leert nach Bestätigung den Block.
- [ ] In der Statistik scrollen Durchschnitt und Letzte Spiele je für sich; unten führt ein Button zu den Spielregeln.
- [ ] Pasch/Chance: eigenes Zahlenfeld, Eintragen nur bei 5–30, Streichen möglich.
- [ ] Rückgängig nach jedem Eintrag; gefüllte Felder änderbar.
- [ ] Bonus, Kurs und Gesamt live korrekt.
- [ ] Drei Farbstile, umschaltbar in der Statistik, gespeichert.
- [ ] Kein Online-Code mehr im Projekt.
