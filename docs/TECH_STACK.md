# Tech Stack - Lookitry

## Resumen de Tecnologías

---

## 1. Stack Principal

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | Next.js | 14.0.4 |
| Frontend | React | 18.2.0 |
| Frontend | TypeScript | 5.3.3 |
| Frontend | Tailwind CSS | 3.4.0 |
| Backend | Node.js | — |
| Backend | Express | 4.18.2 |
| Backend | TypeScript | 5.3.3 |
| Base de datos | PostgreSQL (Supabase) | — |
| Autenticación | JWT propio | — |

---

## 2. Servicios y Librerías

### 2.1 Frontend

| Librería | Versión | Uso |
|----------|---------|-----|
| `next` | 14.0.4 | Framework |
| `react` | 18.2.0 | UI |
| `react-dom` | 18.2.0 | React DOM |
| `typescript` | 5.3.3 | Tipado |
| `tailwindcss` | 3.4.0 | Estilos |
| `@supabase/supabase-js` | 2.39.0 | Cliente Supabase |
| `framer-motion` | 12.38.0 | Animaciones |
| `gsap` | 3.14.2 | Animaciones |
| `@gsap/react` | 2.1.2 | GSAP React |
| `lucide-react` | 0.577.0 | Iconos |
| `sharp` | 0.33.1 | Procesamiento de imágenes |
| `@fingerprintjs/fingerprintjs` | 4.6.2 | Fingerprinting |
| `country-state-city` | 3.2.1 | Datos de países/ciudades |

#### DevDependencies
- `eslint`, `eslint-config-next`
- `prettier`
- `vitest`, `@testing-library/react`, `jsdom`
- `fast-check`
- `postcss`, `autoprefixer`
- `rimraf`, `cross-env`

### 2.2 Backend

| Librería | Versión | Uso |
|----------|---------|-----|
| `express` | 4.18.2 | Servidor HTTP |
| `@supabase/supabase-js` | 2.39.0 | Cliente Supabase |
| `jsonwebtoken` | 9.0.2 | JWT |
| `bcryptjs` | 2.4.3 | Hash de contraseñas |
| `cors` | 2.8.5 | CORS |
| `helmet` | 8.1.0 | Seguridad headers |
| `express-rate-limit` | 8.3.1 | Rate limiting |
| `multer` | 1.4.5-lts.1 | Upload de archivos |
| `nodemailer` | 8.0.2 | Email SMTP |
| `node-cron` | 4.2.1 | Cron jobs |
| `ioredis` | 5.10.1 | Redis client |
| `sharp` | 0.34.5 | Procesamiento imágenes |
| `uuid` | 13.0.0 | UUIDs |
| `axios` | 1.6.2 | HTTP client |
| `dotenv` | 16.3.1 | Variables de entorno |
| `cookie-parser` | 1.4.7 | Cookies |

#### DevDependencies
- `typescript`, `ts-node-dev`
- `jest`, `ts-jest`, `fast-check`
- `eslint`, `@typescript-eslint/*`
- `prettier`, `rimraf`, `cross-env`
- `@types/*` (express, node, jest, etc.)

---

## 3. Infraestructura

### 3.1 Servicios Externos

| Servicio | URL | Propósito |
|----------|-----|-----------|
| Supabase | `vkdooutklowctuudjnkl.supabase.co` | PostgreSQL + Storage |
| n8n | `n8n.wilkiedevs.com` | Workflows de IA |
| MinIO | `minio.wilkiedevs.com` | Almacenamiento de imágenes |
| Wompi | — | Pasarela de pagos (COP) |
| PayPal | — | Pasarela de pagos (USD) |
| Cloudflare Turnstile | — | Antispam |
| SMTP Hostinger | `smtp.hostinger.com:465` | Email transaccional |

### 3.2 Entornos de Producción

| Servicio | URL |
|----------|-----|
| Frontend | `https://lookitry.com` |
| Backend API | `https://api.lookitry.com` |
| n8n | `https://n8n.wilkiedevs.com` |
| MinIO | `https://minio.wilkiedevs.com` |

### 3.3 VPS

| Recurso | Valor |
|---------|-------|
| IP | `31.220.18.39` |
| Usuario | `root` |
| Docker project | `virtual-tryon` / `LOOKITRY` |
| Hostinger VPS ID | `1004711` |

---

## 4. Base de Datos (Supabase)

### 4.1 Tablas Principales

| Tabla | Descripción | Registros (~) |
|-------|-------------|---------------|
| `brands` | Clientes/marcas del SaaS | 54 |
| `products` | Catálogo de productos | 174 |
| `generations` | Historial de try-ons | 14 |
| `generation_feedback` | Feedback de calidad | 0 |
| `subscription_payments` | Historial de pagos | 1+ |
| `pricing_config` | Config de precios | 6 |
| `payment_settings` | Config pasarelas | 1 |
| `coupons` | Cupones de descuento | 0 |
| `promotions` | Promociones activas | 0 |
| `admins` | Administradores | 2 |
| `admin_notifications` | Notificaciones sistema | 16 |
| `trial_campaigns` | Campañas de trial | 1 |
| `trial_registrations` | Registros de trial | 3 |
| `pending_registrations` | Registros de pago pendiente | — |
| `admin_notification_preferences` | Preferencias notificaciones | 16 |
| `blogs` | Artículos del blog | — |

### 4.2 RLS (Row Level Security)
- **Regla:** Backend SIEMPRE usa `supabaseAdmin` (service role) — bypasea RLS completamente
- Frontend usa `supabase` anon para tablas públicas (`pricing_config`, `promotions`)

---

## 5. n8n - Workflows

| Workflow | ID | Descripción |
|----------|-----|-------------|
| Try-On principal | `wPLypk7KhBcFLicX` | Generación de prueba virtual |
| Error Handler | `PNri7NdZYkZhpPnm` | Manejo de errores |
| Feedback embedding | `47RcLopJB6M82b0k` | Embeddings de feedback |
| Descriptor IA | `ZjVTV3QxoPEi60GX` | Descripción de productos |

Tag: `SaaS`  
Bearer token: configurado en variables de entorno

---

## 6. Variables de Entorno

### 6.1 Backend (`backend/.env`)

```env
PORT=3001
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=...
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
N8N_API_KEY=eyJ...
N8N_BEARER_TOKEN=***
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=test_events_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_ENABLED=true
TURNSTILE_SECRET_KEY=0x4AAAA...
TURNSTILE_ENABLED=true
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@lookitry.com
SMTP_PASS=***
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=***
FRONTEND_URL=https://lookitry.com
```

### 6.2 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACsmy7e_yL9iyAXM
```

---

## 7. Estructura del Proyecto

```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/                # Páginas y API routes
│   │   ├── components/         # Componentes reutilizables
│   │   ├── services/           # Clientes HTTP
│   │   ├── utils/              # Helpers
│   │   └── types/              # TypeScript types
│   ├── public/                 # Assets estáticos
│   └── package.json
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── controllers/        # Controladores
│   │   ├── routes/             # Rutas
│   │   ├── middleware/         # Auth, admin, rate limiting
│   │   ├── config/             # Supabase config
│   │   ├── services/           # Servicios externos
│   │   ├── jobs/               # Cron jobs
│   │   ├── scripts/            # Scripts de utilidad
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── docs/                       # Documentación
├── scripts/                    # Deploy y utilidades
└── REGLAS_IMPORTANTES.md       # Reglas del proyecto
```

---

## 8. Scripts de Desarrollo

### Frontend
```bash
npm run dev          # Desarrollo
npm run build       # Build
npm run lint        # Linting
npm run format      # Format
```

### Backend
```bash
npm run dev         # Desarrollo con hot-reload
npm run build       # Compilar
npm run start       # Ejecutar
npm run test        # Tests
npm run lint        # Linting
```

### Deploy
```bash
python scripts/_deploy_now.py              # Backend + Frontend
python scripts/_deploy_now.py --backend     # Solo backend
python scripts/_deploy_now.py --frontend    # Solo frontend
python scripts/_deploy_now.py --restart     # Solo restart (~5s)
```

---

##不走

Este documento es el inventario técnico del proyecto. Actualizar cuando se agreguen o eliminen dependencias.

**Última actualización:** Abril 2026