# Kniffel – Projektvorgaben für Claude Code

iPhone-PWA „Kniffel“: digitaler Kniffel-Block für ein Gerät. Gewürfelt wird mit echten Würfeln, die App ersetzt Papier und Stift. Sprache der App und der Kommunikation: **Deutsch**.

Referenzen (nicht ausgeliefert): `handover/kniffel-redesign-spec.md` (Inhalt, Logik), `handover/*.dc.html` (Design-Artboards, `Main.dc.html` = spielbarer Prototyp), `handover/Projekt-Vorlage-PWA-Cloudflare.md` (Technik-Setup).

## Verbindliche Regeln

- Reines HTML/CSS/JavaScript mit ES-Modulen, **kein Build-Schritt**, keine Frameworks, **kein CDN**. Schriften und Icons liegen lokal.
- `index.html` liegt im Hauptordner. **Nur relative Pfade** (HTML, CSS, JS, Manifest `start_url`/`scope` = `./`, Service Worker). Keine Links auf `index.html`, stattdessen `./`.
- **Keine Geheimnisse**, Passwörter oder Schlüssel im Code oder Repo. Repo bleibt privat.
- Kein Online-Modus, kein Startmenü: Die App öffnet direkt im Block.
- Für Punkte gibt es **nie** die iOS-Systemtastatur (eigene Kacheln bzw. eigenes Zahlenfeld). Die Tastatur erscheint nur nach Tap auf „Neuer Name“.

## Aufbau

```
index.html, manifest.webmanifest, sw.js, _headers, wrangler.jsonc, .assetsignore
css/app.css            Tokens der drei Farbstile (t-wax, t-pen, t-pencil), .wax-Textur, Bausteine
fonts/                 Gochi Hand, Caveat, Patrick Hand, Instrument Sans (woff2, latin) + OFL-Lizenzen
icons/                 icon-180.png (iOS), icon-512.png
js/app.js              Zustand, Aktionen, Start, Service-Worker-Registrierung
js/vdom.js             h(), render(), memo()
js/lib/game.js         Datenmodell, Wertung, Aktionen (rein, mit node --test geprüft)
js/lib/format.js       Datum, Kurs, Namenslisten
js/ui/                 view.js (Seitenwahl), block.js, sheets.js, result.js, stats.js, rules.js, icons.js
js/data/               index.js (createStore), idb-adapter.js, memory-adapter.js (#demo), backup.js
tests/                 node --test tests/
```

## Design

- Ein Blatt Papier, ein Stift. **Die Stiftfarbe (`--pen`, Klasse `.wax`/`.hs`) ist reserviert** für Titel, Namen, eingetragene Zahlen, Streich-Linien, Unterstreichungen und Kreise; nie für Buttons, Flächen oder Fließtext.
- Keine Deko: keine Schatten außer Hairlines, keine Verläufe auf Flächen, keine Emojis. Kein `text-shadow` auf `.wax` (übermalt die Textur), stattdessen `filter: drop-shadow()`.
- Jeder Eintrag in 2–4 Taps, keine Validierungsfehler bei Punkten möglich.
- Touch-Ziele ≥ 44 px, Text-Kontrast ≥ 4.5:1, Stiftfarbe nur ≥ 24 px.
- Maße und Texte aus den Artboards übernehmen; Abweichungen nur bewusst.

## Daten

- Die Oberfläche greift nur über `js/data/index.js` (`createStore()`) auf Daten zu. Adapter: IndexedDB (Standard), Speicher (`#demo`, speichert nichts), später z. B. Supabase (nie Service-Role-Schlüssel ins Repo).
- Der ganze AppState (`current`, `knownNames`, `archive`, `theme`) liegt in IndexedDB „kniffel“, Store „state“, Schlüssel „app“. **Namen von Datenbank und Store nie ändern.** Datenmodell nur erweitern (neue Felder optional mit Standardwert, `normalizeState` anpassen); bei Strukturänderung `STATE_VERSION` erhöhen und verlustfrei migrieren, nie Daten verwerfen.
- Der Farbstil wird zusätzlich in `localStorage` gespiegelt, nur damit beim Start nichts flackert.
- Backup: eine JSON-Datei `kniffel-backup-JJJJ-MM-TT.json` (`{ app, format, exportedAt, data }`), über das iOS-Teilen-Sheet, sonst Download. Import muss alte Formate dauerhaft lesen.
- **Vor jeder Änderung an Speichern/Laden/Backup erst beschreiben, was sich ändert, und auf OK warten.**

## iPhone

- `html, body` mit `overflow:hidden`; nur innere Bereiche scrollen.
- Safe-Area-Insets beachten, keine gemalte Statusleiste, kein `backdrop-filter` auf Abdunklungen.
- Ansichten sollen ohne Scrollen auf ein iPhone passen (nutzbar ca. 393×759); der Block passt seine Zeilenhöhe an (32–44 px).
- Funktionen wie Teilen-Sheet immer per Feature-Erkennung nutzen.

## Arbeitsweise

1. Nur die betroffenen Stellen ändern, Design und Datenlogik nicht nebenbei umbauen.
2. **Bei jeder Änderung an ausgelieferten Dateien `CACHE_VERSION` in `sw.js` erhöhen**; neue Dateien in `ASSETS` eintragen.
3. Lokal testen: `python3 -m http.server 8000`, dann `http://localhost:8000/#demo` (Demo-Daten), `?nosw` schaltet den Service Worker ab. Auch unter einem Unterpfad testen. `node --test tests/` muss grün sein, keine Konsolenfehler.
4. Auf Feature-Branch arbeiten, per Pull Request nach `main`; Cloudflare deployt `main`.
5. Dem Nutzer sagen, was er auf dem iPhone prüfen soll.
