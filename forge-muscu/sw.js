/* Hors ligne. Change VERSION après toute modification d'un fichier. */
const VERSION = 'forge-muscu-v13';
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'css/liftoff.css', 'css/coach.css', 'css/navigation.css', 'data/exercise-media.json',
  ...['data', 'program', 'progression', 'store', 'timer', 'ui', 'charts', 'view-home', 'view-program', 'view-exercises', 'view-session', 'view-track', 'view-cardio', 'view-profile', 'view-forge', 'view-liftoff', 'view-advanced', 'view-pro', 'coach', 'coach-3d', 'app'].map(f => `js/${f}.js`),
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS.map(f => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n.startsWith('forge-muscu-') && n !== VERSION).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'activer') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const cache = await c.match(e.request, { ignoreSearch: true });
    if (cache) return cache;
    try { return await fetch(e.request); } catch (err) {
      if (e.request.mode === 'navigate') return c.match('index.html');
      throw err;
    }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    const c = l.find(x => x.url.startsWith(self.registration.scope));
    return c ? c.focus() : self.clients.openWindow('./index.html#/seance');
  }));
});
