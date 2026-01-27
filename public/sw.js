// Service Worker mejorado para PWA con soporte offline
// Incluye: cache strategies, sync, offline queue

const CACHE_VERSION = 'v1'
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`
}

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

const API_CACHE_URLS = [
  '/api/',
  'firestore',
  'firebase'
]

// ==================== INSTALL ====================

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('📦 Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.warn('⚠️ Some static assets not available during install')
      })
    }).then(() => {
      self.skipWaiting()
    })
  )
})

// ==================== ACTIVATE ====================

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            version: CACHE_VERSION
          })
        })
      })
    })
  )
})

// ==================== FETCH ====================

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo interceptar GET requests
  if (request.method !== 'GET') {
    return
  }

  // NO cachear requests a Firebase Functions
  if (url.pathname.includes('/functions/') || 
      url.pathname.includes('.json') && url.pathname.includes('firestore')) {
    event.respondWith(
      fetch(request).catch(() => {
        return cacheFirst(request)
      })
    )
    return
  }

  // Estrategia: Network first (con fallback a cache)
  if (isApiRequest(request)) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Estrategia: Cache first (con fallback a network)
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Default: Stale while revalidate
  event.respondWith(staleWhileRevalidateStrategy(request))
})

// ==================== ESTRATEGIAS DE CACHE ====================

/**
 * Network First: Intenta red, si falla usa cache
 * Ideal para: datos dinámicos (órdenes, usuarios)
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request)
    
    // Guardar en cache si es exitoso
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.api)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.warn('📡 Network failed, using cache:', request.url)
    const cached = await caches.match(request)
    return cached || createOfflineResponse()
  }
}

/**
 * Cache First: Usa cache, si no existe intenta red
 * Ideal para: assets estáticos, imágenes
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request)
  
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.warn('💾 Using cached or offline response:', request.url)
    return createOfflineResponse()
  }
}

/**
 * Stale While Revalidate: Usa cache si existe, pero actualiza en background
 * Ideal para: datos que pueden estar ligeramente desactualizados
 */
async function staleWhileRevalidateStrategy(request) {
  const cached = await caches.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAMES.dynamic)
      cache.then(c => c.put(request, response.clone()))
    }
    return response
  }).catch(() => {
    return cached || createOfflineResponse()
  })

  return cached || fetchPromise
}

// ==================== HELPERS ====================

function isApiRequest(request) {
  const url = new URL(request.url)
  return API_CACHE_URLS.some(pattern => url.pathname.includes(pattern))
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|webp)$/)
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      offline: true,
      message: 'Sin conexión - usando datos en cache',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline': 'true'
      }
    }
  )
}

// ==================== BACKGROUND SYNC ====================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders())
  }
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales())
  }
})

async function syncPendingOrders() {
  try {
    console.log('🔄 Sincronizando órdenes pendientes...')
    // Obtener órdenes del IndexedDB y enviarlas
    // Implementado en offlineSyncService.ts
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_STARTED',
          syncType: 'orders'
        })
      })
    })
  } catch (error) {
    console.error('❌ Sync orders failed:', error)
  }
}

async function syncPendingSales() {
  try {
    console.log('🔄 Sincronizando ventas pendientes...')
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_STARTED',
          syncType: 'sales'
        })
      })
    })
  } catch (error) {
    console.error('❌ Sync sales failed:', error)
  }
}

// ==================== PUSH NOTIFICATIONS ====================

// Manejar notificaciones en background (ya implementado en firebase-messaging-sw.js)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

console.log('✅ Service Worker loaded and ready')
