# Pendientes del Sistema de Blog — 2026-04-08

## 🔴 Críticos (Bloquean funcionamiento)

| # | Tema | Descripción | Archivos | Estado |
|---|------|-------------|----------|--------|
| 1 | **Versionar tablas en schema** | `blog_draft_articles` y `blog_topic_images` agregadas a `backend/supabase-schema.sql` | `backend/supabase-schema.sql` | ✅ Listo |
| 2 | **Verificar Article Producer** | Workflow verifica JSON estructurado con sections, faqs, cta_context, image_prompts | n8n workflow VMAu93Zx4k5qgzdm | ✅ Verificado |
| 3 | **API Key en credentials** | La key de Replicate está hardcodeada en workflows | Workflows n8n | ⏳ Pendiente |

---

## 🟡 Importantes (No bloquean pero deben resolverse)

| # | Tema | Descripción | Archivos |
|---|------|-------------|----------|
| 4 | **Unificar webhook paths** | Documentación menciona v6, workflows usan v2 | docs/n8n/*.md |
| 5 | **Manejo de imágenes faltantes** | `assembleArticle` debe continuar si una imagen no existe | `backend/src/controllers/blog.controller.ts` |
| 6 | **Tests unitarios** | No hay tests para `generateArticleHTML()` | `backend/src/__tests__/` |
| 7 | **Logging mejorado** | Agregar logs de versión en Article Producer para debugging | n8n workflows |

---

## 🟢 Mejoras (Pueden esperar)

| # | Tema | Descripción |
|---|------|-------------|
| 8 | **Credential de n8n** | Usar n8n Credentials para Replicate en lugar de API key hardcodeada |
| 9 | **Retry con exponential backoff** | Implementar en Image Generator |
| 10 | **Circuit breaker** | Para evitar cascading failures en generación de imágenes |

---

## Estructura de Datos Implementada

### blog_draft_articles (actual)
```sql
- id (uuid)
- topic_id (uuid)
- title (text)
- slug (text)
- html_content (text) -- legacy
- excerpt (text)
- meta_description (text)
- tags (text[])
- category_slug (text)
- sections (jsonb) -- NUEVO
- faqs (jsonb) -- NUEVO
- cta_context (jsonb) -- NUEVO
- image_prompts (jsonb) -- NUEVO
- toc_items (jsonb)
- created_at, updated_at
```

### blog_topic_images (actual)
```sql
- id (uuid)
- topic_id (uuid)
- imagen_hero_url (text)
- imagen_body1_url (text)
- imagen_body2_url (text)
- status (text)
- created_at, updated_at
```

### blogs (publicación final)
```sql
- id (uuid)
- topic_id (uuid)
- slug (text)
- title (text)
- content (text) -- HTML final generado
- excerpt (text)
- meta_description (text)
- featured_image (text)
- category_id (uuid)
- tags (text[])
- status (published/draft)
- toc_items (jsonb)
- published_at (timestamptz)
```

---

## Flujo Completo Implementado

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. n8n Article Producer (VMAu93Zx4k5qgzdm)                   │
│    → Genera JSON: { title, sections[], faqs[], cta_context,     │
│                    image_prompts[], meta_description, tags }      │
│    → POST /api/blog/article-content                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend articleContent()                                     │
│    → Guarda en blog_draft_articles                              │
│    → Campos: sections, faqs, cta_context, image_prompts        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. n8n Image Generator (l4Mb3wMfHUnsbEXH)                   │
│    → Recibe topic_id + image_prompts[]                          │
│    → Genera imágenes con Replicate FLUX                         │
│    → POST /api/blog/upload (3-5 veces)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Backend uploadBlogImage()                                    │
│    → Sube a MinIO                                              │
│    → Actualiza blog_topic_images                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. n8n Image Generator                                         │
│    → POST /api/blog/assemble-article { topic_id }               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend assembleArticle()                                     │
│    → Obtiene draft + imágenes                                   │
│    → generateArticleHTML() → HTML limpio                         │
│    → Inserta en blogs (status=published)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Frontend BlogArticle                                        │
│    → Renderiza HTML con estilos dark mode                        │
│    → data-blog-callout, data-blog-faq, data-blog-cta           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Última Actualización: 2026-04-08
