# Auditoría del Sistema de Blog — 2026-04-08

## Estado de Componentes

| Componente | Estado | Notas |
|------------|--------|-------|
| Backend `articleContent` | ✅ Implementado | Guarda JSON estructurado |
| Backend `assembleArticle` | ✅ Implementado | Genera HTML y publica |
| Backend `generateArticleHTML()` | ✅ Implementado | Líneas 144-260 |
| Frontend `BlogArticle.tsx` | ✅ Estilizado | data-blog-callout, faq, cta, hero, body images |
| Article Producer (n8n) | ⚠️ Por verificar | ID: VMAu93Zx4k5qgzdm |
| Image Generator (n8n) | ⚠️ Parcial | ID: l4Mb3wMfHUnsbEXH, key hardcoded |
| Tabla `blog_draft_articles` | ⚠️ No versionada | Creada en Supabase, no en schema |
| Tabla `blog_topic_images` | ⚠️ No versionada | Creada en Supabase, no en schema |
| Tabla `blog_settings` | ✅ Versionada | Schema actualizado |

---

## Flujo Implementado

```
1. n8n Article Producer → JSON { sections[], faqs[], cta_context, image_prompts[] }
2. POST /api/blog/article-content → Backend guarda en blog_draft_articles
3. n8n Image Generator → Genera imágenes con Replicate
4. POST /api/blog/upload → Sube imágenes a MinIO
5. POST /api/blog/assemble-article → Backend genera HTML limpio y publica
```

---

## 🔴 Críticos (Bloquean funcionamiento)

| # | Tema | Descripción |
|---|------|-------------|
| 1 | **Tablas no versionadas** | `blog_draft_articles` y `blog_topic_images` no existen en `backend/supabase-schema.sql` |
| 2 | **Workflow no verificado** | No hay certeza de que el Article Producer en producción envíe el formato JSON correcto |
| 3 | **API Key hardcoded** | La key de Replicate `***REMOVED-SECRET***` está en workflows JSON públicos |

---

## 🟡 Pendientes (No bloquean pero deben resolverse)

| # | Tema | Descripción |
|---|------|-------------|
| 4 | **Versión de Article Producer** | No se encontró el JSON del workflow actualizado para verificar que envía a `/article-content` |
| 5 | **Webhook URL Image Generator** | La documentación menciona `/webhook/lookitry-blog-images-v6` pero los workflows usan `lookitry-blog-images-v2` |
| 6 | **Retry logic** | Los workflows tienen retry-on-fail pero no hay circuit breaker |
| 7 | **Manejo de imágenes faltantes** | `assembleArticle` debe manejar gracefully imágenes faltantes |

---

## 🟢 Recomendaciones

| # | Recomendación |
|---|---------------|
| 8 | Mover las tablas `blog_draft_articles` y `blog_topic_images` al schema versionado |
| 9 | Usar credenciales de n8n (credential referencing) en lugar de API keys hardcodeadas |
| 10 | Agregar tests para `generateArticleHTML()` con diferentes escenarios |

---

## Archivos Clave

| Ruta | Propósito |
|------|-----------|
| `backend/src/controllers/blog.controller.ts` | Controlador principal del blog (872 líneas) |
| `backend/src/routes/blog.routes.ts` | Rutas del blog |
| `backend/src/jobs/blog.job.ts` | Cron job que verifica si hay que disparar |
| `docs/blog/BLOG_ARCHITECTURE_SPLIT.md` | Documentación de arquitectura |
| `workflow_blog_images_corrected.json` | Workflow Image Generator (v2) |
| `supabase/migrations/20260408_add_structured_json_to_blog_draft_articles.sql` | Migración columnas JSON |
| `supabase/migrations/20260408_add_cta_templates_to_blog_settings.sql` | Migración CTA templates |

---

## Próximos Pasos

1. **Verificar en producción:**
   - Exportar workflow `VMAu93Zx4k5qgzdm` desde n8n
   - Comparar con documentación
   - Asegurar que el nodo "Preparar JSON" envía a `/api/blog/article-content`

2. **Migrar tablas al schema:**
   - Crear archivos SQL en `supabase/migrations/` para `blog_draft_articles` y `blog_topic_images`

3. **Seguridad:**
   - Eliminar API keys hardcodeadas de workflows JSON
   - Usar n8n Credentials para Replicate
