// オフラインでも開けるようにファイルを端末に保存しておく
const CACHE = 'hwcheck-ab36be8689';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hwcheck-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// ページ本体はネット優先（つながらなければ3秒で保存済みのものを表示）、それ以外は保存済み優先
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => caches.match('./index.html').then(r => { if (!done && r) { done = true; resolve(r); } });
      const timer = setTimeout(fallback, 3000);
      fetch(req).then(r => {
        clearTimeout(timer);
        if (r.ok) caches.open(CACHE).then(c => c.put('./index.html', r.clone()));
        if (!done) { done = true; resolve(r); }
      }).catch(() => { clearTimeout(timer); fallback(); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
