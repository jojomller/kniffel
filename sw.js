// Bei JEDER Änderung an App-Dateien CACHE_VERSION erhöhen, sonst sehen installierte Apps
// die neue Version nicht. Neue Dateien in ASSETS eintragen. Alle Pfade relativ.
const CACHE_VERSION = 'app-kniffel-v1';

const ASSETS = [
  './',
  'manifest.webmanifest',
  'css/app.css',
  'icons/icon-180.png',
  'icons/icon-512.png',
  'fonts/Caveat.woff2',
  'fonts/GochiHand.woff2',
  'fonts/InstrumentSans.woff2',
  'fonts/PatrickHand.woff2',
  'js/app.js',
  'js/vdom.js',
  'js/lib/game.js',
  'js/lib/format.js',
  'js/data/index.js',
  'js/data/idb-adapter.js',
  'js/data/memory-adapter.js',
  'js/data/backup.js',
  'js/ui/view.js',
  'js/ui/icons.js',
  'js/ui/block.js',
  'js/ui/sheets.js',
  'js/ui/result.js',
  'js/ui/stats.js',
  'js/ui/rules.js'
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
