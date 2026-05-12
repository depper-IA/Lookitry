# Tech Stack — Lookitry

Este documento es la **fuente de verdad técnica** del sistema. Detalla stack, librerías, infraestructura, schema de DB y arquitectura de flujos IA. La lógica de negocio y flujos están en [[PRD]].

> Última actualización: Mayo 2026

---

## 1. Stack Técnico Principal

| Capa | Tecnología | Versión | Uso |
|------|------------|---------|-----|
| **Frontend** | Next.js (App Router) | 14.2.35 | UI y renderizado |
| **Backend** | Node.js + Express | 4.18.2 | API de Negocio |
| **Base de datos** | Supabase (PostgreSQL + pgvector) | — | Persistencia + RAG embeddings |
| **Autenticación** | Dual JWT propio (HTTP-only) | — | Seguridad de sesión con Key Rotation |
| **OAuth** | Google Sign-In | — | Login alternativo |
| **IA / Try-On (primario)** | Google Vertex AI (Gemini 2.5 Flash + Imagen 3) | — | Pipeline nativo de Try-On |
| **IA / Try-On (fallback)** | n8n + OpenRouter | — | Fallback cuando Vertex falla |
| **Segmentación (SAM)** | MobileSAM (Python/FastAPI) + Vertex AI SAM 2 | — | Generación de máscaras para Try-On |
| **Descriptor de Productos** | Vertex AI Gemini 2.5 Flash | — | Descripción automática de productos |
| **RAG / Embeddings** | Gemini Embedding 001 (768-dim) + pgvector | — | Knowledge base de Rebecca |
| **Styling** | Tailwind CSS | 3.4.0 | Diseño y UI |
| **Almacenamiento** | MinIO (S3 compatible) | — | Assets e imágenes generadas |
| **Cache & Queue** | Redis (ioredis) | 5.10.1 | Brand config cache, Job Queue, Chat Queue |
| **Reverse Proxy** | Traefik | — | Routing Docker |
| **Anti-spam** | Cloudflare Turnstile | — | Protección de formularios |
| **Analytics** | Google Analytics (GA4) | — | Métricas de tráfico |
| **Testing** | Vitest (FE) + Jest (BE) + fast-check | — | Testing + property-based |
| **GCP MCP** | MCP Server GCP (Node.js) | — | Herramienta MCP para GCS y Compute Engine |

---

## 2. Librerías

### 2.1 Frontend

| Librería | Versión | Uso |
|----------|---------|-----|
| `next` | 14.2.35 | Framework |
| `react` | 18.3.1 | UI |
| `react-dom` | 18.3.1 | React DOM |
| `typescript` | 5.9.3 | Tipado |
| `tailwindcss` | 3.4.0 | Estilos |
| `@supabase/supabase-js` | 2.39.0 | Cliente Supabase |
| `framer-motion` | 12.38.0 | Animaciones |
| `gsap` | 3.14.2 | Animaciones |
| `@gsap/react` | 2.1.2 | GSAP React |
| `lucide-react` | 0.577.0 | Iconos |
| `sharp` | 0.33.1 | Procesamiento de imágenes |
| `@fingerprintjs/fingerprintjs` | 4.6.2 | Fingerprinting anti-abuso |
| `country-state-city` | 3.2.1 | Datos de países/ciudades |

**Dev Dependencies:**
| Librería | Versión |
|----------|---------|
| `@next/bundle-analyzer` | ^14.2.0 |
| `@testing-library/react` | ^16.3.2 |
| `vitest` | ^4.1.0 |
| `eslint` | ^8.56.0 |
| `prettier` | ^3.1.1 |

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
| `rate-limit-redis` | 4.3.1 | Rate limiting con Redis store |
| `multer` | 1.4.5-lts.1 | Upload de archivos |
| `nodemailer` | 8.0.2 | Email SMTP |
| `node-cron` | 4.2.1 | Cron jobs |
| `ioredis` | 5.10.1 | Redis client |
| `sharp` | 0.34.5 | Procesamiento imágenes |
| `axios` | 1.6.2 | HTTP client |
| `dotenv` | 16.3.1 | Variables de entorno |
| `cookie-parser` | ^1.4.7 | Parseo de cookies JWT |
| `uuid` | ^13.0.0 | Generación de UUIDs |
| `zod` | ^4.4.1 | Validación de schemas |
| `@google/genai` | ^1.50.0 | SDK Google Generative AI (Vertex AI) |
| `@google-cloud/storage` | ^7.19.0 | Google Cloud Storage |
| `google-auth-library` | — | Auth ADC para Vertex AI |
| `xlsx` | ^0.18.5 | Exportación Excel |
| `gtts` | ^0.2.1 | Text-to-speech |
| `wav` | ^1.0.2 | Audio WAV |

**Dev Dependencies:**
| Librería | Versión |
|----------|---------|
| `jest` | ^30.3.0 |
| `ts-jest` | ^29.4.6 |
| `fast-check` | ^4.6.0 |
| `supabase` | ^2.78.1 |
| `eslint` | ^8.56.0 |
| `prettier` | ^3.1.1 |
| `ts-node-dev` | ^2.0.0 |

---

## 3. URLs del Sistema

| Servicio | URL Producción | URL Local |
|----------|----------------|-----------|
| **Frontend** | `https://lookitry.com` | `http://localhost:3000` |
| **API Backend** | `https://api.lookitry.com` | `http://localhost:3001` |
| **n8n Panel** | `https://n8n.wilkiedevs.com` | — |
| **MinIO Panel** | `https://minio.wilkiedevs.com` | — |
| **Supabase** | `https://vkdooutklowctuudjnkl.supabase.co` | — |

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
| `lookitry-frontend` | `nextjs:custom` (Node 20 Alpine) | Aplicación Next.js |
| `lookitry-backend` | `node:20-alpine` | API Express |
| `root-n8n-1` | `n8nio/n8n` | Orquestador de flujos |
| `minio` | `quay.io/minio/minio` | Almacenamiento local S3 |
| `lookitry-sammy` | `node:20-alpine` (custom build) | Agente Sammy (Telegram bot + LLM) |
| `lookitry-sam-service` | `python:3.11-slim` (custom build) | MobileSAM FastAPI (puerto 8000) |

### 4.3 Reverse Proxy (Traefik)
- **Frontend:** `lookitry.com` y `www.lookitry.com`
- **Backend:** `api.lookitry.com`
- **Red externa:** `proxy`

### 4.4 Build Args (Frontend)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_N8N_DESCRIPTOR_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

---

## 5. Base de Datos — Schema Resumido

> Schema completo y actualizado en [[PRD]] sección 3 y 6. Aquí solo referencias rápidas.

### Tablas Principales
| Tabla | Propósito |
|-------|-----------|
| `brands` | Clientes SaaS (suscripción, config, branding) |
| `products` | Catálogo de productos por marca |
| `generations` | Historial de Try-On |
| `subscription_payments` | Tracking de pagos |
| `coupons` | Descuentos |
| `referrals` | Programa de referidos |
| `leads` | CRM de prospectos |
| `generation_feedback` | RAG feedback con pgvector |
| `lookitry_knowledge` | Knowledge base para Rebecca |
| `pricing_config` | Configuración dinámica de precios |
| `addon_packages` | Paquetes de créditos extra |
| `blog_topics`, `blog_draft_articles`, `blogs` | Blog CMS |

### Tablas de Agentes (Mayo 2026)
| Tabla | Propósito |
|-------|-----------|
| `agent_activities` | Registro de actividad de agentes |
| `agent_sessions` | Sesiones activas de agentes |
| `agent_delegations` | Delegaciones entre agentes |

### Vistas
| Vista | Propósito |
|-------|-----------|
| `brand_usage_stats` | Stats de uso por marca |
| `subscription_monitoring` | Monitoreo de suscripciones |

---

## 6. Arquitectura n8n — Flujos y Webhooks

| Función | Webhook Path | ID Workflow |
|---------|--------------|-------------|
| **Try-On Principal** | `/webhook/tryon` | `wPLypk7KhBcFLicX` |
| **Error Handling** | (Automático como errorWorkflow) | `PNri7NdZYkZhpPnm` |
| **Enterprise Sync** | `/webhook/enterprise-sync` | — |
| **Blog Topic Generator** | `/webhook/trigger-topic-generator` | `ryoA7wq7WhXYUckC` |
| **Blog Article Producer** | `/webhook/trigger-article-producer` | `VMAu93Zx4k5qgzdm` |
| **Blog Image Generator** | `/webhook/lookitry-blog-images` | `l4Mb3wMfHUnsbEXH` |
| **Blog Post Creation** | `/api/blog/webhook` (backend) | — |
| **Feedback Embedding** | Asíncrono vía n8n | — |
| **Project Knowledge RAG** | `/webhook/project-knowledge-rag` | — |
| **NotebookLM Drive Sync** | `/webhook/notebooklm-sync` | — |

### Prompt Rules Engine (`prompt-rules.ts`)
Motor de reglas de prompt por categoría de producto con 15+ categorías:
- vestidos, camisas, pantalones, faldas, zapatos, conjuntos, chaquetas, accesorios, etc.
- Cada categoría tiene reglas de `replacement` (reemplazar prenda) o `keep` (mantener prenda existente).

### RAG (Retrieval-Augmented Generation)
- **Feedback** se almacena con embeddings pgvector (1536-dim) en `generation_feedback`
- **Project Knowledge** indexado en `project_knowledge` con embeddings pgvector (768-dim)
- **Archivos indexados**: PRD.md, DESIGN.md, TECH_STACK.md, REGLAS_IMPORTANTES.md, CHANGELOG.md
- **Flujo**: n8n detecta cambios en commits → genera embeddings → upsert a Supabase
- **Búsqueda**: Agentes consultan `/api/agent/rag/search` → embedding → búsqueda vectorial → resultados ranked

---

## 7. Arquitectura de Flujos IA

### 7.0 Pipeline de Try-On Nativo (Vertex AI)

```
Usuario sube selfie
        ↓
Backend valida créditos y encola en Redis
        ↓
Queue Worker procesa el trabajo
        ↓
[Opción A] SAM Local (MobileSAM FastAPI en sam-service/)
        ↓
[Opción B] Vertex AI SAM 2 Endpoint (si SAM local falla)
        ↓
Máscara PNG generada → guardada en MinIO
        ↓
Vertex AI Imagen 3 (inpainting con máscara)
  ó Gemini 2.5 Flash Image (Nano Banana, multimodal)
        ↓
Imagen resultado → guardada en MinIO
        ↓
Supabase actualizado con status=SUCCESS
        ↓
Frontend polling detecta resultado
```

**Variables de entorno:**
- `VERTEX_PROJECT_ID` — GCP project ID (`gen-lang-client-0591001769`)
- `VERTEX_LOCATION` — Región (`us-central1`)
- `VERTEX_SAM2_ENDPOINT` — URL del endpoint SAM 2
- `VERTEX_IMAGEN_MODEL` — Modelo (`imagen-3.0-generate-002`)
- `SAM_LOCAL_URL` — URL del servicio MobileSAM local (`http://sam-service:8000`)
- `GOOGLE_API_KEY` / `GOOGLE_APPLICATION_CREDENTIALS` — Auth GCP

**Archivos clave:**
- `backend/src/services/vertex-ai.service.ts` — Pipeline SAM + Imagen 3 + Nano Banana
- `backend/src/services/vertex.service.ts` — SDK `@google/genai` para Gemini (con fallback REST)
- `backend/src/services/image-compression.service.ts` — Compresión sharp antes de enviar a n8n/Vertex
- `sam-service/main.py` — FastAPI con MobileSAM (CPU, modelo `vit_t`)
- `backend/src/routes/vertex.routes.ts` — `/api/vertex/generate`, `/api/vertex/stream`, `/api/vertex/models`

### 7.0b Sistema RAG + Knowledge Base de Rebecca

**Tabla:** `lookitry_knowledge`
**Embeddings:** Gemini Embedding 001 (768-dim), `taskType: RETRIEVAL_DOCUMENT`
**Búsqueda:** Función RPC `search_lookitry_knowledge` en Supabase

```
Admin crea/edita item en /admin/knowledge
        ↓
Backend guarda en lookitry_knowledge
        ↓
KnowledgeEmbeddingService genera embedding (fire-and-forget)
        ↓
Embedding guardado en columna vector(768)

--- En tiempo de conversación ---

n8n recibe mensaje WhatsApp de lead
        ↓
POST /api/agent/knowledge/search { query }
        ↓
Backend genera embedding de la query (RETRIEIVAL_QUERY)
        ↓
Búsqueda vectorial en Supabase → top-5 resultados
        ↓
context_block inyectado en system prompt de Rebecca
        ↓
Rebecca responde con información precisa
```

**Endpoints:**
- `POST /api/agent/knowledge/search` — Búsqueda semántica (con fallback keyword)
- `GET /api/agent/knowledge/all` — Todo el knowledge base activo
- `GET /api/admin/knowledge` — CRUD admin
- `POST /api/admin/knowledge` — Crear item
- `PATCH /api/admin/knowledge/:id` — Editar / toggle activo
- `DELETE /api/admin/knowledge/:id` — Eliminar

**Categorías:** `planes`, `features`, `faq`, `proceso`, `contacto`

### 7.0c Sistema de Chat WhatsApp

```
WhatsApp (YCloud) → POST /api/chat/webhook
        ↓
ChatQueueService.enqueueMessage() → Redis queue:chat_messages
        ↓
Worker procesa mensaje → crea/actualiza lead_conversations
        ↓
Busca contexto en lookitry_knowledge (RAG)
        ↓
Rebecca (MiniMax) genera respuesta
        ↓
Admin puede supervisar en /admin/chat
        ↓
Admin puede responder manualmente via POST /api/chat/conversations/:id/reply
```

**Endpoints:**
- `POST /api/chat/webhook` — Recibe mensajes de WhatsApp (YCloud)
- `GET /api/chat/conversations` — Lista conversaciones (admin)
- `GET /api/chat/conversations/:id` — Mensajes de una conversación
- `POST /api/chat/conversations/:id/reply` — Respuesta manual del admin

### 7.0d AI Product Descriptor

Reemplaza el proxy a n8n para descripción de productos. Usa Vertex AI Gemini 2.5 Flash directamente.

**Patrón:** Strategy Pattern con formatters por categoría (Clothing, Accessory, Footwear)
**Validación:** Zod con unión discriminada por `product_type`

```
POST /api/ai/describe-product { name, category, brand_description?, image_url? }
        ↓
DescriptorService.getFormatter(category) → ClothingFormatter | AccessoryFormatter | FootwearFormatter
        ↓
formatter.buildPrompt() → prompt especializado
        ↓
vertexService.generateContent(gemini-2.5-flash, responseMimeType: application/json)
        ↓
JSON parseado + validado con Zod
        ↓
ProductDescription { CLOTHING | ACCESSORY | FOOTWEAR }
```

**Archivos:**
- `backend/src/services/ai-descriptor/ai-descriptor.service.ts`
- `backend/src/services/ai-descriptor/schemas.ts` — Zod schemas
- `backend/src/services/ai-descriptor/formatters/` — clothing, accessory, footwear
- `backend/src/routes/ai.routes.ts` — `POST /api/ai/describe-product`

### 7.0e Widget Security

Middleware `widgetSecurity.ts` con dos capas:

1. **Rate Limiting Redis** — 100 requests / 15 min por IP
2. **Validación de Origin** — Verifica `brands.social_links.allowed_origins`
   - Cache en Redis por 1 hora (`widget_origins:{brandSlug}`)
   - Siempre permite dominios de Lookitry y localhost
   - Permite IPs internas (Next.js SSR)

### 7.0f Leads Públicos

- `POST /api/leads/public` — Captura lead (upsert por email)
- `GET /api/leads/public/check?email=xxx` — Verifica si email ya existe

**Fuentes:** `organic_contact`, `post_demo_capture`
**Tipos:** `boutique`, `tienda_online`, `showroom`, `galeria`, `distribuidor`, `otro`

---

## 8. Estructura del Proyecto

```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
│   ├── src/app/                # Páginas y API routes
│   ├── src/components/         # Componentes reutilizables (40+)
│   ├── src/lib/seo/            # Generadores de esquemas JSON-LD
│   └── src/services/           # Clientes HTTP
├── backend/                     # Express API
│   ├── src/controllers/        # Lógica de negocio
│   ├── src/routes/             # 40+ archivos de rutas (100+ endpoints)
│   ├── src/services/           # 23 servicios
│   ├── src/auditor/           # Subsistema de auditoría
│   ├── src/middleware/        # Auth, rate limiting, CORS
│   ├── src/utils/              # Utilidades
│   ├── src/scheduler/         # Cron jobs
│   └── src/email-templates/   # Templates HTML
├── scripts/                    # Deploy (_deploy_now.py)
├── lookitry-woocommerce/       # Plugin WordPress/WooCommerce
├── sam-service/               # Python/FastAPI MobileSAM
├── mission-control/            # Dashboard de agentes IA
├── mcp-gcp/                  # GCP MCP Server
└── Lookitry_Brain_Vault/     # Documentación del Cerebro
```

---

## 9. Scripts de Desarrollo

### Frontend
- `npm run dev`: Desarrollo local
- `npm run build`: Generar build de producción

### Backend
- `npm run dev`: Hot-reload con ts-node-dev
- `python scripts/_deploy_now.py`: Deploy al VPS

---

## 10. Variables de Entorno Críticas

### 10.1 Frontend (`.env.example`)
| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend |
| `NEXT_PUBLIC_APP_URL` | URL base del frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key anon de Supabase |
| `NEXT_PUBLIC_N8N_DESCRIPTOR_URL` | Webhook descriptor n8n |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### 10.2 Backend (`.env.example`)
| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default 3001) |
| `NODE_ENV` | development/production |
| `SUPABASE_URL` | URL de Supabase |
| `SUPABASE_ANON_KEY` | Key anon de Supabase |
| `SUPABASE_SERVICE_KEY` | Key service role |
| `JWT_SECRET` | Secret para firmar JWT |
| `JWT_EXPIRES_IN` | Expiración del JWT (default 7d) |
| `N8N_WEBHOOK_URL` | Webhook try-on principal |
| `N8N_API_KEY` | API key de n8n |
| `N8N_BEARER_TOKEN` | Bearer token para n8n |
| `MINIO_ENDPOINT` | URL de MinIO S3 |
| `COOKIE_DOMAIN` | Dominio de cookies (producción) |
| `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET` | Wompi |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_SANDBOX` | PayPal |
| `GOOGLE_PLACES_API_KEY` | Google Places API |
| `BREVO_API_KEY` | API key Brevo SMTP |

---

## Referencias Cruzadas

| Documento | Contenido |
|-----------|-----------|
| [[PRD]] | Lógica de negocio, flujos, planes, APIs, features |
| [[DESIGN]] | Sistema de diseño (colores, tipografía, componentes, estados UI) |
| [[AGENTS]] | Configuración del equipo de agentes IA |
| [[REGLAS_IMPORTANTES]] | Reglas operativas del proyecto |

---

**Última actualización:** Mayo 2026.
