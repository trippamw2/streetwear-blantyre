/* Lake Fresh offline shell.
   Only public brand assets are cached. Order, account, support, payment and
   admin responses are never stored on the device. */

const CACHE = "lake-fresh-shell-v1";
const SHELL = [
  "/",
  "/brand/lake-fresh/icon-192.png",
  "/brand/lake-fresh/icon-512.png",
  "/brand/lake-fresh/logo.png",
  "/brand/lake-fresh/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const isPrivateRequest = (url) => {
  const path = url.pathname.toLowerCase();
  if (path.startsWith("/api/") || path.startsWith("/lf/api/")) return true;
  if (/(^|\/)(admin|auth|orders?|track|support|driver|checkout|cart|account)(\/|$)/.test(path)) return true;
  const query = url.search.toLowerCase();
  return ["token", "access", "payment", "ref", "order", "ticket"].some((word) => query.includes(word));
};

const isCacheableAsset = (url) => {
  const path = url.pathname.toLowerCase();
  return (
    path.startsWith("/assets/") ||
    path.startsWith("/brand/") ||
    /\.(png|jpe?g|webp|gif|svg|woff2?|css|js|pdf)$/.test(path)
  );
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivateRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match("/")) || Response.error();
      }),
    );
    return;
  }

  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
