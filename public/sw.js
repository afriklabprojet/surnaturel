const CACHE_NAME = "surnaturel-v1"
const OFFLINE_URL = "/"

const PRECACHE_URLS = [
  "/",
  "/soins",
  "/boutique",
  "/contact",
  "/a-propos",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((r) => r || caches.match("/"))
    )
  )
})

// ─── Push Notifications ──────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = {
      title: "Le Surnaturel de Dieu",
      body: event.data.text(),
    }
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/logos/logo-192.png",
    badge: data.badge || "/logos/badge-72.png",
    tag: data.tag || "default",
    data: {
      url: data.url || "/",
      ...data.data,
    },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", options)
  )
})

// ─── Notification Click ──────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, focus dessus
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
