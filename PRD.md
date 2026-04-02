# PRD - Product Requirements Document

## Lookitry

---

## 1. Resumen Ejecutivo

**Lookitry** es una plataforma SaaS de probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

---

## 2. Productos y Planes

### 2.1 Planes de Suscripción

| Plan | Precio | Productos Activos | Generaciones/mes | Badge |
|------|--------|-------------------|-------------------|-------|
| **TRIAL** | $20.000 COP (pago único) | 0 | 30 (configurable) | `#6366f1` violeta |
| **BASIC** | $150.000 COP/mes | 5 | 400 | N/A |
| **PRO** | $250.000 COP/mes | 15 | 1.200 | N/A |

### 2.2 Descuentos por Duración

| Meses | Descuento |
|-------|-----------|
| 1 | 0% |
| 3 | 5% |
| 6 | 10% |
| 12 | 15% |

### 2.3 Producto Adicional

| Producto | Precio | Requisito |
|----------|--------|------------|
| **Mini-Landing** | $650.000 COP (pago único) | Requiere plan BASIC o PRO activo |

---

## 3. Funcionalidades Principales

### 3.1 Para Marcas (Usuarios)
- Registro/Login (JWT propio, Turnstile).
- Dashboard: Stats, CRUD productos, Historial, Subscription.
- Widget (Try-On) con IA.
- Pagos: Wompi (COP), PayPal (USD).
- Editor de mini-landing.

### 3.2 Para Clientes Finales
- Widget Público: `/pruebalo/[brandSlug]`.
- Mini-Landing: `/sitio/[brandSlug]`.

### 3.3 Para Administradores
- Panel Admin: Gestión global de marcas, pagos, precios y promociones.
- Blog Nativo.

---

## 4. Flujos Principales

### 4.1 Flujo de Registro (Trial Pago)
1. Usuario llena formulario en `/register`.
2. Cloudflare Turnstile valida antispam.
3. `POST /api/auth/register` crea marca.
4. Redirección a `/trial-checkout` para pago ($20.000 COP).
5. Confirmación por webhook y acceso al dashboard.

### 4.2 Flujo de Try-On (IA)
1. Usuario sube selfie en el widget.
2. Backend dispara Webhook `/webhook/tryon` en n8n (ID: `wPLypk7KhBcFLicX`).
3. n8n procesa con IA y actualiza Supabase.
4. Frontend hace polling hasta que `status = SUCCESS`.

### 4.3 Flujo de Pago (Wompi)
1. Usuario selecciona plan en checkout.
2. Backend genera URL de pago Wompi.
3. Wompi notifica al webhook del Backend.
4. Backend valida firma y activa suscripción.

### 4.4 Flujo de Upgrade con Prorrateo
1. Usuario con BASIC selecciona PRO.
2. Backend calcula `creditAmount` (días restantes del plan actual).
3. `amountToPay = max(0, precioNuevoPlan - creditAmount)`.
4. El nuevo plan inicia inmediatamente tras el pago.

### 4.5 Flujo de Campaña de Trial (Sin Costo Inicial)
1. Si hay una campaña activa en `trial_campaigns`, el registro puede omitir el pago inicial.
2. Se asignan días y generaciones de prueba automáticamente.
3. Al finalizar, se requiere upgrade a un plan de pago.

---

## 5. Reglas de Negocio Clave
- **Mini-landing**: Requiere plan activo. Se suspende si expira.
- **Upgrade**: Siempre con prorrateo.
- **Límites**: Aplican inmediatamente al cambio de plan.

---

## 6. APIs Clave
- `/api/auth/*`: Registro, Login, Recovery.
- `/api/brands/*`: Perfil y gestión.
- `/api/products/*`: Catálogo.
- `/api/generations/*`: Try-on.
- `/api/payments/wompi/*`: Pagos COP.

---

##不走

**Última actualización:** Abril 2026.