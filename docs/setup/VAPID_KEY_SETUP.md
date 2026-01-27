# 🔑 Configuración VAPID Key para Push Notifications

## ¿Qué es VAPID?

VAPID es un par de claves que autentica tu servidor con el servicio de push de navegadores (Web Push Protocol). Es necesario para que Firebase Cloud Messaging pueda enviar notificaciones push.

## 🔧 Cómo Obtener tu VAPID Key

### Paso 1: Ir a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `pos-tpvsolutions`

### Paso 2: Ir a Cloud Messaging

1. En el menú de la izquierda, ve a **Project Settings** (ícono de engranaje)
2. Abre la pestaña **Cloud Messaging**
3. En la sección "Web Push certificates" verás un botón **"Generate Key Pair"**

### Paso 3: Copiar la Key Pública

1. Haz clic en **"Generate Key Pair"**
2. Se generarán dos claves: pública y privada
3. **Copia la clave PÚBLICA** (empieza con `BN...`)
4. La clave privada la guarda Firebase automáticamente en su servidor

## 📝 Agregar a tu Proyecto

### Opción 1: Archivo .env

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_FIREBASE_VAPID_KEY=tu_clave_publica_aqui
```

Ejemplo:
```env
VITE_FIREBASE_VAPID_KEY=BN5PU9K_2zt8I9L7M4N6O2P9Q1R3S5T7U9V1W3X5Y7Z9A1B3C5D7E9F0G1H3I5
```

### Opción 2: Directamente en código

Si la VAPID key está en variables de entorno, el código ya la lee automáticamente:

```typescript
// En src/services/notificationService.ts
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
```

## ✅ Verificar que Funciona

### 1. Restart del servidor de desarrollo

```bash
# Presiona Ctrl+C en la terminal
# Luego inicia nuevamente
npm run dev
```

### 2. Abrir app en navegador

1. Ve a http://localhost:5173/
2. Login con cualquier usuario
3. Verás un prompt: "Activar notificaciones"
4. Haz clic en "Activar"
5. El navegador pedirá permiso

### 3. Verificar en Firebase Console

En **Cloud Messaging** → puedes ver tokens registrados de usuarios

## 🧪 Testing de Notificaciones Push

### Método 1: Desde POS

1. Login con usuario `mesero` en una ventana
2. Login con usuario `cocina` en otra ventana
3. Mesero crea una orden
4. Cocina debe recibir notificación push

### Método 2: Desde Cloud Functions

En Firebase Console, puedes enviar un test:

1. Ve a **Cloud Messaging** en Project Settings
2. Hay una sección "Send test message"
3. Ingresa el token FCM de un usuario
4. Haz clic "Send"

### Método 3: Desde CLI

```bash
firebase functions:log

# O enviar desde CLI:
firebase messaging:send --token=FCM_TOKEN --title="Test" --body="Hello"
```

## 🔐 Seguridad

- ✅ La clave PÚBLICA se puede compartir (es en el código)
- ✅ La clave PRIVADA la mantiene Firebase (no la compartas)
- ✅ El archivo `.env.local` NO debe estar en Git (ve `.gitignore`)

## 🚀 Deploying a Producción

Cuando deploys a Firebase Hosting:

1. Agrega la variable de entorno en Firebase:
   ```bash
   firebase functions:config:set notifications.vapid_key="tu_key_aqui"
   ```

2. O directamente en `.env.production`:
   ```env
   VITE_FIREBASE_VAPID_KEY=BN5PU...
   ```

3. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## ❓ Solución de Problemas

### "VAPID key not set"
- Verifica que `.env.local` existe
- Reinicia el servidor de desarrollo
- Verifica que `VITE_FIREBASE_VAPID_KEY` está correcto

### Notificaciones no llegan
1. Verificar que el permiso está concedido en el navegador
2. Ver logs en DevTools Console
3. Verificar que el token FCM se guardó en Firestore
4. Probar con test message desde Firebase Console

### Chrome no muestra notificación
1. Ir a Settings → Privacy → Notifications
2. Permitir http://localhost:5173
3. Cerrar y abrir de nuevo la app

### Safari (iOS) no funciona
- Las notificaciones push requieren HTTPS
- Para testing local en iOS, usar un service worker local
- Para producción, funciona correctamente

## 📱 Verificar que Funciona en Móvil

### Android
1. Agregar app a pantalla de inicio ("Add to Home Screen")
2. Abrir app
3. Permitir notificaciones
4. Las notificaciones push llegarán

### iOS
1. Abrir en Safari
2. Compartir → Agregar a Pantalla de Inicio
3. Abrir app
4. Nota: iOS tiene limitaciones, pero funciona parcialmente

## 💡 Tips

- El token FCM se guarda automáticamente en Firestore
- Tokens inválidos se limpian automáticamente
- Puedes revocar acceso deteniendo las notificaciones en el navegador
- Cada dispositivo tiene un token único

## 🎯 Próximo Paso

Una vez agregada la VAPID key, todo el sistema de notificaciones estará completo:

1. ✅ Service Worker registrado
2. ✅ Firebase Cloud Messaging configurado
3. ✅ VAPID key agregada
4. ✅ Notificaciones funcionando

¡Listo para probar!
