// Configuración de Firebase
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Firestore
const db = getFirestore(app)

// Auth
const auth = getAuth(app)

// Storage
const storage = getStorage(app)

// Functions
const functions = getFunctions(app)

// Messaging (FCM para push notifications) - inicializado después
let messaging: ReturnType<typeof getMessaging> | null = null

// Analytics (solo en producción) - inicializado después  
let analytics: ReturnType<typeof getAnalytics> | null = null

// Inicializar Messaging y Analytics de forma asíncrona
;(async () => {
  try {
    if (await isMessagingSupported()) {
      messaging = getMessaging(app)
    }
  } catch {
    console.warn('⚠️ Firebase Messaging no soportado en este navegador')
  }

  try {
    if (await isSupported() && !import.meta.env.DEV) {
      analytics = getAnalytics(app)
    }
  } catch {
    // Analytics no disponible
  }
})()

// Emulators (desarrollo local)
// Para usar emulators, ejecutar: firebase emulators:start --only functions,auth,firestore
// Para controlar emulators:
// - En desarrollo: VITE_USE_EMULATORS !== 'false' → usa emulators
// - En build/preview: VITE_USE_EMULATORS === 'true' → fuerza emulators
const useEmulators = (
  import.meta.env.VITE_USE_EMULATORS === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS !== 'false')
)

// Detectar si estamos en localhost o en otra IP (ej. desde celular)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
// Usar IP apropiada: localhost → 127.0.0.1, desde red → usa la misma IP que la página web
const emulatorHost = isLocalhost ? '127.0.0.1' : window.location.hostname

if (useEmulators) {
  try {
    // Conectar a emuladores locales para testing completo
    const authUrl = `http://${emulatorHost}:9099`
    connectAuthEmulator(auth, authUrl, { disableWarnings: true })
    connectFirestoreEmulator(db, emulatorHost, 8080)
    connectFunctionsEmulator(functions, emulatorHost, 5001)
    console.log(`🔧 Emuladores conectados a ${emulatorHost}: Auth (9099), Firestore (8080), Functions (5001)`)
    console.log(`   URL Host: ${window.location.hostname}`)
  } catch (e) {
    console.warn('⚠️ No se pudo conectar a emuladores:', e)
  }
} else {
  console.log('🌐 Conectado a Firebase Cloud (Producción)')
}

export { app, db, auth, storage, analytics, functions, messaging }
