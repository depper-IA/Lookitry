# Virtual Try-On — Contexto del Proyecto

## Qué es

Virtual Try-On es un SaaS B2B que permite a marcas colombianas ofrecer un probador virtual de ropa y accesorios impulsado por IA. El cliente final de la marca sube una selfie, elige un producto y la IA genera una imagen mostrando cómo le quedaría.

El negocio es simple: la marca paga una suscripción mensual y obtiene un probador listo para usar, sin necesidad de desarrollar nada propio.

---

## Servidores en desarrollo

| Servicio  | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| Backend   | http://localhost:3001    |
| n8n (IA)  | https://n8n.wilkiedevs.com |
| Supabase  | https://vkdooutklowctuudjnkl.supabase.co |

---

## Estructura del proyecto

```
Mostrador_wilkiedevs/
├── frontend/          # Next.js 14 + TypeScript + TailwindCSS
│   └── src/
│       ├── app/       # Páginas (App Router)
│       └── components/
└── backend/           # Express + TypeScript
    └── src/
        ├── controllers/
        ├── services/
        ├── routes/
        └── middleware/
```

---

## Páginas principales (Frontend)

| Ruta                        | Descripción                                      |
|-----------------------------|--------------------------------------------------|
| `/`                         | Landing page — página de venta principal         |
| `/planes`                   | Comparativa de planes con selector de meses      |
| `/register`                 | Registro de nueva marca (con trial si hay campaña activa) |
| `/login`                    | Login de marca                                   |
| `/dashboard`                | Panel de la marca (productos, configuración, uso)|
| `/dashboard/subscription`   | Estado de suscripción e historial de pagos       |
| `/pruebalo/[brandSlug]`     | Probador virtual público del cliente final       |
| `/embed/[brandSlug]`        | Versión embebible del probador (iframe)          |
| `/pago-exitoso`             | Confirmación de pago con Wompi                   |
| `/registro-pro`             | Registro post-pago para visitantes que compraron Pro |
| `/admin/login`              | Login del administrador del sistema              |
| `/admin/dashboard`          | Estadísticas globales del sistema                |
| `/admin/brands`             | Gestión de marcas                                |
| `/admin/subscriptions`      | Gestión de suscripciones                         |
| `/admin/trial-campaign`     | Control de campañas de trial gratuito            |

---

## Flujo completo de la aplicación

### 1. Visitante llega a la landing (`/`)

La landing tiene:
- Hero con CTA "Empezar gratis" → `/register` y "Ver planes" → `/planes`
- Sección "Cómo funciona" (3 pasos: sube foto, elige producto, ve resultado)
- Features destacados (velocidad, sin instalación, personalizable)
- Testimonios de clientes
- Sección de precios resumida con botón "Contratar Pro" → Wompi checkout directo
- CTA final con ambas opciones

El botón "Contratar Pro" llama a `GET /api/payments/wompi/config` para obtener la firma de integridad y abre el widget de Wompi directamente en la página, sin redirigir.

---

### 2. Registro de marca (`/register`)

Al cargar el formulario:
1. El frontend consulta `GET /api/trial/status` para saber si hay campaña de trial activa
2. Si hay campaña activa → muestra banner verde "Prueba gratis por X días"
3. El frontend genera un fingerprint del dispositivo con `@fingerprintjs/fingerprintjs`
4. El usuario completa: nombre de marca, slug (auto-generado desde el nombre), email, contraseña

Al enviar:
- `POST /api/auth/register` con `{ name, email, password, slug, fingerprint }`
- El backend extrae la IP del request
- Si hay campaña activa: verifica IP y fingerprint contra `trial_registrations` (últimos 30 días)
  - Si hay abuso → responde `429 TRIAL_ABUSE` → frontend muestra enlace a `/planes`
  - Si no hay abuso → crea cuenta con `trial_end_date` y `trial_generations_limit = 30`
- Si no hay campaña activa → crea cuenta sin trial (créditos = 0)
- Guarda JWT en `localStorage` como `token` y `brandToken`
- Redirige a `/dashboard`

---

### 3. Dashboard de la marca (`/dashboard`)

El dashboard muestra:
- Uso del mes: generaciones usadas vs límite del plan
- Productos activos vs límite del plan
- Badge de suscripción en el header (verde/amarillo/rojo según días restantes)
- Si está en trial: badge "Prueba gratuita — X días restantes"
- Si la suscripción está suspendida: modal bloqueante con instrucciones de renovación

Secciones del dashboard:
- **Productos**: crear, editar y eliminar productos con imagen de referencia
- **Configuración**: logo, colores, template del widget, texto del botón (Pro), mensaje de bienvenida (Pro)
- **Uso**: estadísticas detalladas con barras de progreso
- **Suscripción**: estado, historial de pagos, botón de renovación

---

### 4. Probador virtual público (`/pruebalo/[brandSlug]`)

Esta página es pública — no requiere login. Es la que la marca comparte con sus clientes.

Flujo del cliente final:
1. Carga configuración de la marca: `GET /api/pruebalo/:brandSlug`
   - Retorna: logo, colores, template, productos activos, buttonText, welcomeMessage
   - Si el slug no existe → página 404
2. El cliente sube una selfie (JPG/PNG/WEBP, máx 5MB) con drag & drop o selector
3. Elige el producto que quiere probarse del grid
4. Confirma → `POST /api/pruebalo/:brandSlug/generate` con la selfie en base64
5. El backend:
   - Verifica límites del plan (generaciones mensuales y por hora)
   - Crea registro en `generations` con estado PENDING
   - Envía a n8n: selfie en base64, URL de imagen del producto, brandId, productId
   - n8n llama a Gemini (OpenRouter) para generar la imagen
   - Sube el resultado a WordPress (`/wp-content/uploads/tryon/`)
   - Actualiza el registro a SUCCESS con la URL de la imagen generada
6. El frontend muestra la imagen resultante con botón de descarga

---

### 5. Widget embebible (`/embed/[brandSlug]`)

Versión del probador optimizada para iframe. La marca obtiene el código de embed desde su dashboard:

```html
<iframe
  src="https://pruebalo.wilkiedevs.com/embed/mi-marca"
  width="100%"
  height="700"
  frameborder="0"
></iframe>
```

Cuando se completa una generación, el widget envía un evento `postMessage` al padre:
```js
{ type: 'PRUEBALO_COMPLETE', imageUrl: '...', productId: '...' }
```

---

### 6. Contratación del Plan Pro (Wompi)

Desde la landing o `/planes`:
1. El usuario hace clic en "Contratar Pro"
2. El frontend llama a `GET /api/payments/wompi/config?plan=PRO&amount=250000`
3. El backend genera una referencia única (`TRYON-{brandId}-{timestamp}`) y la firma de integridad SHA256
4. El frontend abre el widget de Wompi con esos datos
5. El usuario completa el pago con tarjeta
6. Wompi envía webhook a `POST /api/payments/wompi/webhook`
7. El backend verifica la firma HMAC, extrae el `brandId` de la referencia y renueva la suscripción
8. Si el usuario no tenía cuenta → redirige a `/registro-pro` para crear la cuenta post-pago
9. Si ya tenía cuenta → redirige a `/pago-exitoso`

---

### 7. Panel de administración (`/admin`)

Acceso exclusivo del administrador del sistema (credenciales separadas de las marcas).

Funcionalidades:
- **Estadísticas globales**: total de marcas, generaciones, ingresos, tasa de conversión
- **Gestión de marcas**: buscar, filtrar, crear manualmente, editar, ver detalles
- **Gestión de suscripciones**: renovar, suspender, reactivar, cambiar plan, registrar pagos manuales
- **Campañas de trial**: crear campañas con nombre y duración, activar/desactivar, ver historial
- **Reporte de ingresos**: ingresos por mes, desglose por plan, proyección

---

## Sistema anti-abuso de trials

El trial gratuito solo existe cuando el admin activa una campaña desde `/admin/trial-campaign`.

Cuando hay campaña activa:
- Cada registro nuevo recibe `trial_end_date` y 30 créditos de generación
- Se registra la IP y el fingerprint del dispositivo en `trial_registrations`
- Si la misma IP o el mismo dispositivo intenta registrarse de nuevo en 30 días → `429 TRIAL_ABUSE`
- El frontend muestra un mensaje con enlace a `/planes` para contratar directamente

Cuando no hay campaña activa:
- Los registros nuevos crean la cuenta sin trial (créditos = 0)
- La marca debe ser activada manualmente por el admin tras confirmar el pago

---

## Planes

| Característica              | Básico              | Pro                  |
|-----------------------------|---------------------|----------------------|
| Precio                      | $150.000 COP/mes    | $250.000 COP/mes     |
| Productos en el probador    | 5                   | 15                   |
| Generaciones por mes        | 400                 | 1.200                |
| Templates del widget        | Solo Bare           | Minimal, Modern, Bold|
| Texto del botón             | No                  | Si                   |
| Mensaje de bienvenida       | No                  | Si                   |
| Modificar slug del probador | No                  | Si                   |
| Soporte prioritario         | No                  | Si                   |
| Trial gratuito              | 7 días (si hay campaña activa) | No (pago directo) |

Descuentos por pago anticipado:
- 3 meses: 5% de descuento
- 6 meses: 10% de descuento
- 12 meses: 15% de descuento

---

## Stack tecnológico

| Capa         | Tecnología                                      |
|--------------|-------------------------------------------------|
| Frontend     | Next.js 14, TypeScript, TailwindCSS             |
| Backend      | Express, TypeScript, Node.js                    |
| Base de datos| Supabase (PostgreSQL)                           |
| IA           | n8n + OpenRouter (Gemini)                       |
| Almacenamiento | WordPress REST API (plugin propio)            |
| Pagos        | Wompi (Colombia)                                |
| Email        | SMTP Hostinger                                  |
| Auth         | JWT (7 días de expiración)                      |
| Fingerprint  | @fingerprintjs/fingerprintjs                    |

---

## Variables de entorno clave (backend)

```env
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_ENABLED=true
SMTP_HOST=smtp.hostinger.com
FRONTEND_URL=http://localhost:3000
```

---

## Tablas principales en Supabase

| Tabla                    | Descripción                                      |
|--------------------------|--------------------------------------------------|
| `brands`                 | Cuentas de marcas con plan, suscripción y trial  |
| `products`               | Productos de cada marca                          |
| `generations`            | Historial de generaciones de imágenes            |
| `subscription_payments`  | Historial de pagos                               |
| `admins`                 | Credenciales de administradores                  |
| `trial_campaigns`        | Campañas de trial activas/inactivas              |
| `trial_registrations`    | IPs y fingerprints de registros con trial        |
| `admin_notifications`    | Notificaciones internas para el admin            |
| `notification_preferences` | Preferencias de email por marca               |
