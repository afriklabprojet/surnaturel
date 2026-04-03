// ─── Service Worker — Le Surnaturel de Dieu ──────────────────────────────────
// Stratégies :
//   - Pages publiques : Network First avec fallback cache
//   - Assets statiques (/_next/static/) : Cache First (immutable)
//   - API messagerie : Stale-While-Revalidate
//   - Messages offline : IndexedDB queue avec retry au retour réseau

const CACHE_STATIC = "surnaturel-static-v2"   // assets Next.js (hachés — changent à chaque build)
const CACHE_PAGES  = "surnaturel-pages-v2"     // pages HTML
const CACHE_API    = "surnaturel-api-v2"        // réponses API (SWR)
const DB_NAME      = "surnaturel-offline"
const DB_VERSION   = 1

const PRECACHE_URLS = [
  "/",
  "/soins",
  "/boutique",
  "/contact",
  "/a-propos",
  "/communaute/messages",
]

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains("pendingMessages")) {
        db.createObjectStore("pendingMessages", { keyPath: "id", autoIncrement: true })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

async function savePendingMessage(payload) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingMessages", "readwrite")
    tx.objectStore("pendingMessages").add({ ...payload, savedAt: Date.now() })
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function getPendingMessages() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingMessages", "readonly")
    const req = tx.objectStore("pendingMessages").getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function deletePendingMessage(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pendingMessages", "readwrite")
    tx.objectStore("pendingMessages").delete(id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGES).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  const validCaches = [CACHE_STATIC, CACHE_PAGES, CACHE_API]
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-HTTP et les extensions browser
  if (!url.protocol.startsWith("http")) return
  if (request.method !== "GET") return

  // ── Assets statiques Next.js (Cache First — immutable) ───────────────────
  // En développement (localhost), on ne cache pas pour éviter les chunks périmés
  if (url.pathname.startsWith("/_next/static/")) {
    if (self.location.hostname === "localhost") return // laisser le browser gérer
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    )
    return
  }

  // ── API messagerie (Stale-While-Revalidate) ───────────────────────────────
  if (url.pathname.startsWith("/api/messages") || url.pathname.startsWith("/api/communaute/posts")) {
    event.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        const cached = await cache.match(request)
        const cachedFallback = cached?.clone() // clone pour le fallback fetch-failed
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        }).catch(() => cachedFallback) // fallback cache si offline
        // Retour immédiat du cache + revalidation en arrière-plan
        return cached ?? fetchPromise
      })
    )
    return
  }

  // ── Pages de navigation (Network First avec fallback cache) ──────────────
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_PAGES).then((c) => c.put(request, cloned))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((r) => r ?? caches.match("/"))
        )
    )
  }
})

// ─── Background Sync — envoi messages offline ────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "send-pending-messages") {
    event.waitUntil(flushPendingMessages())
  }
})

async function flushPendingMessages() {
  const pending = await getPendingMessages()
  for (const item of pending) {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinataireId: item.destinataireId, contenu: item.contenu }),
      })
      if (res.ok || res.status === 400) {
        // 400 = validation échouée → ne pas retry
        await deletePendingMessage(item.id)
      }
    } catch {
      // Réseau toujours absent → on garde le message en queue
    }
  }
}

// ─── Message depuis l'app (client → SW) ──────────────────────────────────────

self.addEventListener("message", async (event) => {
  if (event.data?.type === "QUEUE_MESSAGE") {
    // Sauvegarder le message offline en IndexedDB
    await savePendingMessage(event.data.payload)
    // Demander un Background Sync dès que le réseau revient
    if ("sync" in self.registration) {
      self.registration.sync.register("send-pending-messages").catch(() => {})
    }
  }
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
