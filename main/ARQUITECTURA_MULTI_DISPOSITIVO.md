# 📱 Arquitectura Multi-Dispositivo TPV

**Fecha:** 25 de Enero 2026  
**Estado:** En Desarrollo - PWA + Capacitor para Terminales Android

---

## 🎯 Visión General

Sistema POS modular que corre en:
- ✅ **Web** (navegador): Mesero, Admin, Supervisor, Reportes
- ✅ **TVs** (cualquier navegador): Dashboard cocina/bar (tiempo real)
- 🔄 **Terminales Android** (APK): P8 AI POS + otra (pagos integrados + impresora térmica)

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología | Detalle |
|------|-----------|--------|
| Frontend | React 18 + TypeScript | Código compartido web/móvil |
| Build | Vite | Bundling rápido, PWA plugins |
| Cross-plat | Capacitor | Convierte web→APK nativo sin reescribir |
| Impresión | printService | window.print (web) + USB plugin (Android) |
| Backend | Firebase + Cloud Functions | Realtime sync, auth, pagos |
| Estado | Zustand | App store centralizado |
| Estilos | Tailwind CSS | Responsive design |

---

## 📦 Componentes Implementados

### 1. **Impresión de Tickets** ✅
- **ReceiptTicket.tsx**: Comprobante para comensal
  - Detalle de productos agrupados por categoría
  - Subtotal + propina sugerida (15% default)
  - Formato 58mm (impresora térmica)
  - Auto-print o botón manual

- **KitchenTicket.tsx**: Comanda para cocina/bar
  - Filtra items por destino (Comida vs Bebidas)
  - Hora de preparación
  - Notas especiales

- **printService.ts**: Gestor central
  ```typescript
  printService.printHTML(htmlContent)           // Web
  printService.printToUSBThermal(htmlContent)   // Android USB
  printService.checkUSBPrinterAvailable()       // Detecta impresora
  ```

### 2. **Dashboard TV Cocina/Bar** ✅
- **KitchenDashboard.tsx** (`/kitchen-dashboard`)
  - Vista en tiempo real de órdenes
  - Tabs: Preparación (🔥) | Listas (✓) | Completadas
  - Botones: "Listo para Servir" → "Completada"
  - Acceso: roles `admin`, `capitan`, `cocina`, `bar`
  - **Uso**: Abre en TV pantalla completa
    ```bash
    http://192.168.1.69:4173/kitchen-dashboard
    ```

### 3. **MercadoPago** ✅
- **mercadopagoService.ts**: Ya integrado
  - `createPaymentPreference()`: genera link de pago
  - `getPaymentStatus()`: verifica pagos confirmados
  - Soporta Clip + Mercado Libre Direct
  - Webhook: `/api/mercadopago/webhook`

### 4. **Consolidación de Mesas** ✅
- Al pagar una orden, se marca como `status: 'completed'`
- La mesa se consolida automáticamente (no queda dividida)
- Ver: [src/pages/POS.tsx#L268](../src/pages/POS.tsx#L268) `handlePaymentComplete()`

---

## 🚀 Próximos Pasos

### **Fase 1: PWA (30 min)**
Hacer web app instalable en dispositivos:
```bash
npm run build
# Agregar a manifest.json:
# - name, icons, display: 'fullscreen'
# - install shortcuts
```

### **Fase 2: Capacitor (1.5 horas)**
Convertir web→APK nativo:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init TPV pos-tpvsolutions
npx cap add android
npx cap copy android
npx cap open android
# → Build APK en Android Studio
```

### **Fase 3: Impresora Térmica Plugin (2 horas)**
Plugin USB custom para Android:
```typescript
// Pseudocódigo
class CapacitorUSBPrinter extends Plugin {
  async print(options: PrintOptions) {
    const usbManager = getSystemService(USB_SERVICE)
    const device = usbManager.findDevice(VID, PID) // P8 AI printer
    // Enviar bytes ESC/POS a puerto USB
  }
}
```

### **Fase 4: Integración Pagos (1 hora)**
- Clip SDK nativo para P8 AI POS
- Mercado Libre SDK para otra terminal
- Guardar transactionId en order documento

---

## 📋 Rutas Principales

| Ruta | Rol | Dispositivo | Función |
|------|-----|-----------|---------|
| `/login` | Todos | Cualquiera | Autenticación |
| `/pos` | mesero | Mobile/Web | Tomar pedidos |
| `/kitchen` | cocina | Tablet/Web | Recibir órdenes |
| `/bar` | bar | Tablet/Web | Bebidas |
| `/kitchen-dashboard` | admin/cocina/bar | TV | Dashboard tiempo real |
| `/ready` | mesero | Mobile/Web | Órdenes listas |
| `/admin` | admin | Web/Desktop | Gestión |
| `/reports` | admin/supervisor | Web/Desktop | Reportes |

---

## 🎨 UI Responsive

**Desktop (XL)**:
- 2 columnas: Mesas + Productos
- Vista completa

**Tablet/Mobile (< XL)**:
- Tabs: Orden | Productos
- Optimizado para tacto

**TV (Fullscreen)**:
- Grid de tarjetas grandes
- Colores contrastantes
- Texto legible a distancia

---

## 🔒 Seguridad Multi-Dispositivo

1. **Auth Device**: Cada dispositivo debe estar aprobado
2. **RBAC**: Roles determinan rutas accesibles
3. **Offline**: IndexedDB copia datos para operación sin internet
4. **Firestore Rules**: Limitan acceso por rol

---

## 📊 Flujo de Datos Impresión

```
Usuario paga orden
    ↓
handlePaymentComplete() en POS.tsx
    ↓
1. Registra venta en Firestore
2. Marca orden como "completed"
3. Limpia carrito
    ↓
[OPCIONAL] Llamar printService:
    ↓
┌─────────────────┬──────────────────┐
│ WEB/NAVEGADOR   │ ANDROID NATIVO   │
│ window.print()  │ USB Plugin       │
│ Formato 58mm    │ Térmica directa  │
│ Dialog sistema  │ Sin diálogo      │
└─────────────────┴──────────────────┘
```

---

## 🛠️ Desarrollo Local

### Start DEV (web)
```bash
npm run dev
# http://localhost:5173
```

### Preview (simula build)
```bash
npm run build
npm run preview
# http://localhost:4173
```

### Test en TV local
```bash
VITE_USE_EMULATORS=true npm run preview -- --host
# http://192.168.1.69:4173/kitchen-dashboard
```

### Build APK (después Capacitor)
```bash
npm run build
npx cap sync
npx cap open android
# → Build en Android Studio
```

---

## 📝 Notas Importantes

- **Impresoras Térmicas**: P8 AI POS y otra terminal envían especificaciones en 1 hora aprox.
- **Plugin USB**: Se desarrolla una vez se tengan las terminales reales
- **MercadoPago**: Ya está integrado; falta webhook de confirmación
- **Clip**: Requiere SDK específico para terminal (cuando llegue P8)
- **Mercado Libre Direct**: Usar credenciales del restaurante

---

## ✅ Checklist Pre-Deploy

- [ ] PWA: `manifest.json` completo, service worker funcional
- [ ] Capacitor: `capacitor.config.ts` configurado
- [ ] APK buildeable sin errores
- [ ] Impresora térmica plugin testeado
- [ ] MercadoPago webhook activo
- [ ] Dashboard TV sin lag con 10+ órdenes
- [ ] Offline fallback para órdenes
- [ ] Tests en P8 AI + otra terminal
