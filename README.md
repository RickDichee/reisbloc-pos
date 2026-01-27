
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![MercadoPago](https://img.shields.io/badge/payments-MercadoPago-00b1ea)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)

**Sistema de Punto de Venta Profesional para Restaurantes** 🚀

---

## 🎯 Visión del Proyecto

**Reisbloc POS nació de una realidad simple: los restaurantes merecen herramientas profesionales accesibles.**

Entendemos que:

- 🏪 **Desde el taquero** hasta la cadena de restaurantes merece buena tecnología
- 💡 **La innovación no debe ser cara** ni complicada
- 🤝 **El éxito es compartido**, no vendiendo licencias caras
- 🌱 **Si tu negocio crece, nosotros crecemos contigo**

### ¿Por qué creamos esto?

Porque existe un problema real en el mercado: sistemas POS que:
- ❌ Requieren internet constante
- ❌ Cobran por cada dispositivo adicional
- ❌ Venden tus datos a terceros
- ❌ Desaparecen cuando los necesitas
- ❌ No se adaptan a tu negocio

**Reisbloc POS ofrece:**
- ✅ **Offline-first** → Tu negocio funciona sin internet
- ✅ **Usa lo que tienes** → Tablets viejas, celulares, laptops
- ✅ **Privacidad garantizada** → Tus datos SOLO son tuyos
- ✅ **Código abierto** → Transparencia total bajo AGPL-3.0
- ✅ **Escalable** → De 1 caja a múltiples sucursales

### Nuestra Promesa
```
✅ Libre para siempre
✅ Fácil de usar
✅ Seguro y confiable
✅ Completamente personalizable
✅ Soporte dedicado
```

---

## 🚀 Sobre Reisbloc POS

**Reisbloc POS** es un sistema de Punto de Venta (POS) moderno, seguro y confiable diseñado específicamente para restaurantes que buscan:

- **Simplicidad operativa** → Cualquiera puede usarlo sin entrenamiento
- **Máxima confiabilidad** → Funciona aunque falle todo lo demás
- **Control total** → Tus datos, tu servidor, tus reglas
- **Adaptabilidad** → Escalas cuando lo necesitas

### Características Principales

- 🔒 **Sistema de seguridad de dispositivos** → Acceso restringido por MAC
- 💰 **Gestión completa de pagos** → MercadoPago integrado
- 📊 **Transparencia de propinas** → División equitativa automática
- 📈 **KPIs individuales** → Métricas de desempeño por empleado
- 🔐 **Auditoría exhaustiva** → Registro de todas las transacciones
- 🌐 **Offline-first** → Funciona sin internet
- 📱 **PWA + Capacitor** → Web, Android e iOS desde un mismo código

---

## 💎 Características Destacadas

### 🎨 Experiencia de Usuario Premium
- Interfaz moderna con gradientes y animaciones
- Diseño responsivo para cualquier dispositivo
- Navegación intuitiva sin curva de aprendizaje
- Accesibilidad incorporada desde el inicio
- Temas personalizables

### 🔐 Seguridad Enterprise-Grade
- Autenticación con PIN de 4 dígitos
- Validación de dispositivo por MAC address
- Sesiones con expiración automática
- Logs completos de auditoría
- Encriptación de datos sensibles
- Zero knowledge architecture

### 📊 Gestión Integral
- **Inventario** → Control de stock en tiempo real
- **Ventas** → Registro detallado por producto y categoría
- **Empleados** → Métricas de desempeño y propinas
- **Reportes** → Análisis completos y exportación
- **Multi-caja** → Gestión de múltiples puntos de venta
- **Cortes diarios** → Reconciliación automática

### 💳 Pagos Seguros
- Integración MercadoPago
- Múltiples métodos (efectivo, tarjeta, digital)
- Propinas automatizadas
- Webhooks para confirmaciones
- Transacciones encriptadas

---

## 🛠️ Stack Tecnológico


## 📊 Estado del Proyecto

| Funcionalidad | Estado | Target |
|---|---|---|
| ✅ Sistema POS Base | **Production** | Q1 2026 |
| ✅ MercadoPago API | **Production** | Q1 2026 |
| ✅ Seguridad de Dispositivos | **Production** | Q1 2026 |
| ✅ Auditoría & Logs | **Production** | Q1 2026 |
| 🔄 **Offline-Ready** | **In Progress** | Q2 2026 |
| 🔄 **PWA Completo** | **In Progress** | Q2 2026 |
| 🔄 Sincronización Local | **In Progress** | Q2 2026 |
| ⏳ Android APK (Capacitor) | **Planned** | Q2 2026 |
| ⏳ iOS App (Capacitor) | **Planned** | Q3 2026 |
| ⏳ Facturación SAT México | **Planned** | Q2 2026 |
| ⏳ Dashboard Multi-Restaurante | **Planned** | Q2 2026 |

### 🟢 Listo para Producción (Q1 2026)
- Sistema POS completo y funcional
- Integración MercadoPago (pagos con tarjeta)
- Gestión de usuarios y dispositivos
- Auditoría exhaustiva
- Reportes básicos

### 🟡 En Desarrollo (Q2 2026)
- **Offline-Ready:** Sincronización automática de datos
- **PWA:** Instalación en home como app nativa
- **Capacitor Android:** APK distribuible
- Sistema de caché inteligente
- Manejo de conflictos de sincronización

### 🔴 Planeado (Q3-Q4 2026)
- App iOS nativa
- Integración con plataformas delivery (Uber Eats, Rappi)
- Facturación electrónica (SAT)
- Machine Learning para predicciones
- Multi-tenancy avanzado

---

## 🛠️ Stack Técnico Actual

### Frontend ✅
- **React 18** + TypeScript
- **Vite** - Build ultra-rápido
- **Tailwind CSS** - Estilos responsivos
- **Zustand** - Estado global minimalista
- **React Router v6** - Navegación moderna
- **Lucide React** - Iconos SVG
- **Chart.js** - Gráficas y reportes

### Backend ✅
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Functions** - Cloud functions serverless
- **Firebase Authentication** - Autenticación segura
- **Firebase Storage** - Almacenamiento de archivos

### Pagos ✅
- **MercadoPago API** - Procesamiento de pagos
- **Webhooks** - Confirmación automática

### En Desarrollo 🔄
- **Service Workers** - Cache para offline
- **IndexedDB** - Base de datos local
- **Capacitor** - Wrapper para Android/iOS

---
## 📁 Estructura del Proyecto
```
reisbloc-pos/
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
│   ├── VISION.md           # Filosofía y roadmap
│   ├── ARCHITECTURE.md     # Arquitectura técnica
│   ├── SECURITY.md         # Seguridad y dispositivos
│   ├── QUICK_START.md      # Guía de inicio rápido
│   ├── CONTRIBUTING.md     # Guía de contribución
│   └── setup/              # Guías de configuración
├── scripts/                # 🛠️ Scripts útiles
│   ├── start-production.sh # Iniciar sistema completo
│   ├── setup.sh            # Setup inicial
│   ├── seed-emulators.js   # Datos de prueba
│   └── README.md           # Guía de scripts
├── public/                 # Assets estáticos
├── LICENSE                 # AGPL-3.0
└── package.json            # Dependencias
```

---

## 🎨 Experiencia de Usuario

### Diseño Moderno
- ✨ **Gradientes vibrantes** en botones y cards
- 🎭 **Animaciones suaves** (fadeIn, slideIn, scaleIn)
- 💎 **Efectos glassmorphism** en componentes
- 🌈 **Colores por categoría** en productos
- 📱 **Diseño responsivo** optimizado para tablets

### Componentes Inteligentes
- **ProductGrid** → Cards atractivas con gradientes por categoría
- **OrderPanel** → Controles de cantidad modernos con iconos
- **CartSummary** → Totales con gradientes y alertas visuales
- **PaymentPanel** → Interfaz de pago completa con MercadoPago
- **ReportsHub** → Dashboard con métricas en tiempo real

---

## 🔐 Seguridad y Privacidad

### Sistema de Dispositivos
- ✅ Registro automático de MAC address
- ✅ Detección de red (WiFi/Móvil)
- ✅ Nombre del dispositivo
- ✅ Restricción de acceso por dispositivo
- ✅ Validación de acceso restringido

### Autenticación Mejorada
- 🔑 PIN de 4 dígitos
- 🔑 Validación de dispositivo registrado
- 🔑 Sesiones con expiración
- 🔑 Logs de login/logout

### Auditoría Completa
- 📝 Registro de todas las transacciones
- 📝 Logs de cambios en productos/usuarios
- 📝 Trazabilidad de modificaciones (5 minutos)
- 📝 Identificación de usuario en cada acción

**Compromiso:** Tus datos NUNCA salen de tu infraestructura. Sin excepciones.

---

## 💳 Integración MercadoPago

- ✅ **API de MercadoPago** → Procesamiento de pagos con tarjeta
- ✅ **Múltiples métodos** → Efectivo, Tarjeta, Digital
- ✅ **Propinas integradas** → Sistema de propinas personalizable
- ✅ **Webhooks** → Confirmación automática de pagos
- ✅ **Seguridad** → Tokens y encriptación

Ver documentación completa: [docs/MERCADOPAGO_INTEGRATION.md](./docs/MERCADOPAGO_INTEGRATION.md)

---

## 💵 Gestión de Propinas Transparente
```
Porque la transparencia genera confianza
```

- ✅ **División equitativa** → Cálculo automático entre equipo
- ✅ **Transparencia total** → Todos ven cuánto generó cada quien
- ✅ **Porcentajes rápidos** → 0%, 10%, 15%, 20%
- ✅ **Propina personalizada** → Ingreso manual de monto
- ✅ **Corte del día** → Acceso a todos los usuarios
- ✅ **Ajustes manuales** → Solo admin puede modificar
- ✅ **KPIs individuales** → Propinas generadas por persona

---

## 🚀 Quick Start

### Instalación Rápida (5 minutos)
```bash
# 1. Clonar el repositorio
git clone https://github.com/reisbloc-lab/reisbloc-pos.git
cd reisbloc-pos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar desarrollo
npm run dev
```

### Producción Onsite (Sin Internet)
```bash
# Script todo-en-uno para restaurante
./scripts/start-production.sh

# Acceso:
# - Laptop: http://localhost:4173
# - Tablets: http://TU_IP:4173
```

Ver guías detalladas: [docs/QUICK_START.md](./docs/QUICK_START.md)

---

## 📚 Documentación

- **[VISION.md](./docs/VISION.md)** → Filosofía, roadmap y futuro
- **[QUICK_START.md](./docs/QUICK_START.md)** → Inicio rápido paso a paso
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** → Arquitectura técnica
- **[SECURITY.md](./docs/SECURITY.md)** → Seguridad y dispositivos
- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** → Cómo contribuir
- **[setup/](./docs/setup/)** → Guías de configuración específicas

---

## 🤝 Contribuciones

**¡Las contribuciones son bienvenidas!**

Este proyecto mejora gracias a la comunidad. Si tienes ideas, bugs, o quieres agregar features:

1. 🍴 Fork el proyecto
2. 🔨 Crea una rama (`git checkout -b feature/MiFeature`)
3. ✍️ Commit tus cambios (`git commit -m 'feat: Agregar MiFeature'`)
4. 📤 Push a la rama (`git push origin feature/MiFeature`)
5. 🎉 Abre un Pull Request

Lee nuestra [Guía de Contribución](./docs/CONTRIBUTING.md) para más detalles.

---

## 📄 Licencia

Este proyecto está bajo la **Licencia AGPL-3.0**.

### ¿Qué significa esto?

- ✅ **Libre de usar** en tu restaurante/negocio (gratis forever)
- ✅ **Puedes modificar** el código para tus necesidades
- ✅ **Puedes distribuir** copias modificadas
- ⚠️ **Si ofreces como servicio** (SaaS/hosting), DEBES compartir el código fuente
- ⚠️ **Modificaciones deben ser AGPL-3.0** también

### ¿Por qué AGPL?

Porque creemos que el software que ayuda a pequeños negocios debe ser **libre y transparente**. Si alguien mejora Reisbloc POS, esas mejoras deben beneficiar a toda la comunidad.

Para licencias comerciales alternativas (si necesitas modificar sin compartir código), contacta: **[email protected]**

---

## 💬 Comunidad y Soporte

- 🐛 **Reportar bugs:** [GitHub Issues](https://github.com/reisbloc-lab/reisbloc-pos/issues)
- 💡 **Solicitar features:** [GitHub Discussions](https://github.com/reisbloc-lab/reisbloc-pos/discussions)
- 💬 **Chat:** [Discord de Reisbloc Lab](#) (próximamente)
- 📧 **Email:** [email protected]
- 🐦 **Twitter:** [@reisbloc_lab](#)

---

## 🗺️ Roadmap

### Q1 2026 (Actual)
- ✅ Sistema POS base funcional
- ✅ Integración MercadoPago
- ✅ Sistema de propinas transparente
- 🔄 Migración a Supabase (en progreso)
- 🔄 PWA + Capacitor Android (en progreso)

### Q2 2026
- 📱 App nativa Android (APK)
- 🖨️ Integración impresoras térmicas
- 📊 Dashboard multi-restaurante
- 🧾 Facturación electrónica (SAT México)

### Q3-Q4 2026
- 🍎 App iOS (si hay demanda)
- 🚚 Integración Uber Eats/Rappi
- 🌐 Multi-idioma (inglés)
- 🤖 Features con IA (recomendaciones, predicciones)

Ver roadmap completo: [docs/VISION.md](./docs/VISION.md)

---

## 👨‍💻 Equipo

**Reisbloc Lab** - Desarrollando soluciones reales para negocios reales

- 🌎 **Basados en:** Playa del Carmen, México 🇲🇽
- 🎯 **Misión:** Democratizar tecnología empresarial de calidad
- 💡 **Filosofía:** Open source, win-win, sin bullshit

---

## 🙏 Agradecimientos

A todos los restauranteros que confiaron en un POS "hecho en casa". Este software existe por ustedes y para ustedes.

---

**Versión:** 2.0.0  
**Última actualización:** Enero 2026  
**Estado:** ✅ Producción activa

**Hecho con ❤️ en México**

---

> *"La mejor tecnología es la que funciona cuando más la necesitas. Sin excepciones, sin pretextos."*  
> — Reisbloc Lab