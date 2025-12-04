/*const CACHE_NAME = `game-v1`;

const ASSETS = [
  '/',
  '/index.html',
  './assets/spacecub.obj',
  './config/gameConstant.js',
  './physics.RigidBody.js',
  './physics.worldInit.js',
  './systems.InputManager.js',
  './boot.js',
  './main.js',
  './mobileControls.js',
  '/style.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS)
  ));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );

  // Take control of open tabs immediately
  return self.clients.claim();
});

*/