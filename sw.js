// ===== LIMAVI FISIOTERAPIA — Service Worker =====
const CACHE = 'limavi-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Instala e faz cache de todos os assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        // Se algum asset falhar (ex: fonte offline), continua mesmo assim
        console.warn('Cache parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Intercepta requisições — Cache First para assets, Network First para o resto
self.addEventListener('fetch', e => {
  // Ignora requisições não-GET e chrome-extension
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension://')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Só faz cache de respostas válidas
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback: retorna index.html para navegação
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
