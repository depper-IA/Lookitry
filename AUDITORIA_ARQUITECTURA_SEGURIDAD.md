# Reporte de Auditoría: Arquitectura y Seguridad

**Fecha:** Marzo 2026  
**Proyecto:** LinkiTry (Virtual Try-On SaaS)  
**Alcance:** Revisión de Calidad de Código, Arquitectura (Backend y Frontend) y Seguridad Global del Sistema.

---

## 🏗️ 1. Arquitectura y Calidad de Código

### Backend (Node.js + Express + TypeScript)
- **Estructura Organizacional:** Muy sólida. La separación por responsabilidades (`controllers`, `services`, `routes`, `middleware`) es clara y fácil de mantener.
- **Uso de TypeScript:** Fuerte tipado visible en interfaces como `AuthRequest` y DTOs (`RegisterBrandDto`, `LoginDto`), lo cual previene errores en tiempo de pre-compilación.
- **Manejo de Errores:** Centralizado correctamente a través de `errorHandler.ts` y `notFoundHandler`, lo que asegura respuestas consistentes a lo largo de toda la API.
- **Patrón Controlador-Servicio:** Se respeta la lógica de negocio en los servicios (`AuthService`, `WompiService`, `SubscriptionService`), dejando los controladores limpios y encargados solo de la capa HTTP.

### Frontend (Next.js 14 + App Router)
- **Migración a Server/Client Components:** Excelente uso del App Router. Páginas clave como la Landing Page (`app/page.tsx`) son **Server Components**, lo que permite obtener datos desde el servidor (`getPricingConfig`) y renderizar el SEO (`JSON-LD`) de forma óptima.
- **Componentes de Interfaz:** Componentes interactivos como `DashboardLayout` manejan correctamente la directiva `'use client'`, gestionando estado interno (`useState`) y lógica de hidratación.
- **Sistema de Diseño:** Consistencia visual gestionada con variables CSS inyectadas y TailwindCSS.

---

## 🔒 2. Seguridad y Protección del Sistema

### Autenticación (JWT)
- **Implementación:** El backend utiliza tokens Bearer verificados en `authMiddleware`. Además, se hace una validación contra la base de datos en cada request para asegurar que la marca sigue existiendo.
- **Punto de Mejora (Frontend):** Actualmente el almacenamiento del JWT se da en `localStorage`. Debido a que `localStorage` no es accesible en el _Edge Runtime_ de Next.js, la protección de rutas (`middleware.ts`) es pasiva y la validación real ocurre del lado del cliente (`layout.tsx`).
  - **Recomendación futura:** Migrar el JWT a **HTTP-Only Cookies**. Esto previene ataques XSS de forma nativa y permite al `middleware.ts` de Next.js denegar el acceso a rutas protegidas antes de que estas se rendericen en el cliente, evitando parpadeos e incrementando la seguridad.

### Webhooks y Pagos (Wompi)
- **Firma HMAC:** **Excelente implementación.** El webhook (`wompi.controller.ts`) lee el checksum en los headers (`x-event-checksum`) y utiliza `express.raw` para garantizar que el body no se altere durante el parseo, lo cual es crítico para que la firma SHA-256 criptográfica coincida.
- **Manejo de Eventos Únicos:** La lógica distingue adecuadamente referencias y montos (como el pago simbólico de tokenización de $100 COP) asegurando que no existan activaciones de planes fraudulentas.

### Rate Limiting y Prevención de Abuso (Trial)
- El sistema cuenta con barreras defensivas muy bien organizadas (`rateLimiter.ts`):
  - **Global:** 1000 req / 15 min.
  - **Auth:** 10 req / 15 min (Evita fuerza bruta en logins).
  - **Generation (IA):** 20 req / 15 min (Protege el costo de consumo en el webhook de n8n / Gemini).
  - **Trial Abuse:** El `auth.controller` registra bloquea dominios de correos desechables, valida integraciones con Turnstile (Cloudflare) e inyecta validación de red por `IP` y `fingerprintjs`. 
  - **Conclusión Anti-abuso:** Nivel de seguridad de grado producción.

---

## 📋 3. Conclusiones y Siguientes Pasos

El proyecto cuenta con bases arquitectónicas **sobresalientes y seguras**. No se han detectado brechas críticas que impongan un riesgo inmediato (P0).

**Recomendaciones de Nivel P2 (Mejoras Técnicas):**
1. **Cookies HTTP-Only:** Considerar el rediseño de la entrega del JWT (desde `localStorage` hacia `Set-Cookie` header), esto elevaría la seguridad Frontend al estándar más alto actual de Next.js App Router.
2. **Helmet:** El middleware de backend (`app.ts`) inyecta headers de seguridad manualmente. Considerar instalar `helmet` (`npm i helmet`) para delegar el control exhaustivo de headers y cubrir vectores adicionales sin escribir código manual.
