const CACHE_VERSION = "v4";
const STATIC_CACHE = `feastly-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `feastly-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.png",
];

// ── Install ───────────────────────────────────────────────────────────────────
// Cache assets individually so one failure does NOT abort the entire install.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            // Silently skip assets that fail to cache (e.g. during first install
            // race conditions). The runtime cache fills them on next normal visit.
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const allowed = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !allowed.includes(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // API: network-only; return a clean JSON error when offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({ error: "You are offline. Please reconnect." }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          )
      )
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate with offline fallback
  if (url.origin === location.origin) {
    event.respondWith(handleSameOrigin(request));
    return;
  }

  // Cross-origin (Google Fonts, CDN images, etc.): network with cache backup.
  // Always resolve so the SW never throws on font failures.
  event.respondWith(handleCrossOrigin(request));
});

// ── Same-origin strategy ──────────────────────────────────────────────────────
async function handleSameOrigin(request) {
  try {
    const runtimeCache = await caches.open(RUNTIME_CACHE);

    // Kick off a network refresh in the background
    const networkPromise = fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          runtimeCache.put(request, res.clone());
        }
        return res;
      })
      .catch(() => null);

    // Serve from cache immediately if available
    const cached =
      (await runtimeCache.match(request)) ||
      (await caches.match(request, { cacheName: STATIC_CACHE }));

    if (cached) {
      networkPromise; // background revalidation continues
      return cached;
    }

    // Nothing cached — wait for network
    const networkRes = await networkPromise;
    if (networkRes) return networkRes;

    // Network failed and nothing cached — serve offline fallback
    return offlineFallback(request);
  } catch {
    return offlineFallback(request);
  }
}

// ── Cross-origin strategy ─────────────────────────────────────────────────────
async function handleCrossOrigin(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const networkRes = await fetch(request);
    if (networkRes && networkRes.status === 200) {
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    // Return cached version if available, otherwise an empty transparent response
    // so the browser does not log a network error for non-critical assets.
    const cached = await caches.match(request);
    if (cached) return cached;

    // For fonts/stylesheets return an empty but valid response
    const ct = request.headers.get("Accept") || "";
    if (ct.includes("text/css") || request.destination === "font") {
      return new Response("", {
        status: 200,
        headers: { "Content-Type": "text/css" },
      });
    }
    return new Response("", { status: 200 });
  }
}

// ── Offline fallback helper ───────────────────────────────────────────────────
async function offlineFallback(request) {
  // For navigation requests serve the offline page
  if (request.mode === "navigate") {
    const offlinePage =
      (await caches.match(OFFLINE_URL)) ||
      (await caches.match(OFFLINE_URL, { cacheName: STATIC_CACHE }));
    if (offlinePage) return offlinePage;
    // Last resort: inline response
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8">
       <title>Offline – Feastly</title></head><body style="font-family:sans-serif;text-align:center;padding:3rem">
       <h1>You're offline</h1><p>Please check your connection and try again.</p>
       <button onclick="location.reload()">Retry</button></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
  // For sub-resources return a neutral empty response
  return new Response("", { status: 200 });
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Feastly", body: "Check out tonight's recipe pick!" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
    })
  );
});

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.postMessage({ type: "NAVIGATE", url: targetUrl });
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-cookbook") event.waitUntil(syncCookbook());
  if (event.tag === "sync-shopping-list") event.waitUntil(syncShoppingList());
});

async function syncCookbook() {}
async function syncShoppingList() {}

// ── Message Handling ──────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
