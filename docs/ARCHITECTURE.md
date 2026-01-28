# Arquitectura del Proyecto - Reisbloc POS

## 🏗️ Visión General

Reisbloc POS es una aplicación de Punto de Venta moderna basada en:
- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Estado Global**: Zustand
- **UI**: Tailwind CSS + Lucide Icons

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  React App       │      │  Store (Zustand)│         │
│  ├──────────────────┤      └──────────────────┘         │
│  │ Components       │                                    │
│  │ ├─ Auth         │      ┌──────────────────┐         │
│  │ ├─ POS          │      │  Services        │         │
│  │ ├─ Admin        │      ├──────────────────┤         │
│  │ ├─ Reports      │      │ ├─ Device        │         │
│  │ └─ Kitchen      │      │ ├─ Clip          │         │
│  └──────────────────┘      │ ├─ Audit         │         │
│                            │ └─ Closing       │         │
│                            └──────────────────┘         │
└─────────────────────────────────────────────────────────┘
               ↓                    ↓
    ┌──────────────────┐  ┌──────────────────┐
    │  Supabase Auth   │  │   PostgreSQL DB  │
    └──────────────────┘  └──────────────────┘
               ↓                    ↓
    ┌──────────────────────────────────────┐
    │  Supabase Edge Functions & RLS       │
    └──────────────────────────────────────┘
```

## 📁 Estructura de Carpetas Detallada

```
reisbloc-pos/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPin.tsx           # Login con PIN
│   │   │   ├── DeviceVerification.tsx  # Verificación de dispositivo
│   │   │   └── DeviceManager.tsx       # Panel de gestión de dispositivos
│   │   │
│   │   ├── pos/
│   │   │   ├── POSInterface.tsx        # Interfaz principal POS
│   │   │   ├── TableSelector.tsx       # Selector de mesas
│   │   │   ├── OrderPanel.tsx          # Panel de orden
│   │   │   ├── PaymentModal.tsx        # Modal de pagos
│   │   │   └── Checkout.tsx            # Checkout con Clip
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx      # Dashboard admin
│   │   │   ├── ProductManager.tsx      # Gestión de productos
│   │   │   ├── UserManager.tsx         # Gestión de usuarios
│   │   │   ├── InventoryManager.tsx    # Control de inventario
│   │   │   └── DeviceApproval.tsx      # Aprobación de dispositivos
│   │   │
│   │   ├── reports/
│   │   │   ├── DailyClose.tsx          # Cierre del día
│   │   │   ├── TipDistribution.tsx     # Distribución de propinas
│   │   │   ├── EmployeeMetrics.tsx     # KPIs de empleados
│   │   │   ├── SalesChart.tsx          # Gráficas de ventas
│   │   │   └── AuditLog.tsx            # Visor de logs
│   │   │
│   │   ├── kitchen/
│   │   │   ├── KitchenDisplay.tsx      # Pantalla de cocina
│   │   │   └── OrderTicket.tsx         # Tickets de orden
│   │   │
│   │   └── common/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Loading.tsx
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── POS.tsx
│   │   ├── Admin.tsx
│   │   ├── Reports.tsx
│   │   ├── Kitchen.tsx
│   │   └── NotFound.tsx
│   │
│   ├── services/
│   │   ├── deviceService.ts            # Gestión de dispositivos
│   │   ├── clipService.ts              # Integración Clip
│   │   ├── auditService.ts             # Registro de auditoría
│   │   ├── closingService.ts           # Cálculo de cierre
│   │   └── supabaseService.ts          # Operaciones Supabase
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  # Hook de autenticación
│   │   ├── useDevice.ts                # Hook de dispositivo
│   │   ├── usePOS.ts                   # Hook de POS
│   │
│   ├── store/
│   │   └── appStore.ts                 # Store global Zustand
│   │
│   ├── types/
│   │   └── index.ts                    # TypeScript definitions
│   │
│   ├── config/
│   │   ├── supabase.ts                 # Configuración Supabase
│   │   └── constants.ts                # Constantes
│   │
│   ├── utils/
│   │   ├── validation.ts               # Validaciones
│   │   ├── formatting.ts               # Formato de datos
│   │   └── storage.ts                  # LocalStorage helpers
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.css
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── supabase/
│   ├── functions/                      # Edge Functions
│   ├── migrations/                     # SQL Migrations
│   └── config.toml
│
├── .env.local                          # Variables de entorno
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── README.md
```

## 🔄 Flujos Principales

### 1. Autenticación y Dispositivo

```
1. Usuario abre app
2. Obtener información del dispositivo
3. Mostrar pantalla de login
4. Usuario ingresa PIN
5. Validar PIN en Supabase (Edge Function)
6. Obtener/registrar dispositivo
7. Si dispositivo no aprobado → mostrar "Pendiente"
8. Si aprobado → ir a POS
```

### 2. Tomar Pedido (POS)

```
1. Mesero selecciona mesa
2. Agrega productos a la orden
3. Valida stock (si es inventario)
4. Muestra subtotal
5. Envía a cocina
6. Cocina marca como "Listo"
7. Mesero entrega
8. Cliente paga
9. Procesar pago (cash/digital/clip)
10. Actualizar inventario (PostgreSQL Trigger)
11. Registrar venta
12. Imprimir ticket
```

### 3. Cierre del Día

```
1. Admin accede a "Cierre de Caja"
2. Sistema obtiene todas las ventas del día
3. Calcula totales
4. Obtiene propinas
5. Calcula distribución equitativa
6. Muestra desglose por empleado
7. Permite ajustes
8. Admin confirma cierre
9. Genera reporte
10. Todos pueden ver sus propinas en Dashboard
```

### 4. Control de Dispositivos

```
1. Admin accede a "Dispositivos"
2. Ve lista de empleados
3. Expande empleado
4. Ve dispositivos registrados
5. Puede:
   - Aprobar/rechazar nuevos
   - Revocar acceso
   - Ver historial de acceso
6. Cambios se registran en auditoría
```

## 🗄️ Estructura de Base de Datos (PostgreSQL)

### Tablas Principales

```
public/
├── users/
│   ├── user_1
│   │   ├── username: string
│   │   ├── pin: string (hasheado)
│   │   ├── role: 'admin'|'capitan'|'cocina'|'bar'|'supervisor'
│   │   ├── active: boolean
│   │   ├── devices: [device_id1, device_id2]
│   │   └── createdAt: timestamp
│   └── user_2
│       └── ...
│
├── devices/
│   ├── device_1
│   │   ├── userId: string
│   │   ├── macAddress: string
│   │   ├── deviceName: string
│   │   ├── network: 'wifi'|'mobile'
│   │   ├── os: string
│   │   ├── browser: string
│   │   ├── registeredAt: timestamp
│   │   ├── lastAccess: timestamp
│   │   └── isApproved: boolean
│   └── device_2
│       └── ...
│
├── products/
│   ├── product_1
│   │   ├── name: string
│   │   ├── price: number
│   │   ├── category: string
│   │   ├── hasInventory: boolean
│   │   ├── currentStock: number (opcional)
│   │   ├── minimumStock: number (opcional)
│   │   ├── active: boolean
│   │   └── createdAt: timestamp
│   └── product_2
│       └── ...
│
├── orders/
│   ├── order_1
│   │   ├── tableNumber: number
│   │   ├── items: [...]
│   │   ├── status: 'open'|'sent'|'ready'|'served'|'completed'
│   │   ├── createdAt: timestamp
│   │   └── createdBy: userId
│   └── order_2
│       └── ...
│
├── sales/
│   ├── sale_1
│   │   ├── orderIds: [order_id1, order_id2]
│   │   ├── items: [...]
│   │   ├── subtotal: number
│   │   ├── tax: number
│   │   ├── total: number
│   │   ├── paymentMethod: 'cash'|'digital'|'clip'
│   │   ├── tip: number
│   │   ├── saleBy: userId
│   │   ├── createdAt: timestamp
│   │   └── clipTransactionId: string (opcional)
│   └── sale_2
│       └── ...
│
├── daily_closes/
│   ├── close_20260121
│   │   ├── date: timestamp
│   │   ├── closedBy: userId
│   │   ├── totalSales: number
│   │   ├── totalCash: number
│   │   ├── totalDigital: number
│   │   ├── totalTips: number
│   │   ├── tipsDistribution: [...]
│   │   ├── adjustments: [...]
│   │   └── closedAt: timestamp
│   └── close_20260120
│       └── ...
│
└── audit_logs/
    ├── audit_1
    │   ├── userId: userId
    │   ├── action: string
    │   ├── entityType: string
    │   ├── entityId: string
    │   ├── timestamp: timestamp
    │   ├── ipAddress: string
    │   └── deviceId: deviceId
    └── audit_2
        └── ...
```

## 🔐 Seguridad (RLS Policies)

```typescript
// Ejemplo de RLS para ventas
CREATE POLICY "Vendedores pueden ver sus propias ventas"
  ON sales FOR SELECT
  USING (auth.uid() = sale_by);

-- Políticas de RLS en PostgreSQL
CREATE POLICY "Admins tienen acceso total"
  ON public.users
  FOR ALL
  USING ( auth.jwt() ->> 'role' = 'admin' );

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.users
  FOR SELECT
  USING ( auth.uid() = id );
```

## 🚀 Flujo de Datos

### Redux/Zustand Flow

```
User Action
    ↓
Component → Store Update
    ↓
Supabase Update (PostgreSQL)
    ↓
Realtime Listener (Supabase)
    ↓
Store Update
    ↓
Component Re-render
```

## 🧪 Testing

### Estructura de Tests

```
tests/
├── unit/
│   ├── services/
│   │   ├── deviceService.test.ts
│   │   ├── clipService.test.ts
│   │   └── closingService.test.ts
│   └── utils/
│       ├── validation.test.ts
│       └── formatting.test.ts
│
├── integration/
│   ├── auth.test.ts
│   ├── pos.test.ts
│   └── payments.test.ts
│
└── e2e/
    ├── login.spec.ts
    ├── order.spec.ts
    └── closing.spec.ts
```

## 📈 Performance

### Optimizaciones

- Lazy loading de componentes
- Virtualización de listas largas
- Caché de Firestore
- Optimización de imágenes
- Code splitting por rutas

## 🔄 CI/CD

```
Push a GitHub
    ↓
GitHub Actions
    ├─ Run Tests
    ├─ Lint Code
    └─ Build
    ↓
Deploy a Producción
    ├─ Frontend (Vercel/Netlify)
    ├─ Edge Functions (Supabase)
    └─ Database (PostgreSQL)
```

---

**Última actualización**: 21 de enero de 2026
