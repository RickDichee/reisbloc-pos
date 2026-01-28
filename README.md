# Reisbloc POS - Professional Edition 🍽️

![License](https://img.shields.io/badge/license-AGPL--3.0-purple)
![MercadoPago](https://img.shields.io/badge/payments-MercadoPago-00b1ea)
![Made in Mexico](https://img.shields.io/badge/hecho_en-México_🇲🇽-green)

**Desarrollado por [Reisbloc Lab](https://reisbloc.com)** 🚀

---

## 🎯 Visión del Proyecto

**Reisbloc POS nació de una realidad simple: si a tu negocio le va bien, a nosotros también nos va bien.**

No somos una corporación vendiendo licencias caras. Somos desarrolladores que entienden que:

- 🏪 **El taquero de la esquina** merece la misma tecnología que una cadena de restaurantes
- 💡 **La innovación no debe ser exclusiva** de quien tenga presupuesto millonario
- 🤝 **El éxito se construye juntos**, no vendiendo software y desapareciendo
- 🌱 **Tu crecimiento es nuestro crecimiento**

### ¿Por qué creamos esto?

Porque vimos restaurantes pagando **$500-2,000 USD/mes** por sistemas que:
- ❌ No funcionan sin internet
- ❌ Cobran por cada dispositivo adicional
- ❌ Obligan a usar su hardware específico
- ❌ Venden tus datos de ventas a terceros
- ❌ Desaparecen cuando los necesitas

**Nosotros hacemos lo contrario:**
- ✅ **Funciona offline-first** → El internet falla, tu negocio no
- ✅ **Usa lo que ya tienes** → Tablets viejas, celulares, lo que sea
- ✅ **Tus datos son TUYOS** → Privacidad total, cero venta de información
- ✅ **Código abierto** → Puedes ver exactamente qué hace el software
- ✅ **Escalas cuando quieras** → De 1 caja a 50 sucursales

### Nuestra Filosofía: Win-Win Real
```
Tu negocio crece → Necesitas más features
     ↓
Nosotros las desarrollamos
     ↓
Todos nuestros clientes se benefician
     ↓
La comunidad open-source también
     ↓
El ecosistema completo mejora
```

No es filantropía. Es un modelo de negocio donde **literalmente nos conviene que te vaya bien**.

---

## 🚀 Sobre el Proyecto

Reisbloc POS es un sistema de Punto de Venta profesional enfocado en la **usabilidad** y la **eficiencia de recursos**. Basado en la arquitectura de bloques de **Reisbloc Lab**, este software permite una integración fluida con diversas infraestructuras digitales.

### Características Clave

* 🎨 **Interfaz Intuitiva** → Diseñada para ser operada por cualquier usuario sin curva de aprendizaje
* 🔧 **Adaptabilidad de Infraestructura** → Optimizado para funcionar en diversos entornos de hardware
* 🧩 **Filosofía de Solución** → No solo procesa ventas; soluciona la gestión integral del negocio
* 📡 **Offline-First** → Tu negocio no depende de que el internet funcione
* 🔒 **Privacidad por Diseño** → Tus datos nunca salen de tu control

---

## 💎 Características Profesionales

### Gestión Inteligente
- 🔒 **Seguridad de dispositivos** → Registro y restricción de acceso por MAC/dispositivo
- 💰 **Gestión de pagos** → Integración con **MercadoPago** para pagos digitales
- 📊 **Transparencia total** → Cortes de caja con división equitativa de propinas
- 📈 **KPIs individuales** → Métricas y registros de ventas por empleado
- 🔐 **Auditoría completa** → Logs de todos los movimientos y cambios

### Experiencia de Usuario
- 🎨 **UI Moderna** → Diseño con gradientes y animaciones suaves
- ⚡ **Rendimiento** → Optimizado para tablets de gama baja
- 📱 **Responsive** → Funciona en cualquier tamaño de pantalla
- 🌐 **Multi-idioma** → Español nativo, inglés próximamente
- ♿ **Accesible** → Diseño inclusivo desde el inicio

---

## 🛠️ Stack Tecnológico
```
Frontend:  React 18 + TypeScript + Vite
Estilos:   Tailwind CSS (gradientes personalizados)
Backend:   Supabase (PostgreSQL, Edge Functions)
Estado:    Zustand
Routing:   React Router
Iconos:    Lucide React
Gráficas:  Chart.js
Pagos:     MercadoPago API
Mobile:    PWA + Capacitor (Android/iOS)
```

**¿Por qué este stack?**
- ⚡ **Rápido de iterar** → Features nuevos en días, no meses
- 🔓 **Open source primero** → Todas las herramientas son FOSS
- 📚 **Bien documentado** → Cualquier dev puede contribuir
- 🎯 **Battle-tested** → Tecnologías probadas en producción

---

## 📁 Estructura del Proyecto
```
reisbloc-pos/
├── src/                    # Código fuente
│   ├── components/         # Componentes React
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios (Supabase, MercadoPago)
│   ├── hooks/              # Hooks personalizados
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   └── styles/             # Estilos globales
├── functions/              # Cloud Functions (Supabase Edge)
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
- 💡 **Filosofía:** Open source, win-win, tecnología real para negocios

---

## 🙏 Agradecimientos

A todos los restauranteros que confiaron en un POS "hecho en casa". Este software existe por ustedes y para ustedes.

---

**Versión:** 3.0.0  
**Última actualización:** Febrero 2026  
**Estado:** ✅ Producción activa

**Hecho con ❤️ en México**

---

> *"La mejor tecnología es la que funciona cuando más la necesitas. Sin excepciones, sin pretextos."*  
> — Reisbloc Lab
