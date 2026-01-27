# TPV Solutions - POS Restaurante Profesional 🍽️

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![MercadoPago](https://img.shields.io/badge/payments-MercadoPago-00b1ea)

## 🚀 Descripción

Sistema de Punto de Venta (POS) profesional para restaurantes con diseño moderno y características avanzadas:
- 🔒 **Seguridad de dispositivos** - Registro y restricción de acceso por MAC/dispositivo
- 💰 **Gestión de pagos** - Integración con **MercadoPago** para pagos digitales
- 📊 **Transparencia total** - Cortes de caja con división equitativa de propinas
- 📈 **KPIs individuales** - Métricas y registros de ventas por empleado
- 🔐 **Auditoría completa** - Logs de todos los movimientos y cambios
- 🎨 **UI Moderna** - Diseño inspirado en vikingosPOS con gradientes y animaciones

## ⚙️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Backend**: Firebase (Firestore + Functions)
- **Estilos**: Tailwind CSS (con gradientes personalizados)
- **Iconos**: Lucide React
- **Gráficas**: Chart.js
- **Estado**: Zustand
- **Routing**: React Router
- **Pagos**: MercadoPago API

## 📁 Estructura del Proyecto

```
TPV_solutions/
├── src/                    # Código fuente
│   ├── components/         # Componentes React
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios (Firebase, MercadoPago)
│   ├── hooks/              # Hooks personalizados
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   └── styles/             # Estilos globales
├── functions/              # Cloud Functions
├── docs/                   # 📚 Documentación completa
│   ├── ARCHITECTURE.md     # Arquitectura técnica
│   ├── SECURITY.md         # Seguridad y dispositivos
│   ├── QUICK_START.md      # Guía de inicio rápido
│   ├── TROUBLESHOOTING.md  # Solución de problemas
│   ├── setup/              # Guías de configuración
│   └── archive/            # Docs obsoletas
├── scripts/                # 🛠️ Scripts útiles
│   ├── start-production.sh # Iniciar sistema completo
│   ├── setup.sh            # Setup inicial
│   ├── seed-emulators.js   # Datos de prueba
│   └── README.md           # Guía de scripts
├── public/                 # Assets estáticos
├── firebase.json           # Configuración Firebase
├── firestore.rules         # Reglas de seguridad
└── package.json            # Dependencias
```

Ver estructura completa: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 🎨 Características de UI/UX

### Diseño Moderno
- ✨ **Gradientes vibrantes** en botones y cards
- 🎭 **Animaciones suaves** (fadeIn, slideIn, scaleIn)
- 💎 **Efectos glassmorphism** en componentes
- 🌈 **Colores por categoría** en productos
- 📱 **Diseño responsivo** optimizado

### Componentes Rediseñados
- **ProductGrid**: Cards atractivas con gradientes por categoría
- **OrderPanel**: Controles de cantidad modernos con iconos
- **CartSummary**: Totales con gradientes y alertas visuales
- **PaymentPanel**: Interfaz de pago completa con MercadoPago

## 🔐 Características de Seguridad

### 1. Sistema de Dispositivos
- Registro automático de MAC address
- Detección de red (WiFi/Móvil)
- Nombre del dispositivo
- Restricción de acceso por dispositivo
- Validación de acceso restringido

### 2. Autenticación Mejorada
- PIN de 4 dígitos
- Validación de dispositivo registrado
- Sesiones con expiración
- Logs de login/logout

### 3. Auditoría Completa
- Registro de todas las transacciones
- Logs de cambios en productos/usuarios
- Trazabilidad de modificaciones (5 minutos)
- Identificación de usuario en cada acción

## 💳 Integración MercadoPago

> **Nueva integración**: Reemplaza la anterior integración con Clip

- **API de MercadoPago**: Procesamiento de pagos con tarjeta
- **Múltiples métodos**: Efectivo, Tarjeta, Digital
- **Propinas integradas**: Sistema de propinas personalizable
- **Webhooks**: Confirmación automática de pagos
- **Seguridad**: Tokens y encriptación

Ver documentación completa: [MERCADOPAGO_INTEGRATION.md](./MERCADOPAGO_INTEGRATION.md)

## 💵 Gestión de Propinas

- **División equitativa**: Cálculo automático
- **Transparencia total**: Visualización de propinas por empleado
- **Porcentajes rápidos**: 0%, 10%, 15%, 20%
- **Propina personalizada**: Ingreso manual de monto
- **Corte del día**: Acceso a todos los usuarios
- **Ajustes manuales**: Solo admin puede modificar
- **KPIs individuales**: Propinas generadas por cada persona

## 📊 Reportes y KPIs

- Ventas por empleado
- Propinas generadas
- Productos más vendidos
- Tendencias de venta
- Performance individual

## 🚀 Quick Start

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales Firebase

# 3. Iniciar emuladores y desarrollo
./scripts/start-dev.sh
```

### Producción Onsite (Sin Internet)

```bash
# Script todo-en-uno para restaurante
./scripts/start-production.sh

# Acceso:
# - Laptop: http://localhost:4173
# - Tablets: http://TU_IP:4173
```

Ver guías detalladas en [docs/](./docs/)

## 📚 Documentación

- **[docs/QUICK_START.md](./docs/QUICK_START.md)** - Inicio rápido paso a paso
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitectura técnica
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Seguridad y dispositivos
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Solución de problemas
- **[docs/setup/](./docs/setup/)** - Guías de configuración específicas
- **[scripts/README.md](./scripts/README.md)** - Guía de scripts disponibles

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia **AGPL-3.0**.

Esto significa:
- ✅ **Libre de usar** en tu restaurante/negocio
- ✅ **Puedes modificar** el código para tus necesidades
- ✅ **Puedes distribuir** copias modificadas
- ⚠️ **Si ofreces el software como servicio** (SaaS/hosting), DEBES compartir el código fuente
- ⚠️ **Modificaciones deben ser AGPL-3.0** también

Para licencias comerciales alternativas, contacta: hunab.arredondo@gmail.com

## 👨‍💻 Autor

TPV Solutions - Sistema POS Profesional para Restaurantes

---

**Versión**: 2.0.0  
**Última actualización**: 24 de enero de 2026  
**Estado**: ✅ Listo para producción onsite
