# Kniffel

Kniffel-Block als iPhone-PWA für ein Gerät: Punkte eintragen statt auf Papier schreiben, mit Rückgängig, Bonus-Kurs, Ergebnis, Statistik und drei Stiftfarben (Wachs, Kuli, Buntstift). Reines HTML/CSS/JavaScript ohne Build-Schritt, offline-fähig, Daten bleiben auf dem Gerät (IndexedDB, Backup als JSON).

## Lokal starten

```bash
python3 -m http.server 8000
```

- `http://localhost:8000/` – echte Daten (IndexedDB)
- `http://localhost:8000/#demo` – Demo-Daten, nichts wird gespeichert
- `?nosw` an der Adresse schaltet den Service Worker beim Entwickeln ab

Tests der Spiellogik: `node --test tests/`

## Hosting

Cloudflare Workers Builds, Projektname `kniffel` (siehe `wrangler.jsonc`), Build-Befehl leer, Deploy-Befehl `npx wrangler deploy`. Jeder Push auf `main` wird ausgeliefert.

## Auf dem iPhone

Adresse in Safari öffnen → Teilen → „Zum Home-Bildschirm“. Nach dem ersten Start läuft die App offline.

Projektregeln: siehe `CLAUDE.md`.
