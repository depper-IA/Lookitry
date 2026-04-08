# Arquitectura de Blog Automation — Split en 2 Workflows

## Estado Actual (Abril 2026)

Arquitectura de 3 pasos coordinada por el backend:
1. **Article Producer** → genera HTML → `/api/blog/article-content`
2. **Image Generator** → genera imágenes → `/api/blog/upload`
3. **Backend** → ensambla HTML + imágenes → publica

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
│  4. Loop Temas Pendientes:                                            │
│     a. Jina Lector de Noticias (investigación)                         │
│     b. Redactor IA (genera HTML del artículo)                          │
│     c. POST /api/blog/article-content  ← GUARDA HTML                 │
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
│  2. Loop 3 imágenes (hero, body1, body2):                            │
│     a. Replicate FLUX (genera imagen ~3 min)                         │
│     b. Descargar PNG                                                 │
│     c. Renombrar (hero.png, body1.png, body2.png)                   │
│     d. POST /api/blog/upload (topic_id + image_type)                  │
│        → Backend guarda URL en blog_topic_images                     │
│  3. POST /api/blog/assemble-article (topic_id)  ← ENSAMBLAJES      │
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

### Tabla: blog_topic_images (existente)

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

### Tabla: blog_draft_articles (NUEVA)

```sql
CREATE TABLE blog_draft_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL UNIQUE,
  title TEXT,
  html_content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  category_slug TEXT DEFAULT 'ia',
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

### `/api/blog/article-content`
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

### `/api/blog/assemble-article`
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

1. **OpenRouter PROHIBIDO para imágenes** — usar siempre Replicate
2. **Backend orquesta el assembly** — no n8n
3. **n8n solo genera contenido** — HTML e imágenes
4. **Backend aplica SEO y estructura** — asegura calidad

---

## Workflow IDs

| Workflow | ID | Estado |
|----------|-----|--------|
| Article Producer | `VMAu93Zx4k5qgzdm` | Activo |
| Image Generator | `l4Mb3wMfHUnsbEXH` | Activo |
| Error Handler | `PNri7NdZYkZhpPnm` | Activo |

---

## Historico

| Fecha | Cambio |
|-------|--------|
| 2026-04-08 | Arquitectura inicial: Split en 2 workflows |
| 2026-04-08 | Backend ahora orquesta assembly de artículos |
| 2026-04-08 | Nuevo endpoint /article-content para recibir HTML |
| 2026-04-08 | Nuevo endpoint /assemble-article para publicar |
