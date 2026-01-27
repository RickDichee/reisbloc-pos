# 🔔 Sistema de Notificaciones Push - Reisbloc POS

## ✅ Implementación Completa

El sistema de notificaciones push está completamente implementado usando Firebase Cloud Messaging (FCM) y notificaciones in-app en tiempo real.

## 🎯 Características

### Notificaciones Implementadas

1. **Nueva Orden → Cocina/Bar**
   - Cuando un mesero/capitan envía una orden desde POS
   - Notifica a todos los usuarios con rol `cocina` y `bar`
   - Prioridad: Alta
   - Incluye: Mesa, cantidad de productos, total

2. **Orden Lista → Mesero/Capitan**
   - Cuando cocina marca una orden como "Lista"
   - Notifica a todos los usuarios con rol `mesero` y `capitan`
   - Prioridad: Alta
   - Incluye: Mesa, cantidad de platillos

### Componentes Creados

- ✅ `NotificationCenter` - UI con campana y panel de notificaciones
- ✅ `useNotifications` - Hook para manejar estado y permisos
- ✅ `notificationService` - Servicios para crear y escuchar notificaciones
- ✅ `sendNotification` - Cloud Function para enviar push notifications
- ✅ Service Worker - Manejar notificaciones en background

## 🔧 Configuración Requerida

### 1. Obtener VAPID Key

Para que las notificaciones push funcionen, necesitas una VAPID key de Firebase:

```bash
# En Firebase Console
1. Ir a Project Settings
2. Cloud Messaging tab
3. Web Push certificates
4. Generate Key Pair
5. Copiar la key pública
```

### 2. Configurar Variables de Entorno

Agregar a `.env` o `.env.local`:

```env
VITE_FIREBASE_VAPID_KEY=tu_vapid_key_publica_aqui
```

### 3. Actualizar Service Worker

Editar `public/firebase-messaging-sw.js` y reemplazar la configuración con tus datos reales de Firebase:

```javascript
firebase.initializeApp({
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
})
```

### 4. Compilar Cloud Functions

```bash
cd functions
npm run build
cd ..

# Reiniciar emuladores para cargar la nueva función
firebase emulators:restart
```

## 📱 Flujo de Usuario

### Primera vez (Solicitar Permiso)

1. Usuario hace login
2. Después de 3 segundos, aparece un prompt elegante
3. Usuario hace clic en "Activar"
4. El navegador pide permiso de notificaciones
5. Si acepta, se guarda el token FCM en Firestore

### Notificaciones en Uso

**Escenario 1: Mesero crea orden**
```
1. Mesero agrega productos en POS
2. Click en "Enviar a Cocina"
3. Se crea la orden en Firestore
4. Cloud Function envía notificación push
5. Cocina/Bar reciben:
   - Notificación push (si app en background)
   - Notificación in-app (campana con badge)
   - Sonido de alerta
```

**Escenario 2: Cocina marca orden lista**
```
1. Cocina termina de preparar platillos
2. Click en "Marcar como Lista"
3. Se actualiza status de orden
4. Cloud Function envía notificación
5. Mesero/Capitan reciben:
   - Notificación push
   - Notificación in-app
   - Pueden servir la orden
```

## 🎨 UI del Sistema

### NotificationCenter (Campana)
- Posición: Esquina superior derecha
- Badge rojo con contador de no leídas
- Panel desplegable con lista de notificaciones
- Botón "Marcar todas como leídas"

### Notificaciones
- **Verde** (baja): Info general
- **Azul** (normal): Órdenes, actualizaciones
- **Rojo** (alta): Nuevas órdenes, alertas urgentes

### Prompt de Permiso
- Aparece automáticamente después de 3 segundos
- Diseño elegante con icono de campana
- Botones: "Activar" / "Ahora no"
- Solo se muestra una vez por sesión

## 🗄️ Estructura de Datos

### Colección `notifications`
```typescript
{
  userId: string        // ID del usuario receptor
  title: string         // "Nueva orden - Mesa 5"
  body: string          // "3 productos - Total: $450.00"
  type: 'order' | 'inventory' | 'alert' | 'info'
  priority: 'low' | 'normal' | 'high'
  read: boolean         // false por defecto
  createdAt: Timestamp
  data: {               // Datos adicionales
    orderId?: string
    tableNumber?: string
    itemCount?: string
  }
}
```

### Campo `fcmToken` en `users`
```typescript
{
  // ... otros campos de usuario
  fcmToken?: string              // Token de FCM
  fcmTokenUpdatedAt?: Timestamp  // Cuándo se guardó
}
```

## 🔐 Seguridad y Permisos

- Solo usuarios autenticados pueden recibir notificaciones
- El token FCM se guarda seguro en Firestore
- Tokens inválidos se limpian automáticamente
- Cloud Function valida que el usuario tenga permisos

## 🎯 Casos de Uso Adicionales

Puedes agregar más notificaciones fácilmente:

### Inventario Bajo
```typescript
await sendNotificationToUsers({
  roles: ['admin'],
  title: 'Inventario bajo',
  body: `${productName} tiene solo ${stock} unidades`,
  type: 'inventory',
  priority: 'normal'
})
```

### Cierre Diario
```typescript
await sendNotificationToUsers({
  roles: ['admin', 'capitan'],
  title: 'Recordatorio de cierre',
  body: 'Es hora de generar el corte del día',
  type: 'alert',
  priority: 'high'
})
```

### Usuario Específico
```typescript
await sendNotificationToUsers({
  userIds: [userId],
  title: 'Mensaje personal',
  body: 'Tu turno termina en 30 minutos',
  type: 'info',
  priority: 'low'
})
```

## 🧪 Testing

### Probar con Emuladores

1. Iniciar emuladores: `firebase emulators:start`
2. Login con usuario `cocina` (PIN: 3333)
3. Login con usuario `mesero` (PIN: 5555) en otra ventana
4. Mesero crea orden → Cocina recibe notificación
5. Cocina marca lista → Mesero recibe notificación

### Verificar en Firebase Console

```bash
# Ver notificaciones creadas
firebase firestore:get notifications --limit 10

# Ver tokens FCM guardados
firebase firestore:get users --fields fcmToken
```

## 📊 Monitoreo

- Logs de la Cloud Function `sendNotification`
- Contador de notificaciones enviadas vs recibidas
- Tokens FCM inválidos se eliminan automáticamente

## 🐛 Troubleshooting

**Notificaciones no llegan:**
1. Verificar que VAPID key esté configurada
2. Verificar permisos del navegador
3. Ver logs de Cloud Function
4. Verificar que el token FCM esté guardado en Firestore

**Service Worker no registra:**
1. Verificar que `firebase-messaging-sw.js` esté en `/public`
2. Verificar configuración de Firebase en el service worker
3. Probar en modo incógnito

**Notificaciones in-app no aparecen:**
1. Verificar que el usuario esté autenticado
2. Ver logs de `subscribeToNotifications`
3. Verificar reglas de Firestore

## 🚀 Próximas Mejoras

- [ ] Sonidos personalizados por tipo de notificación
- [ ] Vibración en dispositivos móviles
- [ ] Historial completo de notificaciones (página dedicada)
- [ ] Configuración de preferencias (silenciar, filtrar)
- [ ] Notificaciones programadas (recordatorios)
- [ ] Analytics de notificaciones (tasa de lectura, interacción)

## 📝 Créditos

Sistema implementado como parte de Reisbloc POS v2.0
- Firebase Cloud Messaging para push notifications
- Firestore para notificaciones in-app en tiempo real
- React hooks personalizados para manejo de estado
