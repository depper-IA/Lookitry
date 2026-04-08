# Spec: Mejora Visual del Blog — Componentes Ricos

## Estado: En Progreso (Abril 2026)

### Implementado ✅
- Arquitectura de backend con endpoints `/article-content` y `/assemble-article`
- Workflows de n8n (Article Producer + Image Generator)
- Publicación automática de artículos

### Pendiente 🔄
- HTML del Redactor IA con data-attributes correctos
- Integración de `BlogArticle.tsx` en la página del blog
- Componente TOC interactiva funcionando

---

## Problemas Identificados

1. **Redactor IA genera `style=""` en lugar de data-attributes**
   - Los callouts usan `<div style="background:#FFF5F2">` en vez de `<div data-blog-block="impact">`
   - Los H2 no tienen `data-toc-title` → TOC interactiva no funciona
   - Los callouts no se renderizan con los estilos premium del componente

2. **BlogArticle.tsx NO está integrado**
   - La página `/blog/[slug]/page.tsx` usa `SanitizedHtml` directo
   - El componente BlogArticle.tsx (711 líneas) tiene TOC interactiva, FAQ accordion, estilos Rich que no se usan

3. **Componente BlogArticle.tsx necesita mejoras**
   - Algunos estilos usan `bg-white` que contrasta mal con el fondo oscuro de la página
   - Soporta data-attributes pero el HTML del Redactor IA no los genera

---

## Arquitectura de la Mejora

### Flujo Completo Actual (Implementado)

```
1. Article Producer (n8n) → genera HTML
2. POST /api/blog/article-content → guarda en blog_draft_articles
3. Image Generator (n8n) → genera imágenes → POST /api/blog/upload
4. POST /api/blog/assemble-article → Inserta imágenes en HTML
5. page.tsx → renderiza SanitizedHtml (ACTUAL)
```

### Flujo Deseado (Con BlogArticle.tsx)

```
1. Article Producer (n8n) → genera HTML con data-attributes
2. POST /api/blog/article-content → guarda en blog_draft_articles
3. Image Generator (n8n) → genera imágenes → POST /api/blog/upload
4. POST /api/blog/assemble-article → Inserta imágenes en HTML
5. page.tsx → usa <BlogArticle post={post} /> (REEMPLAZAR SanitizedHtml)
6. BlogArticle.tsx → renderiza TOC, callouts, FAQ, CTA con estilos
```

---

## Componentes Involucrados

### Frontend
- `frontend/src/app/blog/[slug]/page.tsx` — página del artículo
- `frontend/src/components/blog/BlogArticle.tsx` — componente completo (711 líneas)
- `frontend/src/components/blog/SanitizedHtml.tsx` — sanitizer XSS (actual)

### Backend
- `blog.controller.ts` — endpoints article-content y assemble-article
- Tabla `blog_draft_articles` — almacena HTML antes de imágenes

### n8n
- Article Producer Workflow — genera HTML del artículo
- Prompt actual: `docs/n8n/prompts/blog-article-prompt-v3.md`

---

## HTML Esperado del Redactor IA

### Estructura Completa

```html
<div data-blog-intro="lead">
  <p>Párrafo de apertura impactante con gancho...</p>
</div>

<h2 data-toc-title="El problema real">El problema real: Devoluciones y frustración</h2>
<p>Contenido de la sección...</p>

<div data-blog-block="impact" data-type="stat">
  <h3>Dato Clave</h3>
  <p>Información importante con estadística...</p>
</div>

<h2 data-toc-title="La solución">La solución: Probadores virtuales con IA</h2>
<p>Contenido...</p>

<div data-blog-faq="accordion">
  <details>
    <summary>¿Pregunta frecuente 1?</summary>
    <p>Respuesta...</p>
  </details>
  <details>
    <summary>¿Pregunta frecuente 2?</summary>
    <p>Respuesta...</p>
  </details>
</div>

<div data-blog-cta="final">
  <h3>¿Quieres potenciar tu marca con LOOKITRY?</h3>
  <p>Únete a las tiendas...</p>
  <a href="/trial-checkout">Probar Lookitry Gratis</a>
</div>
```

---

## Data-Attributes Requeridos

| Selector | Atributo | Descripción |
|---------|----------|-------------|
| Intro | `data-blog-intro="lead"` | Párrafo de apertura destacado |
| H2 TOC | `data-toc-title="texto"` | Título para tabla de contenidos |
| Callout | `data-blog-block="impact"` | Bloque de impacto |
| Callout tipo | `data-type="stat\|tip\|warning\|quote"` | Variante visual del callout |
| FAQ | `data-blog-faq="accordion"` | Sección de preguntas frecuentes |
| CTA | `data-blog-cta="final"` | Llamada a acción final |

---

## Prompt del Redactor IA (blog-article-prompt-v3.md)

```markdown
# Prompt del Redactor IA para Lookitry Blog

## Reglas de HTML

1. **Intro/Lead**: Usar `<div data-blog-intro="lead">` para el párrafo de apertura
2. **H2 con TOC**: Usar `<h2 data-toc-title="título corto para TOC">Título Completo</h2>`
3. **Callouts**: Usar `<div data-blog-block="impact" data-type="stat|tip|warning|quote">`
4. **FAQ**: Usar `<div data-blog-faq="accordion"><details><summary>Pregunta</summary><p>Respuesta</p></details></div>`
5. **CTA Final**: Usar `<div data-blog-cta="final"><h3>Título</h3><p>Texto</p><a href="...">CTA</a></div>`

## NO USAR
- `style=""` — usar siempre data-attributes
- Clases CSS inline
- `class=""` — el componente aplica los estilos

## Estructura del Output

El campo "content" del JSON debe ser HTML limpio con data-attributes.
```

---

## Tareas de Implementación

### Fase 1: Prompt del Redactor IA ✅
- [x] Crear documento `docs/n8n/prompts/blog-article-prompt-v3.md`
- [x] Definir data-attributes correctos

### Fase 2: Actualizar Workflow n8n 🔄
- [ ] Actualizar prompt del nodo Redactor IA en Article Producer
- [ ] Test: generar artículo de prueba y verificar HTML

### Fase 3: Integrar BlogArticle.tsx 🔄
- [ ] Reemplazar `<SanitizedHtml>` por `<BlogArticle post={post} />` en page.tsx
- [ ] Verificar que los estilos se aplican correctamente
- [ ] Test: abrir artículo en blog y verificar TOC, callouts, FAQ, CTA

### Fase 4: Verificación end-to-end 🔄
- [ ] Disparar webhook y verificar artículo publicado con estilos correctos
- [ ] Verificar en mobile (responsive)
- [ ] Verificar performance (Core Web Vitals)

---

## Componente BlogArticle.tsx — Estructura

```
BlogArticle
├── TOC (Table of Contents) — scroll spy, sticky sidebar
├── ArticleHeader — título, excerpt, meta
├── ArticleContent — innerHTML con estilos
│   ├── data-blog-intro="lead" — párrafo de apertura
│   ├── data-toc-title — extract for TOC
│   ├── data-blog-block="impact" — callouts (stat, tip, warning, quote)
│   ├── data-blog-faq="accordion" — FAQ con <details>
│   └── data-blog-cta="final" — CTA final
├── FAQ Schema — JSON-LD structured data
└── ShareButtons
```

---

## Estilos Existentes en BlogArticle.tsx

```tsx
// Intro lead
"[&_[data-blog-intro='lead']]:mb-10 [&_[data-blog-intro='lead']]:text-xl ..."

// Impact blocks
"[&_[data-blog-block='impact']]:my-10 [&_[data-blog-block='impact']]:rounded-2xl ..."
"[&_[data-blog-block='impact'][data-type='stat']]:border-[#FF5C3A]/30"

// FAQ accordion
"[&_[data-blog-faq='accordion']]_details:border-b ..."

// CTA final
"[&_[data-blog-cta='final']]:mt-16 [&_[data-blog-cta='final']]:rounded-3xl ..."
```

---

## Reglas Importantes

- El Redactor IA debe generar HTML limpio con data-attributes
- NO usar `style=""` ni clases CSS inline
- Los data-attributes son la fuente de verdad para los estilos
- El componente BlogArticle.tsx aplica los estilos basándose en data-attributes
- OpenRouter PROHIBIDO para imágenes — usar Replicate
- El workflow tarda ~4-5 min por artículo completo
- NO disparar webhook más de 1 vez cada 5 min

---

## Historico

| Fecha | Cambio |
|-------|--------|
| 2026-04-08 | Arquitectura backend implementada y verificada |
| 2026-04-08 | Endpoints article-content y assemble-article funcionando |
| 2026-04-08 | Artículo de prueba "El secreto de las boutiques en Cali" publicado |
| 2026-04-08 | Spec visual documentada — pendiente integración frontend |
