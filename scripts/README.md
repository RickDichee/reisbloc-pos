# 🛠️ Scripts - Reisbloc POS

Scripts útiles para desarrollo, configuración y mantenimiento.

## 📦 Setup Inicial

```bash
# Configurar proyecto completo
./setup.sh

# Configurar solo MercadoPago
./setup-mercadopago.sh
```

## 🚀 Desarrollo

```bash
# Iniciar desarrollo (Vite + Emuladores)
./start-dev.sh

# Solo emuladores
./start-emulators.sh
```

## 👥 Gestión de Usuarios

```bash
# Crear usuarios iniciales
node create-users.mjs

# Arreglar PINs sin hashear
node fix-unhashed-pins.js

# Aprobar dispositivos pendientes
node approve-pending-devices.js
```

## 📦 Gestión de Datos

```bash
# Seed completo de emuladores
node seed-emulators.js

# Seed rápido (productos básicos)
node quick-seed.js

# Crear solo productos
node create-products.mjs

# Limpiar productos duplicados
node clean-products.js

# Verificar datos en emulador
node verify-data.js
```

## ✅ Verificación

```bash
# Verificar setup completo
./verify-setup.sh

# Test de notificaciones
./test-notifications.sh
```

## 📝 Notas

- Todos los scripts `.sh` necesitan permisos de ejecución: `chmod +x script.sh`
- Los scripts de Node asumen que los emuladores están corriendo
- Para producción, usar los scripts con `-production` en el nombre

---

**Volver al**: [README principal](../README.md)
