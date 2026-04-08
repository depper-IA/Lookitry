# Arquitectura de Blog Automation — Split en 2 Workflows

## Estado: ✅ IMPLEMENTADO (Abril 2026) — REQUIERE VERIFICACIÓN

Arquitectura de 3 pasos coordinada por el backend:

1. **Article Producer** → genera JSON estructurado → `/api/blog/article-content`
2. **Image Generator** → genera imágenes con Replicate → `/api/blog/upload`
3. **Backend** → genera HTML limpio → publica

### CAMBIOS vs VERSIÓN ANTERIOR

| Aspecto | Anterior | Actual |
|---------|----------|---------|
| Article Producer output | HTML | JSON estructurado |
| Backend genera HTML | No | Sí (generateArticleHTML) |
| Imágenes | OpenRouter | Replicate FLUX |
| Frontend procesa HTML | Sí | No (solo renderiza) |

---

## Verificación de Endpoints (2026-04-08)

| Endpoint | Método | Estado | Notas |
|---------|--------|--------|-------|
| `/api/blog/article-content` | POST | ✅ Implementado | Recibe JSON, guarda en blog_draft_articles |
| `/api/blog/assemble-article` | POST | ✅ Implementado | Genera HTML y publica |
| `/api/blog/upload` | POST | ✅ Implementado | Guarda URLs en blog_topic_images |

---

## Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL /blog                             │
│                                                                      │
│  • Configurar frecuencia, modelo IA, proveedor imágenes                │
│  • Botón "Disparar ahora" → POST /blog/settings/trigger              │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (blogSettings.controller)                  │
│                                                                      │
│  POST /blog/settings/trigger → triggerBlogWebhook()                   │
│  - Obtiene webhook_url, webhook_secret de blog_settings                │
│  - Envía config al Article Producer                                   │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ARTICLE PRODUCER WORKFLOW                          │
│                    ID: VMAu93Zx4k5qgzdm                              │
│                    Webhook: /webhook/trigger-blog-article-v2          │
│                                                                      │
│  1. RSS Google Noticias Colombia                                       │
│  2. AI Trend Hunter (genera 3 temas)                                 │
│  3. Deduplicar vs topics existentes                                   │
│ 4. Loop Temas Pendientes:                                            │
│     a. Jina Lector de Noticias (investigación)                         │
│     b. Redactor IA (genera JSON estructurado)                         │
│        { sections[], faqs[], cta_context, image_prompts[] }           │
│     c. POST /api/blog/article-content  ← GUARDA JSON                  │
│     d. Llama Image Generator (webhook)                                 │
│     e. Espera respuesta OK de Image Generator                         │
│     f. PATCH topic = published                                        │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       IMAGE GENERATOR WORKFLOW                        │
│                       ID: l4Mb3wMfHUnsbEXH                           │
│                       Webhook: /webhook/lookitry-blog-images-v6     │
│                                                                      │
│  1. Webhook recibe topic_id, title, category_slug                   │
│ 2. Loop 3-5 imágenes (hero, body_1, body_2, etc):                  │
│     a. Replicate FLUX (genera imagen ~3 min)                         │
│        ⚠️ NO usa OpenRouter (cumple regla 5.6)                       │
│     b. Descargar PNG                                                 │
│     c. Renombrar (hero.png, body1.png, body2.png)                   │
│     d. POST /api/blog/upload (topic_id + image_type)                  │
│        → Backend guarda URL en blog_topic_images                     │
│  3. POST /api/blog/assemble-article (topic_id)  ← ENSAMBLAJE       │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND ASSEMBLY                               │
│                   POST /api/blog/assemble-article                    │
│                                                                      │
│  1. Obtiene HTML del draft (blog_draft_articles)                    │
│  2. Obtiene URLs de imágenes (blog_topic_images)                    │
│  3. Inserta imágenes en HTML:                                        │
│     - hero: después del intro/lead                                   │
│     - body1: después del primer h2                                    │
│     - body2: antes del último h2                                     │
│  4. Crea artículo final en tabla 'blogs'                              │
│  5. Limpia draft y marca topic como published                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Base de Datos

### Tabla: blog_topic_images

```sql
CREATE TABLE blog_topic_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL,
  imagen_hero_url TEXT,
  imagen_body1_url TEXT,
  imagen_body2_url TEXT,
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: blog_draft_articles

```sql
CREATE TABLE blog_draft_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL UNIQUE,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  category_slug TEXT DEFAULT 'ia',
  reading_time_minutes INTEGER DEFAULT 5,
  -- NUEVOS CAMPOS JSON (取代 html_content)
  sections JSONB DEFAULT '[]',        -- Array de secciones
  faqs JSONB DEFAULT '[]',           -- Array de FAQs
  cta_context JSONB DEFAULT '{}',     -- { type: 'trial'|'features'|'pricing'|'lead_magnet' }
  image_prompts JSONB DEFAULT '[]',  -- Array de prompts para imágenes
  toc_items JSONB DEFAULT '[]',      -- Para Table of Contents
  -- LEGACY (para compatibilidad)
  html_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: blog_settings

```sql
CREATE TABLE blog_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  webhook_url TEXT,                    
  webhook_secret TEXT,                  
  image_generator_webhook TEXT,        
  openrouter_article_model TEXT DEFAULT 'google/gemini-2.5-flash',
  image_generation_provider TEXT DEFAULT 'replicate',
  frequency TEXT DEFAULT 'weekly',
  is_enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Endpoints del Backend

### POST /api/blog/article-content

Recibe HTML del artículo sin imágenes.

```json
POST /api/blog/article-content
Headers: x-blog-secret
Body: {
  "topic_id": "uuid",
  "title": "Título del artículo",
  "html_content": "<div>...HTML completo...</div>",
  "excerpt": "Resumen del artículo",
  "meta_description": "Meta description SEO",
  "tags": ["tag1", "tag2"],
  "category_slug": "ia"
}
Response: { "success": true, "topic_id": "...", "draft_id": "..." }
```

### POST /api/blog/assemble-article

Ensambla HTML + imágenes y publica.

```json
POST /api/blog/assemble-article
Headers: x-blog-secret
Body: {
  "topic_id": "uuid"
}
Response: { 
  "success": true, 
  "message": "Artículo ensamblado y publicado",
  "post": { ... },
  "images_used": {
    "hero": "https://...",
    "body1": "https://...",
    "body2": "https://..."
  }
}
```

---

## Reglas Importantes

1. **OpenRouter PROHIBIDO para imágenes** — usar siempre Replicate (regla 5.6)
2. **Backend orquesta el assembly** — no n8n
3. **n8n solo genera JSON estructurado** — NO HTML
4. **Backend genera HTML limpio** — generateArticleHTML()
5. **topic_id debe ser UUID válido** — no usar strings de prueba

---

## JSON Estructurado (Article Producer → Backend)

### Formato que Article Producer envía a /article-content:

```json
{
  "topic_id": "uuid",
  "title": "Título del artículo",
  "slug": "slug-del-articulo",
  "meta_description": "Meta description 145-160 caracteres",
  "excerpt": "Resumen de 80-120 palabras",
  "tags": ["tag1", "tag2", "tag3"],
  "category_slug": "ia",
  "reading_time_minutes": 7,
  "sections": [
    {
      "id": "introduccion",
      "title": "Introducción",
      "paragraphs": ["Párrafo 1", "Párrafo 2", "Párrafo 3"],
      "callout": null
    },
    {
      "id": "seccion-1",
      "title": "Sección 1",
      "paragraphs": ["p1", "p2"],
      "callout": { "type": "stat", "text": "Dato clave" },
      "image_position": 1
    }
  ],
  "faqs": [
    { "question": "¿Pregunta 1?", "answer": "Respuesta 1" }
  ],
  "cta_context": { "type": "trial" },
  "image_prompts": [
    { "position": "hero", "prompt": "Descripción imagen hero" },
    { "position": "body_1", "prompt": "...", "after_section": "seccion-1" }
  ]
}
```

### HTML generado por generateArticleHTML():

```html
<article class="blog-article">
  <header class="blog-header">
    <div class="blog-hero"><img src="hero_url" /></div>
    <h1>Title</h1>
    <p class="blog-excerpt">Excerpt</p>
  </header>
  <div class="blog-layout">
    <nav class="blog-toc">TOC</nav>
    <div class="blog-content">
      <section id="section-id">
        <h2>Section Title</h2>
        <p>Paragraph...</p>
        <div data-blog-callout="stat">Dato clave</div>
        <p>More paragraphs...</p>
        <figure class="blog-body-image"><img ... /></figure>
      </section>
      <div data-blog-faq="accordion">
        <details><summary>Question</summary><div>Answer</div></details>
      </div>
      <div data-blog-cta="trial">
        <h3>CTA Title</h3><a href="...">Button</a>
      </div>
    </div>
  </div>
</article>
```

---

## Workflow IDs

| Workflow | ID | Estado |
|----------|-----|--------|
| Article Producer | `VMAu93Zx4k5qgzdm` | Activo |
| Image Generator | `l4Mb3wMfHUnsbEXH` | Activo |
| Error Handler | `PNri7NdZYkZhpPnm` | Activo |

---

## Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `docs/blog/IMAGE_GENERATOR_WORKFLOW_V7.json` | Workflow Image Generator corregido |
| `docs/blog/ARTICLE_PRODUCER_CHANGES.json` | Cambios para Article Producer |
| `docs/blog/BLOG_VISUAL_IMPROVEMENT_SPEC.md` | Specs visuales del HTML |

---

## Historico

| Fecha | Cambio |
|-------|--------|
| 2026-04-08 | Arquitectura inicial: Split en 2 workflows |
| 2026-04-08 | Backend ahora orquesta assembly de artículos |
| 2026-04-08 | Nuevo endpoint /article-content para recibir HTML |
| 2026-04-08 | Nuevo endpoint /assemble-article para publicar |
| 2026-04-08 | ✅ Verificación: Artículo "El secreto de las boutiques en Cali" publicado |
| 2026-04-08 | **NUEVO**: Article Producer genera JSON, Backend genera HTML limpio |
| 2026-04-08 | **NUEVO**: generateArticleHTML() reemplaza procesamiento frontend |
| 2026-04-08 | **NUEVO**: Columnas JSON en blog_draft_articles (sections, faqs, cta_context, image_prompts) |
| 2026-04-08 | **NUEVO**: CTA templates configurables en blog_settings |
