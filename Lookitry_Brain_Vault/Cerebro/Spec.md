# Spec.md — Especificaciones Técnicas de Lookitry

> Documento de especificaciones de implementación. Complementa PRD.md (qué) y TECH_STACK.md (cómo).
> Actualizado: Mayo 2026

---

## 1. Módulos del Sistema

### 1.1 Try-On Pipeline (Vertex AI Nativo)

**Archivo principal:** `backend/src/services/vertex-ai.service.ts`

#### Flujo de ejecución

```
compressImagesForN8N(selfieUrl, productUrl)   ← image-compression.service.ts
        ↓
generateMaskWithSAM2(selfieUrl)
  ├── Intento 1: SAM_LOCAL_URL (MobileSAM FastAPI)
  └── Intento 2: VERTEX_SAM2_ENDPOINT (Vertex AI)
        ↓
generateTryOn(selfieUrl, maskUrl, prompt)     ← Imagen 3 (inpainting)
  ó
generateWithNanoBanana(selfieUrl, productUrl, prompt, maskUrl?)  ← Gemini 2.5 Flash Image
        ↓
saveImageToMinIO(buffer, filename)            ← AWS Signature V4
```

#### Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VERTEX_PROJECT_ID` | GCP Project ID | Sí |
| `VERTEX_LOCATION` | Región GCP (ej: `us-central1`) | Sí |
| `VERTEX_SAM2_ENDPOINT` | URL endpoint SAM 2 en Vertex AI | Para Vertex SAM |
| `VERTEX_IMAGEN_MODEL` | Modelo imagen (`imagen-3.0-generate-002`) | Sí |
| `VERTEX_TIMEOUT_MS` | Timeout en ms (default: 25000) | No |
| `SAM_LOCAL_URL` | URL MobileSAM local (`http://sam-service:8000`) | Para SAM local |
| `GOOGLE_API_KEY` | API Key de Google (fallback auth) | No |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path a service account JSON | Para ADC |

#### Manejo de errores

| Código | Causa | Comportamiento |
|--------|-------|----------------|
| `IMAGE_NOT_FOUND` | URL de imagen inaccesible | Lanza error, no reintenta |
| `TIMEOUT` | Request > VERTEX_TIMEOUT_MS | Lanza error, fallback a n8n |
| `QUOTA_EXCEEDED` | HTTP 429 de Vertex | Lanza error, fallback a n8n |
| `ENDPOINT_NOT_CONFIGURED` | Variable de entorno faltante | Lanza error en startup |
| `GENERATION_FAILED` | Respuesta inesperada de Vertex | Lanza error, fallback a n8n |
| `AUTH_FAILED` | Token GCP inválido | Lanza error |

---

### 1.2 SAM Service (MobileSAM Local)

**Archivo:** `sam-service/main.py`
**Framework:** FastAPI + MobileSAM (`vit_t`)
**Puerto:** 8000
**Endpoint:** `POST /predict`

#### Request/Response

```json
// Request
{ "image": "<base64 PNG/JPEG>" }

// Response
{
  "predictions": [
    { "maskBase64": "<base64 PNG máscara>" }
  ]
}
```

#### Puntos de segmentación

El servicio usa 3 puntos fijos para capturar la persona completa:
- `(w/2, h*0.3)` — pecho/torso superior
- `(w/2, h*0.5)` — cintura/torso medio
- `(w/2, h*0.7)` — piernas/torso inferior

#### Notas de producción
- Corre en **CPU** (sin GPU en VPS actual) — latencia ~3-8s por imagen
- Modelo `mobile_sam.pt` (~40MB) incluido en el repo
- Se descarga automáticamente si no existe al iniciar

---

### 1.3 Vertex Service (SDK Gemini)

**Archivo:** `backend/src/services/vertex.service.ts`
**SDK:** `@google/genai` v1.50.0

#### Modelos disponibles

| Modelo | Context Window | Multimodal | Image Gen |
|--------|---------------|------------|-----------|
| `gemini-2.5-pro` | 1M tokens | ✅ | ❌ |
| `gemini-2.5-flash` | 1M tokens | ✅ | ❌ |
| `gemini-2.5-flash-image` | 1M tokens | ✅ | ✅ |
| `gemini-2.0-flash` | 1M tokens | ✅ | ❌ |
| `gemini-3.1-pro-preview` | 1M tokens | ✅ | ❌ |
| `gemini-3-pro-image-preview` | 1M tokens | ✅ | ✅ |

#### Fallback automático

Si el SDK `@google/genai` falla, el servicio hace fallback a la REST API de Gemini usando `GEMINI_API_KEY`.

---

### 1.4 AI Product Descriptor

**Archivos:** `backend/src/services/ai-descriptor/`

#### Schemas Zod (unión discriminada)

```typescript
// CLOTHING
{ product_type: "CLOTHING", name, category, color, material, style, fit, description, care_instructions?, tags }

// ACCESSORY
{ product_type: "ACCESSORY", name, category, color, material, dimensions?, description, tags }

// FOOTWEAR
{ product_type: "FOOTWEAR", name, category, color, material, sole_type?, description, tags }
```

#### Routing de categorías

| Categoría (input) | Formatter |
|-------------------|-----------|
| VESTIDO, CAMISA, PANTALON, FALDA, CHAQUETA, CONJUNTO, TOP, BLUSA, JEANS, ABRIGO, COAT, OUTFIT, SET | ClothingFormatter |
| ACCESORIO, BOLSA, JOYA, BUFANDA, GORRA, RELOJ, GAFAS, BAG, HANDBAG, JEWELRY, SCARF, HAT, WATCH, GLASSES | AccessoryFormatter |
| ZAPATOS, CALZADO, SANDALIAS, SHOES, FOOTWEAR, SANDALS | FootwearFormatter |
| Desconocida | ClothingFormatter (con warning) |

#### Errores HTTP

| Error | HTTP | Causa |
|-------|------|-------|
| `VALIDATION_ERROR` | 400 | Input inválido (Zod) |
| `VALIDATION_ERROR` | 502 | Respuesta de IA no válida (Zod) |
| `VERTEX_ERROR` | 500 | Error de Vertex AI |
| `INTERNAL_ERROR` | 500 | Error inesperado |

---

### 1.5 Knowledge Base RAG (Rebecca)

**Tabla:** `lookitry_knowledge`
**Embedding:** Gemini Embedding 001 (768-dim)

#### Schema de tabla

```sql
CREATE TABLE lookitry_knowledge (
  id          text PRIMARY KEY,           -- slug único: plan_basic, faq_instalacion
  category    text NOT NULL,              -- planes | features | faq | proceso | contacto
  title       text NOT NULL,
  content     text NOT NULL,
  is_active   boolean DEFAULT true,
  embedding   vector(768),               -- Gemini Embedding 001
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

#### Función RPC Supabase

```sql
-- Búsqueda semántica
SELECT * FROM search_lookitry_knowledge(
  p_query_embedding  vector(768),
  p_match_count      int DEFAULT 5,
  p_category_filter  text DEFAULT NULL,
  p_min_similarity   float DEFAULT 0.3
);
```

#### Flujo de embedding

1. Admin crea/edita item → `POST /api/admin/knowledge`
2. Controller guarda en DB → responde HTTP 201
3. `knowledgeEmbeddingService.generateAndSave()` se llama **fire-and-forget** (no bloquea)
4. Gemini genera embedding del texto `"${title}\n\n${content}"` (max 2000 chars)
5. Embedding guardado en columna `vector(768)`

---

### 1.6 Chat WhatsApp

**Tablas:** `lead_conversations`, `lead_messages`, `lead_attachments`

#### Schema de tablas

```sql
CREATE TABLE lead_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid REFERENCES brands(id) ON DELETE SET NULL,
  status      conversation_status DEFAULT 'pending',  -- active | pending | closed
  source      varchar(20) DEFAULT 'whatsapp',
  platform_id text,                                   -- ID de conversación en YCloud
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE lead_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES lead_conversations(id) ON DELETE CASCADE,
  sender_type     message_sender_type NOT NULL,  -- lead | agent | bot
  content         text NOT NULL,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE lead_attachments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        uuid REFERENCES lead_messages(id) ON DELETE CASCADE,
  file_url          text NOT NULL,
  file_type         varchar(50) NOT NULL,
  validation_result jsonb,
  created_at        timestamptz DEFAULT now()
);
```

#### Chat Queue (Redis)

```typescript
// Clave Redis
QUEUE_KEY = 'queue:chat_messages'

// Job structure
interface ChatMessageJob {
  platform_id: string;
  content: string;
  metadata?: any;
  received_at: string;
}

// Enqueue (LPUSH)
chatQueueService.enqueueMessage(job)

// Dequeue (BRPOP con timeout 5s)
chatQueueService.dequeueMessage(timeoutSeconds)
```

---

### 1.7 Widget Security

**Archivo:** `backend/src/middleware/widgetSecurity.ts`

#### Configuración de Rate Limiter

```typescript
windowMs: 15 * 60 * 1000  // 15 minutos
max: 100                    // requests por IP
store: RedisStore           // usando ioredis
```

#### Lógica de validación de Origin

```
1. Sin origin + NODE_ENV=development → PERMITIR
2. Sin origin + IP interna (::1, 127.0.0.1, 172.x) → PERMITIR
3. Sin origin + producción → BLOQUEAR (403)
4. Origin en lookitryDomains → PERMITIR
5. Origin en localhost → PERMITIR
6. Origin en brands.social_links.allowed_origins → PERMITIR
7. Resto → BLOQUEAR (403)
```

**Cache Redis:** `widget_origins:{brandSlug}` — TTL 3600s

---

### 1.8 GCP MCP Server

**Directorio:** `mcp-gcp/`
**Puerto:** stdio (MCP protocol)

#### Herramientas disponibles

| Tool | Descripción |
|------|-------------|
| `gcp_storage_list_buckets` | Lista buckets del proyecto |
| `gcp_storage_list_bucket_contents` | Lista objetos en un bucket |
| `gcp_storage_get_bucket_metadata` | Metadata de un bucket |
| `gcp_compute_list_instances` | Lista VMs en una zona |
| `gcp_compute_get_instance` | Detalles de una VM |
| `gcp_compute_list_zones` | Lista zonas disponibles |

#### Variables de entorno

```bash
GCP_PROJECT_ID=gen-lang-client-0591001769
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## 2. Nuevas Tablas de Base de Datos (Mayo 2026)

### 2.1 `lookitry_knowledge`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | text PK | Slug único (ej: `plan_basic`) |
| `category` | text | planes, features, faq, proceso, contacto |
| `title` | text | Título del item |
| `content` | text | Contenido que Rebecca lee |
| `is_active` | boolean DEFAULT true | Toggle de activación |
| `embedding` | vector(768) | Gemini Embedding 001 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 2.2 `lead_conversations`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `lead_id` | uuid FK → brands | Nullable |
| `status` | enum | active, pending, closed |
| `source` | varchar(20) DEFAULT 'whatsapp' | |
| `platform_id` | text | ID en YCloud |
| `created_at`, `updated_at` | timestamptz | |

### 2.3 `lead_messages`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `conversation_id` | uuid FK → lead_conversations | |
| `sender_type` | enum | lead, agent, bot |
| `content` | text | |
| `metadata` | jsonb DEFAULT '{}' | |
| `created_at` | timestamptz | |

### 2.4 `lead_attachments`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `message_id` | uuid FK → lead_messages | |
| `file_url` | text | |
| `file_type` | varchar(50) | |
| `validation_result` | jsonb | |
| `created_at` | timestamptz | |

---

## 3. Nuevas Páginas Frontend (Mayo 2026)

### 3.1 `/admin/chat`

**Archivo:** `frontend/src/app/admin/chat/page.tsx`

- Layout split: lista de conversaciones (1/3) + hilo de mensajes (2/3)
- Polling automático de conversaciones
- Respuesta manual del admin via textarea
- Badges de estado: active (verde), pending (amarillo), closed (gris)

### 3.2 `/admin/knowledge`

**Archivo:** `frontend/src/app/admin/knowledge/page.tsx`

- CRUD completo de items del knowledge base
- Filtro por categoría + búsqueda por texto
- Vista agrupada por categoría (cuando no hay filtro activo)
- Toggle activo/inactivo por item
- Modal de creación/edición con validación
- Toast de confirmación en acciones

### 3.3 Nuevos componentes de Dashboard

| Componente | Descripción |
|------------|-------------|
| `ProductCard.tsx` | Card de producto con imagen, badge, acciones |
| `ProductBadge.tsx` | Badge de estado/categoría de producto |
| `ProductActions.tsx` | Menú de acciones (editar, eliminar, toggle) |
| `ProductSkeleton.tsx` | Skeleton loader para lista de productos |
| `ViewModeToggle.tsx` | Toggle grid/lista para productos |
| `ImageWithFallback.tsx` | Imagen con fallback a placeholder |

---

## 4. Variables de Entorno Nuevas (Mayo 2026)

Agregar al `.env` del backend:

```bash
# Vertex AI
VERTEX_PROJECT_ID=gen-lang-client-0591001769
VERTEX_LOCATION=us-central1
VERTEX_SAM2_ENDPOINT=https://us-central1-aiplatform.googleapis.com/v1/projects/.../endpoints/...
VERTEX_IMAGEN_MODEL=imagen-3.0-generate-002
VERTEX_TIMEOUT_MS=25000

# SAM Local
SAM_LOCAL_URL=http://sam-service:8000

# Google AI
GOOGLE_API_KEY=AIza...
GEMINI_API_KEY=AIza...
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json

# GCP
GCP_PROJECT_ID=gen-lang-client-0591001769
```

---

## 5. Decisiones de Arquitectura

### 5.1 Por qué Vertex AI como motor primario

- **Latencia**: Vertex AI Imagen 3 es más rápido que el pipeline n8n+OpenRouter
- **Calidad**: Imagen 3 produce resultados superiores para inpainting de ropa
- **Control**: Sin dependencia de n8n para el flujo crítico de negocio
- **Fallback**: n8n sigue disponible como red de seguridad

### 5.2 Por qué MobileSAM local antes de Vertex SAM 2

- **Costo**: MobileSAM es gratuito (corre en el VPS)
- **Latencia**: Evita round-trip a Vertex AI para la segmentación
- **Disponibilidad**: No depende de cuotas de Vertex AI
- **Limitación**: CPU-only en VPS actual → ~3-8s por imagen

### 5.3 Por qué Zod para el AI Descriptor

- **Contrato estricto**: La IA puede devolver JSON malformado; Zod lo detecta
- **Unión discriminada**: Permite schemas diferentes por tipo de producto sin `any`
- **Rollback seguro**: Si Zod falla (502), el cliente sabe que es un error de IA, no de red

### 5.4 Por qué Redis para Chat Queue

- **Consistencia**: Evita procesar el mismo mensaje dos veces
- **Backpressure**: Si Rebecca está ocupada, los mensajes esperan en cola
- **Reutilización**: Mismo Redis que ya usa el sistema para Try-On queue y rate limiting

### 5.5 Por qué fire-and-forget para embeddings

- **UX**: El admin no debe esperar 1-2s de Gemini API para ver confirmación de guardado
- **Tolerancia a fallos**: Si Gemini falla, el item se guarda igual (sin embedding)
- **Backfill**: `KnowledgeEmbeddingService.backfillMissing()` puede regenerar embeddings faltantes

---

## 6. Pendientes Técnicos

| Tarea | Prioridad | Descripción |
|-------|-----------|-------------|
| Deploy SAM 2 en Vertex AI | ALTA | Configurar endpoint y `VERTEX_SAM2_ENDPOINT` en prod |
| Chat queue worker en producción | MEDIA | Implementar worker que procese `queue:chat_messages` |
| GPU para SAM local | BAJA | Mejorar latencia de MobileSAM (actualmente CPU) |
| Migración `lookitry_knowledge` en Supabase | ALTA | Ejecutar migración + función RPC `search_lookitry_knowledge` |
| Migración tablas de chat en Supabase | ALTA | Ejecutar `20260503_create_chat_tables.sql` |
| Notificación admin en `organic_contact` | MEDIA | TODO en `leadsPublic.routes.ts` línea ~160 |
| Tests para vertex-ai.service.ts | MEDIA | Cobertura del pipeline nativo |
