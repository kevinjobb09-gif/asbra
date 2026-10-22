// Service worker: gör att sajten kan installeras som app och visar en
// offline-sida när internet saknas. Den sparar medvetet inget annat, så att
// användarna alltid får de senaste (granskade) frågorna.
const CACHE = "offline-v2";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      // Hämtar sidan samtidigt som service workern startar (snabbare på mobilen).
      .then(() => self.registration.navigationPreload?.enable())
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      try {
        return (await event.preloadResponse) || (await fetch(event.request));
      } catch {
        return caches.match(OFFLINE_URL);
      }
    })(),
  );
});
