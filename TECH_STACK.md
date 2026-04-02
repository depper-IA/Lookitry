# Tech Stack — Lookitry

Este documento es la **fuente de verdad técnica** y arquitectura del sistema. Debe actualizarse obligatoriamente ante cambios estructurales sin eliminar información previa funcional.

---

## 1. Stack Técnico Principal

| Capa | Tecnología | Versión | Uso |
|------|------------|---------|-----|
| **Frontend** | Next.js (App Router) | 14.0.4 | UI y renderizado |
| **Backend** | Node.js + Express | 4.18.2 | API de Negocio |
| **Base de datos** | Supabase (PostgreSQL) | — | Persistencia de datos |
| **Autenticación** | JWT propio | — | Seguridad de sesión |
| **IA / Try-On** | n8n + OpenRouter | — | Orquestación de IA |
| **Styling** | Tailwind CSS | 3.4.0 | Diseño y UI |
| **Almacenamiento** | MinIO (S3 compatible) | — | Assets e imágenes generadas |

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
| `axios` | 1.6.2 | HTTP client |
| `dotenv` | 16.3.1 | Variables de entorno |

---

## 3. Endpoints y URLs del Sistema

| Servicio | URL Producción | URL Local |
|----------|----------------|-----------|
| **Frontend** | `https://lookitry.com` | `http://localhost:3000` |
| **API Backend** | `https://api.lookitry.com` | `http://localhost:3001` |
| **n8n Panel** | `https://n8n.wilkiedevs.com` | — |
| **MinIO Panel** | `https://minio.wilkiedevs.com` | — |
| **Supabase Project** | `https://vkdooutklowctuudjnkl.supabase.co` | — |

---

## 4. Infraestructura y Despliegue

### 4.1 Servidor VPS (Hostinger)
- **IP:** `31.220.18.39`
- **Usuario:** `root`
- **ID VPS:** `1004711`
- **SO:** Ubuntu con Docker Engine

### 4.2 Contenedores Docker
| Contenedor | Imagen | Propósito |
|------------|--------|-----------|
| `lookitry-frontend` | `nextjs:custom` | Aplicación Next.js |
| `lookitry-backend` | `node:18-alpine` | API Express |
| `root-n8n-1` | `n8nio/n8n` | Orquestador de flujos |
| `minio` | `quay.io/minio/minio` | Almacenamiento local S3 |

---

## 5. Base de Datos — Esquema Detallado

### 5.1 `brands` (Clientes SaaS)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | Identificador único de la marca |
| `email` | text | Email de login (Unique) |
| `slug` | text | Para URL pública: `/pruebalo/[slug]` |
| `plan` | enum | `BASIC`, `PRO` |
| `subscription_status` | enum | `active`, `expired`, `trial` |
| `subscription_end_date` | timestamptz | Fecha de expiración de pago |

### 5.2 `products` (Catálogo)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK | Relación con `brands` |
| `image_url` | text | Imagen original del producto |
| `is_active` | bool | Visibilidad en el widget |

---

## 6. Arquitectura n8n — El Motor de IA

### 6.1 Flujos y Webhooks
| Función | Webhook Path | ID Workflow |
|---------|--------------|-------------|
| **Try-On Principal** | `/webhook/tryon` | `wPLypk7KhBcFLicX` |
| **Descriptor IA** | `/webhook/descriptor` | `ZjVTV3QxoPEi60GX` |
| **Error Handling** | (Automático) | `PNri7NdZYkZhpPnm` |

---

## 7. Arquitectura de Flujos de Negocio

### 7.1 Flujo de Registro y Trial
- Registro -> Turnstile -> Creación en DB -> Email Verificación.
- `TRIAL` automático configurable en `trial_campaigns`.

### 7.2 Flujo de Pago y Prorrateo (Wompi)
- **Upgrade (BASIC → PRO):** Se aplica crédito proporcional del tiempo no usado.
- **Webhook:** Valida firma e inicia `renewSubscription`.

### 7.3 Flujo de Generación (Try-On)
1. Usuario sube selfie -> Backend -> Webhook n8n.
2. Frontend hace **Polling** hasta que el estado sea `SUCCESS`.

---

## 8. Estructura del Proyecto

```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
│   ├── src/app/                # Páginas y API routes
│   ├── src/components/         # Componentes reutilizables
│   └── src/services/           # Clientes HTTP
├── backend/                     # Express API
│   ├── src/controllers/        # Lógica de negocio
│   ├── src/routes/             # Definición de rutas
│   └── src/services/           # Integraciones (n8n, MinIO)
├── scripts/                    # Deploy (_deploy_now.py)
└── REGLAS_IMPORTANTES.md       # Reglas operativas
```

---

## 9. Scripts de Desarrollo

### Frontend
- `npm run dev`: Desarrollo local.
- `npm run build`: Generar build de producción.

### Backend
- `npm run dev`: Hot-reload con ts-node-dev.
- `python scripts/_deploy_now.py`: Deploy al VPS.

---

## 10. Variables de Entorno Críticas

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_SERVICE_KEY` | Acceso administrativo DB. |
| `N8N_BEARER_TOKEN` | Token para webhooks de n8n. |
| `MINIO_ENDPOINT` | URL del almacenamiento local. |

---

##不走

**Última actualización:** Abril 2026.
Toda modificación en los flujos de n8n debe ser documentada inmediatamente aquí.