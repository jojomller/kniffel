# Vorlage: iPhone-PWA mit GitHub + Cloudflare (Setup von „Pull & Pour“)

Diese Anleitung beschreibt Technik, Dateiaufbau und Hosting über Cloudflare, so dass du ein neues, ähnliches Projekt mit demselben Setup starten kannst. Sprache der App und der Kommunikation: Deutsch.

---

## 1. Grundidee

- **iPhone-App als PWA**: eine Webseite, die über Safari → Teilen → „Zum Home-Bildschirm“ wie eine App installiert wird.
- **Reines HTML/CSS/JavaScript**, ES-Module, **kein Build-Schritt**, keine Frameworks oder Bibliotheken, die einen Build brauchen.
- **Offline-fähig** über einen Service Worker. Keine Abhängigkeiten von CDNs (Schriften und Icons liegen lokal im Repo).
- **Daten lokal auf dem Gerät** (IndexedDB), Backup als JSON-Datei. Später austauschbar gegen z. B. Supabase.
- **Hosting**: privates GitHub-Repo → Cloudflare (Workers Builds) liefert die Dateien direkt aus, ohne Build-Befehl.
- **Zielgerät**: iPhone (Safari/WebKit). Funktionen wie Wake Lock, Teilen-Sheet usw. immer per Feature-Erkennung nutzen.

## 2. Verbindliche Regeln

- `index.html` liegt im **Hauptordner**.
- **Nur relative Pfade** – in HTML, CSS, JS, Manifest (`start_url`/`scope` = `./`) und Service Worker. Die App muss unter jedem Pfad und auf jedem statischen Hosting laufen.
- **Keine Links auf `index.html`** (Cloudflare leitet `/index.html` auf `/` um), stattdessen `./`.
- **Keine Geheimnisse, Passwörter oder Schlüssel** im Code oder im Repo.
- Repo bleibt **privat**.
- Fotos per `<input type="file" accept="image/*">` (mit `capture="environment"` für die Kamera), vor dem Speichern verkleinern (JPEG) und als Blob ablegen.

## 3. Ordnerstruktur

```
index.html              App-Shell (Meta-Tags für iOS), lädt css/app.css und js/app.js
manifest.webmanifest    PWA-Manifest
sw.js                   Service Worker (Precache, offline)
_headers                Cloudflare-Header
wrangler.jsonc          Cloudflare: statische Auslieferung des Hauptordners
.assetsignore           Dateien, die nicht ausgeliefert werden
.gitignore              z. B. .DS_Store, node_modules/, Backup-Dateien
.gitattributes          * text=auto
CLAUDE.md               Projektvorgaben für Claude Code
README.md               Kurzbeschreibung
css/app.css             Design-Tokens, @font-face, Animationen
fonts/                  Schriften lokal (variable WOFF2/TTF) + Lizenzdateien (OFL)
icons/                  App-Icons (icon-180.png für iOS, icon-512.png)
js/app.js               Zustand, Aktionen, Start, Service-Worker-Registrierung
js/vdom.js              kleiner DOM-Abgleich: h(), render(), memo()
js/ui/                  Oberfläche (view.js, cards.js, vals.js)
js/lib/                 Konstanten, Formatierung, Logik, Bilder, Fotos
js/data/                Datenschicht (index.js, idb-adapter.js, memory-adapter.js, backup.js)
handover/               (optional) Original-Design als Referenz, wird nicht ausgeliefert
```

Ansichten werden als `h('div', props, ...kinder)` beschrieben und bei jeder Zustandsänderung neu berechnet; `render()` ändert nur, was sich unterscheidet.

## 4. Wichtige Dateien (Inhalte zum Kopieren)

### 4.1 `index.html` (Kopf)

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>APP-NAME</title>
<meta name="description" content="APP-NAME – Kurzbeschreibung">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F3EDE4">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="APP-NAME">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" type="image/png" href="icons/icon-512.png">
<link rel="stylesheet" href="css/app.css">
<script type="module" src="js/app.js"></script>
</head>
<body>
<div id="app"></div>
<noscript><p>APP-NAME braucht JavaScript.</p></noscript>
</body>
</html>
```

### 4.2 `manifest.webmanifest`

```json
{
  "name": "APP-NAME",
  "short_name": "APP-NAME",
  "description": "Kurzbeschreibung",
  "lang": "de",
  "id": "./",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F3EDE4",
  "theme_color": "#F3EDE4",
  "icons": [
    { "src": "icons/icon-180.png", "sizes": "180x180", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

### 4.3 `sw.js` (Service Worker)

```js
// Bei JEDER Änderung an App-Dateien CACHE_VERSION erhöhen, sonst sehen installierte Apps
// die neue Version nicht. Neue Dateien in ASSETS eintragen. Alle Pfade relativ.
const CACHE_VERSION = 'app-v1';

const ASSETS = [
  './',
  'manifest.webmanifest',
  'css/app.css',
  'icons/icon-180.png',
  'icons/icon-512.png',
  'js/app.js',
  // ... alle weiteren Dateien (JS-Module, Schriften)
];

const scoped = p => new URL(p, self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION)
    .then(c => c.addAll(ASSETS.map(p => new Request(scoped(p), { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('app-') && k !== CACHE_VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: immer die zwischengespeicherte App-Shell („./“), Netz nur als Ersatz
  const root = new URL(self.registration.scope).pathname;
  if (req.mode === 'navigate' && (url.pathname === root || url.pathname === root + 'index.html')) {
    e.respondWith(caches.match(scoped('./'), { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
```

Registrierung in `js/app.js` (mit `?nosw` zum Abschalten beim Entwickeln):

```js
if ('serviceWorker' in navigator && !/[?&]nosw/.test(location.search)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('Service Worker:', e));
  });
}
```

### 4.4 `wrangler.jsonc` (Cloudflare)

```jsonc
{
  // Cloudflare (Workers Builds): liefert den Hauptordner als statische Dateien aus, ohne Build.
  // Der Name muss dem Projektnamen in Cloudflare entsprechen.
  "name": "MEIN-PROJEKT",
  "compatibility_date": "2026-10-01",
  "assets": {
    "directory": "./"
  }
}
```

### 4.5 `.assetsignore`

Alles, was hier steht, wird **nicht** öffentlich ausgeliefert. Ausgeliefert wird alles andere.

```
# Diese Dateien werden bei Cloudflare nicht mit ausgeliefert
wrangler.jsonc
.assetsignore
.gitignore
.gitattributes
.git
node_modules
handover
CLAUDE.md
README.md
```

Neue App-Dateien brauchen keinen Eintrag. Dateien, die nicht öffentlich sein sollen, gehören hier hinein.

### 4.6 `_headers`

```
/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin

/sw.js
  Cache-Control: no-cache

/
  Cache-Control: no-cache

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: no-cache
```

Wichtig: Der Service Worker, die Startseite und das Manifest dürfen nicht lange gecacht werden, sonst kommen Updates nicht an.

### 4.7 `.gitignore` und `.gitattributes`

```
# .gitignore
.DS_Store
node_modules/
*.backup.json
```

```
# .gitattributes
* text=auto
```

## 5. Datenschicht (Wechsel zu Supabase später möglich)

- Die Oberfläche greift **nur** über `js/data/index.js` (`createStore()`) auf Daten zu.
- Schnittstelle jedes Adapters (alle Methoden asynchron): `load`, `putBean`/`deleteBean` (hier je nach Projekt: eigene Datentypen), `putShot`/`deleteShot`, `putSettings`, `putPhoto`, `getPhoto`, `deletePhoto`, `listPhotoIds`, `replaceAll`, dazu ein Platzhalter `auth`.
- Adapter:
  - `idb-adapter.js` (IndexedDB, Standard)
  - `memory-adapter.js` (Demo-Modus `#demo`, speichert nichts)
  - später z. B. `supabase-adapter.js` (Login über Supabase Auth, Fotos in Supabase Storage). URL und Anon-Key über eine Konfiguration, **nie** geheime Schlüssel (Service-Role) ins Repo.
- Änderungen am Zustand werden automatisch erkannt (`persistDiff`) und einzeln gespeichert.
- `navigator.storage.persist()` beim Start anfragen, damit iOS die Daten nicht löscht.
- **Namen der Datenbank und Stores nie ändern.** Datenmodell nur erweitern (neue Felder optional mit Standardwert); bei Strukturänderung Version erhöhen und verlustfreie Migration schreiben, nie Daten verwerfen.

## 6. Backup

- Export als **eine JSON-Datei** `projektname-backup-JJJJ-MM-TT.json` mit Daten und Fotos (als Data-URL), über das iOS-Teilen-Sheet, sonst Download.
- Import muss alte Formate dauerhaft weiter lesen können.
- Vor jeder Änderung an Speichern/Laden/Backup erst beschreiben, was sich ändert, und auf OK warten.

## 7. iPhone-spezifische Hinweise

- `html, body` fest mit `overflow:hidden`; nur innere Listen scrollen, sonst verwischt iOS den Bereich unter der Statusleiste.
- Vollbild-Fenster beginnen bei `top:0` mit `padding-top: env(safe-area-inset-top)`; kein `backdrop-filter` auf Abdunklungen.
- Touch-Ziele mindestens 44–48 pt, Hauptaktionen 62–76 pt, einhändig bedienbar.
- Zahlen tabellarisch, Dezimalkomma.
- Ansichten sollen ohne Scrollen auf ein iPhone passen (nutzbar ca. 393×759).

## 8. Lokal entwickeln und testen

```bash
python3 -m http.server 8000
```

Dann im Browser: `http://localhost:8000/#demo` (Demo-Daten, nichts wird gespeichert). `?nosw` an der Adresse schaltet den Service Worker beim Entwickeln ab. Auch unter einem Unterpfad testen, damit die relativen Pfade stimmen.

## 9. Neues Projekt starten (Schritt für Schritt)

### 9.1 GitHub

1. Auf github.com ein neues Repo anlegen, **Private**, leer (ohne README).
2. Lokal oder in Claude Code (Web) das Repo klonen:
   ```bash
   git clone https://github.com/DEIN-NAME/MEIN-PROJEKT.git
   cd MEIN-PROJEKT
   ```
3. Dateien aus Abschnitt 3 und 4 anlegen (oder aus dem alten Projekt kopieren und Namen anpassen), `CLAUDE.md` mit den Regeln aus diesem Dokument hinzufügen.
4. Erster Commit:
   ```bash
   git add .
   git commit -m "Erster Stand"
   git branch -M main
   git push -u origin main
   ```
   Bei Claude Code im Web: Repository beim Start der Sitzung auswählen. Die Claude-GitHub-App muss für das Repo installiert sein (https://github.com/apps/claude/installations/select_target).

### 9.2 Cloudflare

1. In Cloudflare: **Workers & Pages → Create → Import a repository (Workers Builds)**.
2. GitHub verbinden und das Repo auswählen (bei privaten Repos der Cloudflare-App Zugriff geben).
3. **Projektname** = `name` in `wrangler.jsonc`. Stimmen beide nicht überein, schlägt der Build fehl.
4. **Build-Befehl: leer lassen** (kein Build). **Deploy-Befehl:** `npx wrangler deploy`.
5. Speichern und deployen. Cloudflare gibt eine Adresse wie `https://MEIN-PROJEKT.DEIN-KONTO.workers.dev`.
6. Ab jetzt wird bei jedem Push auf `main` automatisch neu ausgeliefert.
7. Optional: Eigene Domain unter Settings → Domains & Routes.

**Achtung – Adresse nicht mehr wechseln:** Die Daten (IndexedDB) gehören zur Adresse (Origin). Nach dem ersten echten Einsatz die Domain nicht mehr ändern, sonst ist die App leer. Ein Umzug geht nur über Backup → Restore.

### 9.3 Auf dem iPhone installieren

1. Adresse in **Safari** öffnen.
2. Teilen → „Zum Home-Bildschirm“.
3. App vom Home-Bildschirm starten. Nach dem ersten Start funktioniert sie offline.

## 10. Arbeitsweise (für Claude Code)

1. Nur die betroffenen Stellen ändern, Design und Datenlogik nicht nebenbei umbauen.
2. **Bei jeder Änderung an ausgelieferten Dateien `CACHE_VERSION` in `sw.js` erhöhen**; neue Dateien in `ASSETS` eintragen. Sonst bleibt die alte Version auf dem iPhone.
3. Lokal testen (Abschnitt 8), keine Konsolenfehler, dann committen.
4. Auf Feature-Branch arbeiten und per Pull Request oder direkt nach `main` mergen; Cloudflare deployt `main`.
5. Dem Nutzer sagen, was er auf dem iPhone prüfen soll.

## 11. Prompt zum Start eines neuen Projekts

Diesen Text kannst du in einer neuen Claude-Code-Sitzung (mit dem leeren Repo) einfügen:

> Baue eine iPhone-PWA „NAME“ (Kurzbeschreibung: …) als reines HTML/CSS/JavaScript mit ES-Modulen, ohne Build-Schritt, ohne Frameworks und ohne CDN. Halte dich an die beigefügte Datei „Projekt-Vorlage-PWA-Cloudflare.md“: Ordnerstruktur, relative Pfade, `manifest.webmanifest`, Service Worker `sw.js` mit `CACHE_VERSION`, `_headers`, `wrangler.jsonc` (Name = „MEIN-PROJEKT“), `.assetsignore`, Datenschicht mit IndexedDB-Adapter und Demo-Adapter, Backup als JSON. Lege zuerst eine `CLAUDE.md` mit diesen Regeln an. Sprache der App: Deutsch. Danach das Grundgerüst committen und auf `main` pushen.

## 12. Checkliste

- [ ] Repo privat, keine Geheimnisse
- [ ] `index.html` im Hauptordner, nur relative Pfade
- [ ] `manifest.webmanifest` mit `start_url`/`scope` = `./`
- [ ] `sw.js` mit allen Dateien in `ASSETS`, `CACHE_VERSION` erhöht
- [ ] `wrangler.jsonc`: `name` = Projektname in Cloudflare, `assets.directory` = `./`
- [ ] `.assetsignore` enthält `CLAUDE.md`, `README.md`, `wrangler.jsonc`, `handover`, …
- [ ] Cloudflare: Build-Befehl leer, Deploy-Befehl `npx wrangler deploy`
- [ ] iPhone: Safari → Teilen → „Zum Home-Bildschirm“, danach Offline-Test
