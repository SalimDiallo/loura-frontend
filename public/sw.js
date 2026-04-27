/* LouraTech — service worker minimal pour permettre l'installation PWA
 * Stratégie : network-first avec fallback cache pour les requêtes GET
 * same-origin. Aucune logique métier ; uniquement un offline gracieux.
 */

const CACHE = "louratech-v1";
const PRECACHE = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {
        // Pas critique : continuer même si le précache échoue.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Same-origin uniquement : on ne touche pas aux appels API tiers.
  if (url.origin !== self.location.origin) return;

  // Ne pas intercepter les routes Next dynamiques sensibles
  // (HMR dev, RSC payload, server actions).
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/_next/data") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Met en cache uniquement les réponses OK basiques.
        if (
          response &&
          response.ok &&
          (response.type === "basic" || response.type === "default")
        ) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match("/"))
          .then((res) => res || Response.error())
      )
  );
});
