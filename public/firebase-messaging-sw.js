// Service Worker para Firebase Cloud Messaging
// Este archivo maneja las notificaciones push cuando la app está en background

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Configuración de Firebase (debe coincidir con la configuración principal)
firebase.initializeApp({
  apiKey: "AIzaSyBExampleKey",
  authDomain: "pos-tpvsolutions.firebaseapp.com",
  projectId: "pos-tpvsolutions",
  storageBucket: "pos-tpvsolutions.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
})

const messaging = firebase.messaging()

// Manejar notificaciones en background
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Notificación recibida en background:', payload)
  
  const notificationTitle = payload.notification?.title || 'Nueva notificación'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'default',
    requireInteraction: payload.data?.priority === 'high',
    data: payload.data
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Manejar click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Click en notificación:', event.notification)
  
  event.notification.close()
  
  // Abrir o enfocar la ventana de la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
