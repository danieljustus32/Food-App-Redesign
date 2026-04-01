const CACHE_VERSION = "v2";
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

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const allowedCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !allowedCaches.includes(k))
            .map((k) => caches.delete(k))
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

  // Let API calls go straight to the network; fall through on failure
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: "You are offline. Please reconnect." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // For same-origin requests use stale-while-revalidate
  if (url.origin === location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cross-origin requests (CDN fonts, images, etc.) – network first, cache fallback
  event.respondWith(networkFirstWithCache(request));
});

// Stale-while-revalidate: serve from cache immediately, refresh in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) {
    // Kick off background revalidation but return cached immediately
    fetchPromise; // intentionally not awaited
    return cachedResponse;
  }

  // Nothing cached – wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  // Network failed and nothing cached – serve offline page for navigation requests
  if (request.mode === "navigate") {
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
  }

  return new Response("Offline", { status: 503 });
}

// Network first, fall back to cache
async function networkFirstWithCache(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
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
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-cookbook") {
    event.waitUntil(syncCookbook());
  }
  if (event.tag === "sync-shopping-list") {
    event.waitUntil(syncShoppingList());
  }
});

async function syncCookbook() {
  // Placeholder: implement retry logic for pending cookbook mutations
  // stored in IndexedDB when the user was offline
}

async function syncShoppingList() {
  // Placeholder: implement retry logic for pending shopping-list mutations
}

// ── Message Handling ──────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
