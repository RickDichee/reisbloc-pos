# 🔥 Setup Firestore - TPV Solutions

## Paso 1: Crear Proyecto en Firebase

1. Accede a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Agregar proyecto"
3. Nombre del proyecto: `TPV_Solutions` (o el que prefieras)
4. Configura Analytics (opcional)
5. Crea el proyecto

## Paso 2: Configurar Firestore Database

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Selecciona:
   - Ubicación: `nam5` (us-central1) o la más cercana
   - Reglas de seguridad: **Comienza en modo de prueba** (por ahora)
4. Haz clic en **Crear**

## Paso 3: Crear Colecciones y Documentos

### Colección: `users`

```json
{
  "id": "user_1",
  "username": "admin",
  "pin": "hashed_pin_1234",
  "role": "admin",
  "active": true,
  "devices": ["device_1"],
  "createdAt": "2026-01-21T00:00:00Z"
}
```

**Pasos:**
1. En Firestore, haz clic en **+ Crear colección**
2. Nombre: `users`
3. ID del documento: `user_1`
4. Copia los datos JSON de arriba
5. Haz clic en **Guardar**

### Colección: `devices`

```json
{
  "id": "device_1",
  "userId": "user_1",
  "macAddress": "2C:A1:FF:FF:FF:FF",
  "deviceName": "iPhone 12",
  "network": "wifi",
  "os": "iOS",
  "browser": "Safari",
  "registeredAt": "2026-01-21T00:00:00Z",
  "lastAccess": "2026-01-21T00:00:00Z",
  "isApproved": true
}
```

### Colección: `products`

```json
{
  "name": "Tacos al Pastor",
  "price": 85,
  "category": "Comida",
  "hasInventory": false,
  "active": true,
  "createdAt": "2026-01-21T00:00:00Z"
},
{
  "name": "Cerveza",
  "price": 45,
  "category": "Bebidas",
  "hasInventory": true,
  "currentStock": 100,
  "minimumStock": 10,
  "active": true,
  "createdAt": "2026-01-21T00:00:00Z"
}
```

### Colección: `orders`
```json
{
  "tableNumber": 1,
  "items": [],
  "status": "open",
  "createdAt": "2026-01-21T00:00:00Z",
  "createdBy": "user_1",
  "notes": ""
}
```

### Colección: `sales`
```json
{
  "orderIds": ["order_1"],
  "tableNumber": 1,
  "items": [],
  "subtotal": 500,
  "discounts": 0,
  "tax": 80,
  "total": 580,
  "paymentMethod": "cash",
  "cashAmount": 580,
  "tip": 75,
  "tipSource": "cash",
  "saleBy": "user_1",
  "createdAt": "2026-01-21T00:00:00Z"
}
```

### Colección: `daily_closes`
```json
{
  "date": "2026-01-21T00:00:00Z",
  "closedBy": "user_1",
  "closedAt": "2026-01-21T20:00:00Z",
  "sales": [],
  "totalSales": 5000,
  "totalCash": 3500,
  "totalDigital": 1500,
  "totalTips": 500,
  "tipsDistribution": [],
  "adjustments": []
}
```

### Colección: `audit_logs`
```json
{
  "userId": "user_1",
  "action": "LOGIN_SUCCESS",
  "entityType": "AUTH",
  "entityId": "login",
  "timestamp": "2026-01-21T00:00:00Z",
  "ipAddress": "192.168.1.100",
  "deviceId": "device_1"
}
```

## Paso 4: Obtener Credenciales Firebase

1. En Firebase Console, ve a **Configuración del proyecto**
2. Haz clic en **Aplicaciones > Web** (o crea una)
3. Copia la configuración
4. Edita `/home/r1ck/TPV_solutions/.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

VITE_CLIP_API_KEY=your_clip_key
VITE_CLIP_MERCHANT_ID=your_merchant_id
```

## Paso 5: Crear Colecciones Vía Script

Alternativa: Usa este script para crear las colecciones automáticamente:

```bash
cd /home/r1ck/TPV_solutions

# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar Firebase
firebase init

# Crear colecciones (usaremos Firestore emulator para testing)
firebase emulators:start
```

## Paso 6: Configurar Reglas de Seguridad

En Firestore Console, ve a **Reglas** y usa:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Permitir lectura/escritura temporal en desarrollo
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // PRODUCCIÓN: Reemplazar con estas reglas
    /*
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || 
                          isAdmin(request.auth.uid);
    }

    match /devices/{deviceId} {
      allow read: if request.auth.uid != null;
      allow write: if isAdmin(request.auth.uid);
    }

    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if isAdmin(request.auth.uid);
    }

    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }

    match /sales/{saleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /daily_closes/{closeId} {
      allow read: if isAdmin(request.auth.uid) || 
                    isSupervisor(request.auth.uid);
      allow write: if isAdmin(request.auth.uid);
    }

    match /audit_logs/{auditId} {
      allow read: if isAdmin(request.auth.uid);
      allow write: if request.auth != null;
    }

    function isAdmin(userId) {
      return get(/databases/$(database)/documents/users/$(userId))
        .data.role == 'admin';
    }

    function isSupervisor(userId) {
      return get(/databases/$(database)/documents/users/$(userId))
        .data.role == 'supervisor';
    }
    */
  }
}
```

Haz clic en **Publicar**

## Paso 7: Probar la Conexión

```bash
cd /home/r1ck/TPV_solutions

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Abre http://localhost:5173 en tu navegador

## ✅ Checklist de Setup

- [ ] Proyecto Firebase creado
- [ ] Firestore Database creado
- [ ] Colecciones creadas (users, devices, products, orders, sales, daily_closes, audit_logs)
- [ ] Credenciales copiadas a `.env.local`
- [ ] Reglas de seguridad configuradas
- [ ] Firebase CLI instalado
- [ ] `npm install` ejecutado
- [ ] `npm run dev` funciona sin errores
- [ ] Página de login se carga

## 🆘 Troubleshooting

**Error: "PERMISSION_DENIED"**
→ Las reglas de seguridad están rechazando la solicitud. Usa modo prueba temporalmente.

**Error: "Project not found"**
→ Verifica que VITE_FIREBASE_PROJECT_ID es correcto en `.env.local`

**Error: "Cannot connect to Firestore"**
→ Verifica que Internet está activo y las credenciales son correctas.

**La app no se conecta a Firestore**
→ Asegúrate de que `.env.local` tiene todas las variables.

## 📚 Próximos Pasos

1. ✅ Setup Firestore (completado)
2. ⏳ Implementar Cloud Functions para autenticación
3. ⏳ Crear componentes de UI (Login, POS, etc.)
4. ⏳ Implementar sistema de dispositivos
5. ⏳ Conectar con Clip API

---

**Guía completa**: Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para estructura de BD
