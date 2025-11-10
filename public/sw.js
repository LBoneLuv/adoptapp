const CACHE_NAME = "adoptapp-v1"
const RUNTIME_CACHE = "adoptapp-runtime"

// Assets to cache on install
const PRECACHE_URLS = ["/", "/protectoras", "/avisos", "/comunidad", "/offline.html"]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            return caches.delete(cacheName)
          }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip chrome extensions
  if (event.request.url.startsWith("chrome-extension://")) {
    return
  }

  // API requests - network only
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request))
    return
  }

  // Supabase requests - network only
  if (event.request.url.includes("supabase")) {
    event.respondWith(fetch(event.request))
    return
  }

  // Images and static assets - cache first
  if (
    event.request.destination === "image" ||
    event.request.destination === "font" ||
    event.request.destination === "style" ||
    event.request.destination === "script"
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
      }),
    )
    return
  }

  // HTML pages - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match("/offline.html")
        })
      }),
  )
})

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || "Adoptapp"
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    tag: data.tag || "adoptapp-notification",
    data: data.url || "/",
    requireInteraction: false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data || "/"))
})
