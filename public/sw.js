/* Ferngänse Service Worker — PWA install + offline read cache.
 *
 * v1: no push. Caches the app shell and cached photos (tp-photos) cache-first
 * so trips viewed online remain viewable offline (read-only).
 */

const SW_VERSION = "tp-v1";
const RUNTIME_CACHE = "tp-runtime-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== RUNTIME_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Cache-first for cached trip photos (Supabase Storage tp-photos bucket).
  const isPhoto = url.pathname.includes("/tp-photos/");
  if (isPhoto) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit ?? Response.error();
        }
      }),
    );
    return;
  }

  // Network-first for navigations, falling back to cache when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          const cache = await caches.open(RUNTIME_CACHE);
          const hit = await cache.match(req);
          return hit ?? (await cache.match("/trips")) ?? Response.error();
        }
      })(),
    );
  }
});
