# PRD - Product Requirements Document

## Lookitry

---

## 1. Resumen Ejecutivo

**Lookitry** es una plataforma SaaS de probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

**Mercado objetivo:** Colombia, México, Argentina, Chile, Perú  
**Idioma principal:** Español  
**Propuesta de valor:** "Pruébalo antes de comprarlo" — reduce devoluciones y aumenta conversión.

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

#### Autenticación
- Registro con Cloudflare Turnstile (antispam)
- Login con JWT propio (no Supabase Auth)
- Recovery de contraseña vía email SMTP

#### Dashboard
- Stats y resumen de uso
- CRUD de productos
- Historial de generaciones
- Métricas de uso y analytics
- Estado de suscripción
- Checkout interno (renovar/upgrade)
- Configuración del widget
- Código de integración (embed)
- Editor de mini-landing
- Perfil de marca

#### Try-On (Widget)
- Subida de selfie del cliente
- Selección de producto
- Generación de imagen con IA (n8n + OpenRouter)
- Polling de resultado
- Descarga de imagen generada

#### Pagos
- Wompi (COP)
- PayPal (USD con TRM)
- Prorrateo en upgrades BASIC → PRO

### 3.2 Para Clientes Finales (Visitantes)

#### Widget Público
- URL: `/pruebalo/[brandSlug]`
- Prueba virtual sin registro
- Selección de productos de la marca

#### Mini-Landing
- URL: `/sitio/[brandSlug]`
- Showcase de productos
- Integración de widget

#### Checkout Público
- URL: `/checkout?plan=BASIC|PRO`
- Precios dinámicos desde `pricing_config`
- Wompi + PayPal

### 3.3 Para Administradores

#### Panel Admin
- Métricas globales
- Gestión de marcas
- Gestión de suscripciones
- Historial de pagos
- Editor de precios dinámicos (`pricing_config`)
- Configuración de pasarelas (Wompi, PayPal, TRM)
- Cupones y promociones
- Gestión de mini-landings
- Analytics globales
- Feedback de generaciones
- Notificaciones del sistema
- Estado del sistema
- Gestión de administradores

#### Blog Nativo
- Ruta pública: `/blog` y `/blog/[slug]`
- Panel Admin: `/admin/blog`
- Webhook de ingesta (`x-blog-secret`)

---

## 4. Flujos Principales

### 4.1 Flujo de Registro (Trial Pago)
1. Usuario llena formulario en `/register`
2. Cloudflare Turnstile valida que no es bot
3. `POST /api/auth/register` crea la marca en estado `pending_payment`
4. Usuario es redirigido a `/trial-checkout` para realizar el pago ($20.000 COP)
5. Tras el pago, la referencia `TRIAL-{brandId}-{ts}` se confirma por webhook
6. Se envía email de bienvenida vía SMTP
7. Usuario ingresa a su panel en `/dashboard`

### 4.2 Flujo de Try-On
1. Usuario sube selfie en el widget (`/pruebalo/[slug]`)
2. `POST /api/pruebalo/:slug/generate` valida créditos y plan
3. Backend llama al webhook de n8n
4. n8n procesa con OpenRouter (modelo de imagen)
5. Resultado se guarda en MinIO y en `generations`
6. Frontend hace polling hasta `status = SUCCESS`
7. Muestra imagen resultante

### 4.3 Flujo de Pago (Wompi - COP)
1. Usuario va a `/checkout?plan=BASIC` o `/dashboard/checkout`
2. Frontend carga precios desde `pricing_config`
3. Usuario selecciona plan, meses, aplica cupón opcional
4. Backend genera URL de Wompi con referencia `WOMPI-{brandId}-M{months}-P{plan}-{timestamp}`
5. Usuario paga en Wompi (tarjeta, PSE, nequi, etc.)
6. Wompi envía webhook a `POST /api/payments/wompi/webhook`
7. Backend verifica firma HMAC SHA-256
8. Activa suscripción en `brands`
9. Envía email de confirmación y redirige a `/pago-exitoso`

### 4.4 Flujo de Upgrade con Prorrateo
1. Usuario con BASIC activo selecciona PRO
2. Frontend detecta `isUpgrade = true` y llama a `/api/payments/wompi/upgrade-preview`
3. Backend calcula:
   - `creditAmount = pricePerDay × díasRestantes`
   - `amountToPay = max(0, precioNuevoPlan - creditAmount)`
4. Si `amountToPay = 0` → "Activar sin costo"
5. Si `amountToPay > 0` → genera URL Wompi
6. Webhook detecta upgrade y llama `renewSubscription(..., isUpgrade: true)`

---

## 5. Reglas de Negocio Clave

### 5.1 Dependencia de Recursos
- **Mini-landing**: Requiere plan BASIC o PRO activo. Si la suscripción expira, la landing se suspende.
- **Trial**: Usuario puede previsualizar la landing, pero para activarla debe adquirir un plan.

### 5.2 Lógica de Plan
- **Upgrade** (BASIC → PRO): Prorrateo, nuevo plan inicia hoy
- **Downgrade** (PRO → BASIC): Diferido, cambia al final del ciclo actual

### 5.3 Límites
- Límites por plan se aplican inmediatamente al cambiar de plan
- Las generaciones usadas no se borran al hacer upgrade

---

## 6. APIs Clave

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro con Turnstile |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/forgot-password` | Envía email de reset |
| GET | `/api/auth/verify-email` | Verifica email |

### Marcas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/brands/me` | Perfil de la marca (JWT) |
| PUT | `/api/brands/me` | Actualizar perfil (JWT) |
| GET | `/api/brands/:slug` | Perfil público por slug |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/products` | Listar/Crear (JWT) |
| PUT/DELETE | `/api/products/:id` | Actualizar/Eliminar (JWT) |

### Generations
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/generations` | Crear generación (JWT) |
| GET | `/api/generations` | Historial (JWT) |

### Pagos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/payments/wompi/checkout-url` | URL Wompi |
| POST | `/api/payments/wompi/webhook` | Webhook Wompi |
| GET | `/api/payments/paypal/checkout-url` | URL PayPal |
| POST | `/api/payments/paypal/capture` | Captura PayPal |

### Pruebalo (Público)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pruebalo/:slug` | Config del widget |
| POST | `/api/pruebalo/:slug/generate` | Generar try-on |

---

## 7. Métricas de Negocio

### Objetivos (definidos en `pricing_config.metas`)
- MRR objetivo
- Clientes objetivo

### Descuentos
- 1 mes: 0%
- 3 meses: 5%
- 6 meses: 10%
- 12 meses: 15%

---

## 8.不走

Este documento sirve como referencia para el desarrollo y mantenimiento del producto. Cualquier cambio en funcionalidades, precios o flujos debe documentarse y reflejarse en este PRD.

**Última actualización:** Abril 2026