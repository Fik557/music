const CACHE_NAME = "anime-opening-quiz-v20";
const STATIC_ASSETS = [
  "/",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/anime-quiz-hero.jpg",
  "/assets/anime-quiz-icon.jpg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS).catch(function () {
        return undefined;
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE_NAME;
      }).map(function (key) {
        return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/music/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(function () {
      return caches.match("/");
    }));
    return;
  }

  if (url.pathname === "/app.js" || url.pathname === "/styles.css" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(fetch(request).then(function (response) {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    }).catch(function () {
      return caches.match(request);
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (!response || !response.ok) return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, copy);
      });
      return response;
    });
  }));
});

