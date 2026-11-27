/* Hors ligne. Change VERSION après toute modification d'un fichier. */
const VERSION = 'forge-muscu-v34';
const FICHIERS = [
  "./","index.html","manifest.webmanifest","css/styles.css","css/liftoff.css","css/coach.css","css/navigation.css","css/premium.css","css/start-ranks.css","css/body-forge-avatar-3d.css","css/progress-photos.css","css/progression-hub.css","css/recovery.css","css/bar-calculator.css","css/nutrition-favorites.css","css/workout-structures.css",
  "js/data.js","js/program.js","js/progression.js","js/store.js","js/timer.js","js/ui.js","js/charts.js",
  "js/view-home.js","js/view-program.js","js/view-exercises.js","js/view-session.js","js/view-track.js",
  "js/view-cardio.js","js/view-profile.js","js/view-forge.js","js/view-liftoff.js","js/view-advanced.js",
  "js/view-pro.js","js/coach.js","js/view-seance.js","js/body-forge-ranks.js","js/body-forge-avatar-3d.js","js/progress-photos.js","js/progression-hub.js","js/recovery.js","js/bar-calculator.js","js/nutrition-favorites.js","js/session-enhancements.js","js/workout-structures.js","js/cloud-sync.js","js/coach-3d.js","js/app.js",
  "images/exercises/bench-press/start.webp","images/exercises/bench-press/end.webp",
  "images/exercises/incline-bench-press/start.webp","images/exercises/incline-bench-press/end.webp",
  "images/exercises/squat/start.webp","images/exercises/squat/end.webp",
  "images/exercises/leg-press/start.webp","images/exercises/leg-press/end.webp",
  "images/exercises/cable-fly-high-to-low/start.webp","images/exercises/cable-fly-high-to-low/end.webp",
  "images/exercises/dumbbell-romanian-deadlift/start.webp","images/exercises/dumbbell-romanian-deadlift/end.webp",
  "images/exercises/deadlift/start.webp","images/exercises/deadlift/end.webp",
  "images/exercises/lat-pulldown/start.webp","images/exercises/lat-pulldown/end.webp",
  "images/exercises/seated-cable-row/start.webp","images/exercises/seated-cable-row/end.webp",
  "images/exercises/dumbbell-row/start.webp","images/exercises/dumbbell-row/end.webp",
  "images/exercises/pull-up/start.webp","images/exercises/pull-up/end.webp",
  "images/exercises/lateral-raises/start.webp","images/exercises/lateral-raises/end.webp",
  "images/exercises/barbell-curl/start.webp","images/exercises/barbell-curl/end.webp",
  "images/exercises/cable-crunch/start.webp","images/exercises/cable-crunch/end.webp",
  "images/exercises/crunches/start.webp","images/exercises/crunches/end.webp",
  "images/exercises/push-up/start.webp","images/exercises/push-up/end.webp",
  "images/exercises/cable-curl/start.webp","images/exercises/cable-curl/end.webp",
  "images/exercises/dumbbell-shoulder-press/start.webp","images/exercises/dumbbell-shoulder-press/end.webp",
  "images/exercises/face-pulls/start.webp","images/exercises/face-pulls/end.webp",
  "images/exercises/leg-curl/start.webp","images/exercises/leg-curl/end.webp",
  "images/exercises/leg-extension/start.webp","images/exercises/leg-extension/end.webp",
  "images/exercises/calf-raises/start.webp","images/exercises/calf-raises/end.webp",
  "images/exercises/hammer-curls/start.webp","images/exercises/hammer-curls/end.webp",
  "images/exercises/overhead-press/start.webp","images/exercises/overhead-press/end.webp",
  "images/exercises/plank/hold.webp","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png"
];

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
    try { const response = await fetch(e.request); if (response && response.ok) c.put(e.request, response.clone()).catch(() => {}); return response; } catch (err) {
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
