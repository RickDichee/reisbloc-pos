# ✅ CHECKLIST DE DEPLOYMENT - Reisbloc POS

**Fecha:** 24 de enero 2026  
**Versión:** 2.0.0  
**Estado:** PRE-PRODUCCIÓN ✅

---

## 📋 PRE-DEPLOYMENT

### ✅ Código y Compilación

- [x] Build sin errores: `npm run build` ✅
- [x] TypeScript compiler options correctas (noEmit agregado)
- [x] Errores críticos reparados:
  - [x] tsconfig.json: allowImportingTsExtensions + noEmit
  - [x] POS.tsx: createdAt fields agregados a createOrder()
  - [x] Kitchen.tsx: statusConfig completo (open, sent, ready, served, cancelled, completed)
  - [x] offlineDBService.ts: IndexedDB getAll() calls reparadas
- [x] Warnings TypeScript minimizados
- [x] No console.log con datos sensibles
- [x] Imports optimizados (remover unused)

### ✅ Configuración Firebase

- [x] .env.local existe con credenciales correctas
- [x] Emulators configurados (9099, 8080, 5001)
- [x] firebase.ts detecta emuladores correctamente
- [x] Firestore rules comentadas (desarrollo activo) ⚠️
  - **IMPORTANTE**: Antes de producción, DESCOMENTAR reglas en firestore.rules

### ✅ Cloud Functions

- [x] functions/package.json actualizado
- [x] Todas las funciones compiladas
- [x] bcrypt importado y funcionando
- [x] Error handling implementado
- [x] Validación de inputs en todas las funciones

### ✅ Base de Datos

- [x] Firestore emulator data cargada
- [x] Collections inicializadas:
  - [x] users (con datos de test)
  - [x] products (tacos, bebidas, etc.)
  - [x] devices (test device)
  - [x] orders (historial test)
  - [x] sales (test data)
- [x] Indexes no necesarios (emulator automático)

---

## 📱 CONFIGURACIÓN PARA ONSITE

### Sistema Local (Laptop)

- [x] Node.js v18+ instalado
- [x] Firebase CLI instalado: `firebase --version`
- [x] npm dependencies instaladas: `npm install`
- [x] Functions dependencies: `cd functions && npm install && cd ..`
- [x] Build production: `npm run build` ✅
- [x] Script de producción: `./scripts/start-production.sh` (ejecutable)

### Red Local

- [x] WiFi disponible en restaurante
- [x] Laptop conectado a WiFi
- [x] IP local obtiene: `hostname -I`
- [x] Puerto 4173 disponible (o cambiar en script)
- [x] Puerto 8080, 9099, 5001 disponibles (emulators)

### Dispositivos Cliente (Tablets)

- [ ] Android tablets con navegador Chrome/Firefox
- [ ] Tablets conectadas a misma WiFi que laptop
- [ ] Puertos abiertos en firewall
- [ ] Resolver DNS local: `http://<LAPTOP_IP>:4173`

---

## 🔐 SEGURIDAD PRE-LAUNCH

### Datos Sensibles

- [x] PINs hasheados en Firestore ✅
- [x] .env.local en .gitignore ✅
- [x] firebase-admin-credentials.json no comprometidas
- [x] No credenciales en código
- [ ] ANTES DE PRODUCCIÓN: Revisar Console Chrome para logs sensibles

### Acceso y Autenticación

- [x] Device approval workflow implementado
- [ ] ANTES DE PRODUCCIÓN: Activar rate limiting en loginWithPin
- [ ] ANTES DE PRODUCCIÓN: Implementar lockout después de N intentos
- [x] Roles bien definidos (admin, mesero, cocina, bar, capitan, supervisor)

### Firestore Rules

- [ ] ⚠️ **CRÍTICO**: Desactivar desarrollo rules (`allow read, write: if request.auth != null`)
- [ ] ⚠️ **CRÍTICO**: Activar production rules (descomentar en firestore.rules)
- [ ] Validar cada colección tiene reglas específicas
- [ ] Notificaciones: Solo el usuario puede leer las suyas
- [ ] Productos: Lectura general, escritura solo admin

---

## 🧪 PRE-LAUNCH TESTING

### Test Local (Dev Server)

```bash
# Terminal 1: Emuladores
firebase emulators:start --import=emulator-data --export-on-exit

# Terminal 2: Dev server
npm run dev

# Esperar a que ambos estén listos
# Acceder a: http://localhost:5173
```

**Flujos a validar:**
- [ ] Login con PIN (usuario: capitan, pin: 2222)
- [ ] Crear orden (POS page)
- [ ] Ver orden en Cocina
- [ ] Marcar como lista
- [ ] Ver en Mesero
- [ ] Hacer pago
- [ ] Ver en Reports

### Test Production Build (Local)

```bash
npm run build
npm run preview -- --host --port 4173
```

**Desde otra máquina (or tablet simulator):**
- [ ] Acceder a: `http://<YOUR_IP>:4173`
- [ ] Todo funciona igual

### Test Emulators

```bash
lsof -ti:8080,9099,5001
# Debería mostrar 3 PIDs
```

---

## 🚀 DEPLOYMENT ONSITE

### Paso 1: Preparación

```bash
# En laptop restaurante
cd /path/to/TPV_solutions
git pull  # Asegurarse tener última versión
npm install
cd functions && npm install && cd ..
npm run build
```

### Paso 2: Iniciar Sistema

```bash
# Hacer ejecutable (si no lo está)
chmod +x scripts/start-production.sh

# Ejecutar script de producción
./scripts/start-production.sh
```

**Script hace:**
1. Build app si es necesario
2. Backup emulator data
3. Inicia Firebase Emulators
4. Inicia servidor web en puerto 4173
5. Muestra IP local y de red
6. Monitorea salud del sistema
7. Cleanup al Ctrl+C

### Paso 3: Tablets Conectan

1. Tablets en WiFi restaurante
2. Abrir Chrome/Firefox en tablet
3. Acceder: `http://<LAPTOP_IP>:4173`
4. Login con credenciales
5. Device approval: Admin aprueba desde tablet web

---

## 📊 VERIFICACIONES ONSITE

### Funcionalidad

- [ ] ✅ Login funciona
- [ ] ✅ POS puede crear órdenes
- [ ] ✅ Kitchen recibe notificaciones
- [ ] ✅ Cocina marca órdenes como listas
- [ ] ✅ Mesero ve órdenes listas
- [ ] ✅ Pago se procesa
- [ ] ✅ Reportes muestran datos
- [ ] ✅ Cierre de caja completo

### Performance

- [ ] ✅ Carga tablets rápido (<3 segundos)
- [ ] ✅ Crear orden responde inmediatamente
- [ ] ✅ Notificaciones en tiempo real
- [ ] ✅ No hay lag en Kitchen

### Conectividad

- [ ] ✅ WiFi estable
- [ ] ✅ Conexión laptop-tablet permanente
- [ ] ✅ Si cae red: modo offline funciona
- [ ] ✅ Recuperación automática cuando vuelve red

### Datos

- [ ] ✅ Órdenes se guardan correctamente
- [ ] ✅ Usuarios no ven datos de otros
- [ ] ✅ Reports muestran datos correctos
- [ ] ✅ Backup diario funciona

---

## 🛠️ TROUBLESHOOTING ONSITE

### Si el sistema no inicia

```bash
# Verificar puertos
lsof -ti:4173,8080,9099,5001

# Matar procesos viejos si es necesario
kill -9 <PID>

# Reintentar
./scripts/start-production.sh
```

### Si tablets no conectan

```bash
# Verificar IP
hostname -I

# Verificar que firewall permite conexiones (puerto 4173)
# En Ubuntu:
sudo ufw allow 4173

# Desde tablet, ping a laptop
ping <LAPTOP_IP>
```

### Si órdenes no llegan a cocina

1. Verificar en DevTools Console que no haya errores
2. Emuladores corriendo: `firebase emulators:start`
3. Cloud Functions compiladas
4. Verificar rol del usuario (debe ser cocina o admin)

### Si notificaciones no llegan

1. Navegador permite notificaciones (revisar permisos)
2. FCM funcionando en emulator
3. Usuario tiene push subscription

---

## 📱 CREDENCIALES TEST (Emulator)

```
👤 Admin
Username: admin
PIN: 1111

👨‍💼 Capitán (Mesero)
Username: capitan
PIN: 2222

👨‍🍳 Cocina
Username: cocina
PIN: 3333

🍹 Bar
Username: bar
PIN: 4444

👁️ Supervisor
Username: supervisor
PIN: 5555
```

---

## 🔒 POST-LAUNCH

### Día 1
- [ ] Monitorear logs para errores
- [ ] Validar datos se guardan
- [ ] Capacitar staff en uso del sistema
- [ ] Crear backup manual

### Semana 1
- [ ] Recolectar feedback de usuarios
- [ ] Validar reportes muestran datos correctos
- [ ] Verificar no hay datos perdidos
- [ ] Performance satisfactorio

### Mes 1
- [ ] Evaluación de costos de emulador
- [ ] Decidir si continuar con emulator o migrar a Firebase Cloud
- [ ] Análisis de ROI
- [ ] Plan de escalabilidad

---

## 📞 CONTACTO / SOPORTE

**Desarrollador:** Rick  
**Teléfono:** [+XX-XXX-XXXX]  
**Email:** [rick@example.com]

**Stack técnico:**
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Firebase Emulators (local) / Firebase Cloud (producción)
- Database: Firestore
- Auth: Custom PIN + Device Fingerprint
- Notifications: Firebase Cloud Messaging

**Repositorio:** [GitHub Link]

---

## ✨ PRÓXIMOS PASOS (Post-MVP)

- [ ] Migrar a Firebase Blaze Plan para escalabilidad
- [ ] Implementar CLIP payment integration
- [ ] MercadoPago webhook validation
- [ ] Advanced reporting y analytics
- [ ] Mobile app nativa
- [ ] Integración con PMS (hotel management)

---

**Status:** ✅ LISTO PARA DEPLOYMENT ONSITE  
**Última actualización:** 24 de enero 2026  
**Próxima revisión:** Después del launch

