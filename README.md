
# Reisbloc POS - Professional Edition 🍽️

![License](https://img.shields.io/badge/license-AGPL--3.0-purple)
![MercadoPago](https://img.shields.io/badge/payments-MercadoPago-00b1ea)
![Made in Mexico](https://img.shields.io/badge/hecho_en-México_🇲🇽-green)

**Desarrollado por [Reisbloc Lab](https://reisbloc.com)** 🚀

---

## Estado actual del proyecto

**Etapa:** Migración avanzada a Supabase, optimización PWA y notificaciones push en producción.

**Logros recientes:**
- Consolidación de lógica de negocio y persistencia en Supabase (PostgreSQL)
- Implementación de notificaciones push con sonido y vibración
- Optimización de la interfaz móvil y experiencia offline-first
- Integración robusta con MercadoPago y gestión transparente de propinas
- Auditoría y seguridad mejoradas (RLS, Edge Functions, validación de dispositivos)

**Próximos pasos:**
- Finalizar integración de PWA con Capacitor para Android/iOS
- Dashboard multi-restaurante y facturación electrónica
- Mejoras en la experiencia de usuario y accesibilidad

---

## Stack Tecnológico

Frontend: React 18 + TypeScript + Vite  
Estilos: Tailwind CSS (gradientes personalizados)  
Backend: Supabase (PostgreSQL, Edge Functions)  
Estado: Zustand  
Routing: React Router  
Iconos: Lucide React  
Gráficas: Chart.js  
Pagos: MercadoPago API  
Mobile: PWA + Capacitor (Android/iOS)

---

## Estructura del Proyecto

Consulta la documentación en [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) y [docs/QUICK_START.md](./docs/QUICK_START.md).

---

## Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/reisbloc-lab/reisbloc-pos.git
cd reisbloc-pos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# 4. Iniciar desarrollo
npm run dev
```

---

## Dedicatorias y Agradecimientos 🙏


Quiero dedicar esto:

*   **A mi madre, Socorro**, por ser mi ejemplo de resiliencia y equilibrio; y **a mi padre, Ricardo**, a quien admiro por enseñarme a ser fuerte y a mirar siempre más allá.
*   **A mis hermanos, Oscar, Naty, Pau y Manuel:** por todo lo que hemos vivido y lo que he aprendido a su lado. Espero que sigamos compartiendo experiencias increíbles y creciendo juntos.
*   **A mis abuelitas,** que aunque ya no están, me dejaron la enseñanza de vivir al máximo: **¡YOLO!**
*   **A mis hijos, Luna, Hunab y Daniel:** ustedes son **mi motor.** Me siento bendecido por tenerlos y por lo que me enseñan cada día sobre evolucionar. Espero que esta herramienta sea un impulso para que se desarrollen en sus caminos con mayor fluidez y sencillez.
*   **A Lupita,** quien siempre ha estado apoyándome incondicionalmente en cada paso. Gracias por caminar conmigo.
*   **A mis amigos:** a los que están cerca, a los que no, y a los que ya se fueron. Ustedes saben quiénes son. Les agradezco por su compañía, por las experiencias y, sobre todo, **por el respaldo y su lealtad.**

--

> Esto es para todos, porque creo firmemente que podemos mejorar como seres humanos a través de la comunidad. Espero genuinamente que esta herramienta les sea útil y facilite su trabajo o negocio, **porque trabajamos para vivir y no al revés.**
>
> Al final, somos como un mismo organismo: cuando nuestras raíces se entrelazan y nos apoyamos, crecemos con más fuerza. **No soy solo yo, somos todos,** y lo agradezco profundamente.

---

**Versión:** 3.0.0  
**Última actualización:** Febrero 2026  
**Estado:** ✅ Producción activa

**Hecho con ❤️ en México**

---

> *"La mejor tecnología es la que funciona cuando más la necesitas. Sin excepciones, sin pretextos."*  
> — Reisbloc Lab
