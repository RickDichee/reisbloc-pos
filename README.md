# TPV Solutions - POS Restaurante Profesional

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Descripción

Sistema de Punto de Venta (POS) profesional para restaurantes con énfasis en:
- 🔒 **Seguridad de dispositivos** - Registro y restricción de acceso por MAC/dispositivo
- 💰 **Gestión de pagos** - Integración con terminal Clip para pagos digitales
- 📊 **Transparencia total** - Cortes de caja con división equitativa de propinas
- 📈 **KPIs individuales** - Métricas y registros de ventas por empleado
- 🔐 **Auditoría completa** - Logs de todos los movimientos y cambios

## ⚙️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Backend**: Firebase (Firestore + Functions)
- **Estilos**: Tailwind CSS
- **Gráficas**: Chart.js
- **Estado**: Zustand
- **Routing**: React Router

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Autenticación y dispositivos
│   ├── pos/            # Interfaz POS
│   ├── admin/          # Panel administrativo
│   ├── reports/        # Reportes y gráficas
│   └── common/         # Componentes comunes
├── pages/              # Páginas principales
├── hooks/              # Hooks personalizados
├── services/           # Servicios Firebase, API Clip
├── store/              # Store global Zustand
├── types/              # Tipos TypeScript
├── utils/              # Funciones utilidades
└── styles/             # Estilos globales
firebase/
├── functions/          # Cloud Functions
├── firestore.rules     # Reglas de seguridad
└── storage.rules       # Reglas de storage
```

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

## 💳 Integración Clip

- **API de Clip**: Procesamiento de pagos digitales
- **Propinas digitales**: Registro automático
- **Conciliación**: Matching de transacciones
- **Reportes**: Resumen de pagos por método

## 💵 Gestión de Propinas

- **División equitativa**: Cálculo automático
- **Transparencia total**: Visualización de propinas por empleado
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

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Firebase (copiar tu config de Firebase)
# Crear archivo .env.local con las credenciales

# 3. Ejecutar en desarrollo
npm run dev

# 4. Build para producción
npm run build

# 5. Desplegar a Firebase
npm run deploy
```

## 📝 Documentación

- [SECURITY.md](./SECURITY.md) - Documentación de seguridad y dispositivos
- [CLIP_INTEGRATION.md](./CLIP_INTEGRATION.md) - Guía de integración Clip
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del proyecto
- [API_DOCS.md](./API_DOCS.md) - Documentación de APIs

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

TPV Solutions - Sistema POS Profesional para Restaurantes

---

**Última actualización**: 21 de enero de 2026
