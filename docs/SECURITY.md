# Documentación de Seguridad - TPV Solutions

## 🔒 Sistema de Registro de Dispositivos

### Descripción General
TPV Solutions implementa un sistema robusto de registro y validación de dispositivos para garantizar que solo los empleados autorizados puedan acceder a la aplicación desde dispositivos conocidos.

### 1. Información del Dispositivo Capturada

Cada dispositivo registrado almacena:

```typescript
{
  id: string;                    // ID único del dispositivo
  userId: string;                // Usuario propietario
  macAddress: string;            // MAC address único (o fingerprint)
  deviceName: string;            // Nombre del dispositivo (iPhone, Android, etc.)
  network: 'wifi' | 'mobile';   // Tipo de conexión
  os: string;                    // Sistema operativo (iOS, Android, Windows, etc.)
  browser: string;               // Navegador usado
  registeredAt: Date;            // Cuándo se registró
  lastAccess: Date;              // Último acceso
  isApproved: boolean;           // Aprobado por admin
}
```

### 2. Proceso de Registro de Dispositivo

#### Primera vez que un usuario inicia sesión:
1. El usuario ingresa su PIN
2. Se valida el PIN
3. Se captura información del dispositivo actual
4. Se genera un fingerprint único del dispositivo
5. El dispositivo se marca como "pendiente de aprobación"
6. El admin recibe notificación de nuevo dispositivo
7. Una vez aprobado, el usuario puede acceder

#### Flujo:
```
Usuario intenta login
    ↓
Ingresa PIN
    ↓
Validar PIN
    ↓
Obtener info del dispositivo
    ↓
¿Dispositivo registrado?
    ├─ No → Registrar, mostrar "Pendiente de aprobación"
    └─ Sí → ¿Está aprobado?
            ├─ No → Rechazar acceso
            └─ Sí → Permitir login
```

### 3. Obtención de MAC Address

Para máxima compatibilidad:

**Navegadores móviles**: Se usa WebRTC para obtener IP local y se genera MAC derivado
**Navegadores desktop**: Se usa WebRTC + fingerprinting del navegador
**Fallback**: Si WebRTC no funciona, se usa fingerprint de:
- User Agent
- Idioma del navegador
- Zona horaria
- Resolución de pantalla
- Número de cores

```typescript
// Ejemplo de generación de fingerprint
const fingerprint = generateFromWebRTC() || generateFromBrowserData();
// Resultado: "2C:A1:FF:FF:FF:FF" (formato MAC-like)
```

### 4. Validación de Dispositivo

En cada login:
1. Se obtiene el fingerprint del dispositivo actual
2. Se compara con los dispositivos registrados del usuario
3. Se valida estado de aprobación
4. Se actualiza `lastAccess`

```typescript
// Validación
const deviceInfo = await getDeviceInfo();
const registeredDevice = user.devices.find(d => 
  compareDevices(d, deviceInfo)
);

if (!registeredDevice) {
  throw new Error('Device not registered');
}

if (!registeredDevice.isApproved) {
  throw new Error('Device not approved');
}
```

### 5. Panel Admin para Gestión de Dispositivos

El admin puede:
- Ver todos los dispositivos registrados por usuario
- Aprobar/rechazar nuevos dispositivos
- Revocar acceso a dispositivos específicos
- Ver historial de acceso de cada dispositivo
- Forzar cierre de sesión de dispositivos

```
┌─────────────────────────────────────────┐
│ GESTIÓN DE DISPOSITIVOS                 │
├─────────────────────────────────────────┤
│                                         │
│ Usuario: José García (Capitán)         │
│                                         │
│ ☐ iPhone 12 (iOS 15)                   │
│   WiFi | Última entrada: Hoy 14:30    │
│   [Aprobado] [Revocar] [Ver logs]      │
│                                         │
│ ◆ Samsung Galaxy S21 (Android 12)      │
│   Móvil | Última entrada: Hoy 10:15   │
│   [Pendiente] [Aprobar] [Rechazar]     │
│                                         │
└─────────────────────────────────────────┘
```

## 🔐 Seguridad de Sesiones

### Expiración de Sesión
- Sesión expira después de 8 horas de inactividad
- Inactividad detectada por falta de eventos del usuario
- Se requiere volver a ingresar PIN

### Cierre de Sesión Remoto
- Admin puede cerrar sesión de cualquier usuario
- Útil si dispositivo se pierde o empleado se va

### Token de Sesión
```typescript
interface SessionToken {
  sessionId: string;
  userId: string;
  deviceId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
}
```

## 📊 Auditoría de Acceso

Se registra automáticamente:
- ✓ Cada login exitoso (usuario, dispositivo, hora, IP)
- ✓ Intentos de login fallidos (usuario, dispositivo, hora)
- ✓ Cambios de dispositivo aprobado/rechazado
- ✓ Acceso a dispositivo no registrado
- ✓ Cierres de sesión

```typescript
{
  timestamp: "2026-01-21T14:30:00Z",
  action: "LOGIN_SUCCESS",
  userId: "user_123",
  deviceId: "device_456",
  ipAddress: "192.168.1.100",
  network: "wifi",
  result: "APPROVED"
}
```

## 🚨 Casos de Seguridad

### Caso 1: Nuevo dispositivo móvil
1. Empleado intenta login desde nuevo iPhone
2. Sistema detecta dispositivo desconocido
3. Se registra como "Pendiente de aprobación"
4. Admin recibe notificación
5. Admin aprueba en el panel
6. Empleado puede acceder en siguientes logins

### Caso 2: Dispositivo perdido
1. Empleado reporta pérdida de dispositivo
2. Admin accede a "Dispositivos" del empleado
3. Admin hace clic en [Revocar] en el dispositivo
4. Ese dispositivo ya no puede acceder (incluso con PIN correcto)
5. Empleado puede registrar nuevo dispositivo

### Caso 3: Intento de acceso no autorizado
1. Alguien intenta usar iPhone de empleado A desde cuenta de empleado B
2. Sistema valida que el dispositivo no está asociado a empleado B
3. Login falla
4. Intento se registra en auditoría
5. Admin puede ver múltiples intentos fallidos

## 🔧 Implementación en Firebase

### Colección: `users`
```typescript
{
  id: "user_123",
  username: "jose_garcia",
  pin: "hash_del_pin",
  role: "capitan",
  active: true,
  devices: ["device_456", "device_789"],  // IDs de dispositivos autorizados
  createdAt: Timestamp,
}
```

### Colección: `devices`
```typescript
{
  id: "device_456",
  userId: "user_123",
  macAddress: "2C:A1:FF:FF:FF:FF",
  deviceName: "iPhone 12",
  network: "wifi",
  os: "iOS",
  browser: "Safari",
  registeredAt: Timestamp,
  lastAccess: Timestamp,
  isApproved: true,
}
```

### Colección: `audit_logs`
```typescript
{
  id: "audit_123",
  timestamp: Timestamp,
  userId: "user_123",
  action: "LOGIN_SUCCESS",
  deviceId: "device_456",
  ipAddress: "192.168.1.100",
  network: "wifi",
  metadata: {
    browser: "Safari",
    os: "iOS",
  }
}
```

## 📱 Restricción por Dispositivo

Una vez que un empleado tiene dispositivos registrados:
- Solo puede acceder desde esos dispositivos aprobados
- No puede cambiar de dispositivo sin aprobación del admin
- Si pierde su dispositivo, admin debe revocar acceso
- Luego puede registrar uno nuevo

**Excepciones:**
- Admin siempre puede acceder (con validaciones)
- Supervisor puede acceder desde dispositivos aprobados

## 🛡️ Protección contra Ataques

### Fuerza Bruta
- Máximo 3 intentos de PIN fallidos
- Bloqueo temporal de 15 minutos
- Registro de intentos fallidos

### Suplantación de Identidad
- Validación de MAC/dispositivo en cada request
- Token de sesión vinculado a dispositivo
- Si token en dispositivo diferente → logout

### Man-in-the-Middle
- Usar HTTPS siempre
- Certificados SSL válidos
- WebRTC sobre conexión segura

## ✅ Checklist de Implementación

- [ ] Crear colecciones en Firestore
- [ ] Implementar DeviceService
- [ ] Integrar en componente de login
- [ ] Crear panel de gestión de dispositivos
- [ ] Implementar auditoría
- [ ] Crear reglas de seguridad en Firestore
- [ ] Testing de casos de seguridad
- [ ] Documentación de usuario
- [ ] Capacitación de admin

---

**Última actualización**: 21 de enero de 2026
