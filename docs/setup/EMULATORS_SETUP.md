# Solución: Error de Firebase "internal" y base de datos no conectada

## Problema identificado

```
❌ Login error: FirebaseError: internal
Could not reach Cloud Firestore backend. Connection failed 1 times.
Error (auth/network-request-failed)
```

## Causa raíz

Los **emuladores de Firebase** no estaban corriendo. La aplicación está configurada para usar emuladores locales en modo desarrollo (DEV), pero los servicios no estaban activos.

## Solución aplicada

### 1. Iniciar emuladores de Firebase

```bash
firebase emulators:start --only functions,auth,firestore
```

**Estado actual:** ✅ Emuladores corriendo en:
- **Auth:** http://127.0.0.1:9099
- **Firestore:** http://127.0.0.1:8080
- **Functions:** http://127.0.0.1:5001
- **UI Admin:** http://127.0.0.1:4000

### 2. Cargar datos de prueba en emuladores

Creado script `seed-emulators.js` que carga:
- 3 usuarios (admin, capitan, supervisor) con PINs hasheados
- 10 productos de ejemplo
- Sin credenciales de producción (usa emuladores)

```bash
node seed-emulators.js
```

### 3. Reiniciar servidor de desarrollo

```bash
npm run dev
```

**URL de la app:** http://localhost:5173/

---

## Credenciales de prueba

| Usuario | PIN | Rol | Permisos |
|---------|-----|-----|----------|
| `admin` | `1234` | Admin | Acceso completo |
| `capitan` | `9999` | Capitán | Gestión de mesas, órdenes |
| `supervisor` | `5678` | Supervisor | Solo lectura |

---

## Estructura de emuladores

```
┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
└────────────────┴────────────────┴─────────────────────────────────┘
```

---

## Flujo de desarrollo

### Inicio de sesión completo
```bash
# Terminal 1: Emuladores
firebase emulators:start --only functions,auth,firestore

# Terminal 2: App
npm run dev

# Navegador: http://localhost:5173/
```

### Cargar datos frescos
```bash
# Limpiar y recargar (mientras emuladores están corriendo)
node seed-emulators.js
```

---

## Archivos modificados/creados

1. **`seed-emulators.js`** (NUEVO)
   - Script para poblar emuladores locales
   - No requiere credenciales de producción
   - Variables de entorno: `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`

2. **`src/config/firebase.ts`** (YA EXISTÍA)
   - Conexión automática a emuladores en modo DEV
   - Logs: `🔧 Emuladores conectados: Auth (9099), Firestore (8080), Functions (5001)`

3. **`functions/src/index.ts`** (YA EXISTÍA)
   - Cloud Function `loginWithPin`: verifica PIN con bcrypt
   - Retorna custom token para Firebase Auth

---

## Validación

### ✅ Checklist de funcionamiento

- [x] Emuladores corriendo (verificar con `lsof -ti:8080,9099,5001`)
- [x] Datos cargados en emuladores (usuarios + productos)
- [x] Vite dev server corriendo (http://localhost:5173/)
- [x] Login funcional con PIN 1234
- [x] POS muestra 10 productos
- [x] Sin errores "internal" en consola

### Comandos de verificación

```bash
# Ver procesos en puertos de emuladores
lsof -ti:8080,9099,5001

# Debe retornar 2 PIDs (emulador y node)
```

---

## Notas importantes

### ⚠️ Diferencias Emuladores vs Producción

**Emuladores (desarrollo local):**
- Datos volátiles (se pierden al reiniciar)
- Sin costos
- Datos separados de producción
- Ideal para testing

**Producción (Firebase Cloud):**
- Datos persistentes
- Requiere `seed.js` con `firebase-admin-credentials.json`
- Usa credenciales reales

### 🔄 Reiniciar todo desde cero

```bash
# 1. Matar todos los procesos
killall -9 node firebase

# 2. Iniciar emuladores
firebase emulators:start --only functions,auth,firestore &

# 3. Esperar 5 segundos y cargar datos
sleep 5 && node seed-emulators.js

# 4. Iniciar app
npm run dev
```

---

## Troubleshooting

### Error: "Port 5173 is in use"
```bash
killall -9 node
npm run dev
```

### Error: "Cannot connect to emulators"
```bash
# Verificar que estén corriendo
firebase emulators:start --only functions,auth,firestore

# En otra terminal
lsof -ti:8080,9099,5001
# Debe mostrar PIDs
```

### Error: "Usuario no encontrado"
```bash
# Recargar datos
node seed-emulators.js
```

---

## Próximos pasos

Con los emuladores funcionando correctamente, ahora puedes:

1. ✅ Desarrollar sin afectar producción
2. ✅ Testear funciones Cloud Functions localmente
3. ✅ Probar flujos completos sin costos
4. ⏭️ Continuar con **Sistema de Notificaciones Push**
5. ⏭️ Continuar con **Modo Offline / PWA**

---

**Estado actual:**
- 🟢 Emuladores: ONLINE
- 🟢 App dev: ONLINE (http://localhost:5173/)
- 🟢 Base de datos: POBLADA
- 🟢 Autenticación: FUNCIONAL
