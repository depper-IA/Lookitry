# Spec: Mejora Visual del Blog — Componentes Ricos

## Estado Actual

### Problemas identificados

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

## Componentes Involucrados

### Frontend
- `frontend/src/app/blog/[slug]/page.tsx` — página del artículo (reemplazar SanitizedHtml por BlogArticle)
- `frontend/src/components/blog/BlogArticle.tsx` — componente completo (711 líneas)
- `frontend/src/components/blog/SanitizedHtml.tsx` — sanitizer XSS

### Backend (n8n)
- `Redactor IA` — nodo que genera el HTML del artículo
- Prompt actual: `docs/n8n/prompts/blog-article-prompt-v2.md`

### Base de datos
- Tabla `blogs` — campo `content` guarda el HTML generado

---

## Arquitectura de la Mejora

### Flujo Propuesto

```
1. Redactor IA (n8n) → genera HTML con data-attributes correctos
2. Se guarda en blogs.content
3. page.tsx → usa <BlogArticle post={post} />
4. BlogArticle → renderiza con TOC interactiva, FAQ accordion, callouts, CTA
```

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

## HTML Esperado del Redactor IA

### Lead (intro)

```html
<div data-blog-intro="lead">
  <p>Párrafo de apertura impactante...</p>
</div>
```

### Tabla de Contenidos (auto-generada por componente desde H2s)

```html
<h2 data-toc-title="El problema real">El problema real: Devoluciones y frustración</h2>
```

### Callout Box

```html
<div data-blog-block="impact" data-type="stat">
  <h3>📊 Dato Clave</h3>
  <p>El stat o información importante...</p>
</div>
```

### FAQ Accordion

```html
<div data-blog-faq="accordion">
  <details>
    <summary>¿Pregunta frecuente 1?</summary>
    <p>Respuesta...</p>
  </details>
</div>
```

### CTA Final

```html
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

## Estilos Existentes en BlogArticle.tsx (linea ~460-480)

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

## Tareas de Implementación

### Fase 1: Documentar y preparar prompt

- [ ] Crear documento `docs/n8n/prompts/blog-article-prompt-v3.md` con HTML limpio
- [ ] Definir exactamente qué data-attributes debe generar cada componente

### Fase 2: Actualizar Redactor IA en n8n

- [ ] Actualizar prompt del nodo Redactor IA con estructura HTML correcta
- [ ] Incluir data-attributes en todos los componentes
- [ ] Test: generar artículo de prueba y verificar HTML

### Fase 3: Integrar BlogArticle.tsx

- [ ] Reemplazar `<SanitizedHtml>` por `<BlogArticle post={post} />` en page.tsx
- [ ] Verificar que los estilos se aplican correctamente
- [ ] Test: abrir artículo en blog y verificar TOC, callouts, FAQ, CTA

### Fase 4: Verificación end-to-end

- [ ] Disparar webhook y verificar artículo publicado con estilos correctos
- [ ] Verificar en mobile (responsive)
- [ ] Verificar performance (Core Web Vitals)

---

## Pendientes Confirmados

- [x] Investigar topics — funcionando (RSS + AI Trend Hunter)
- [x] Webhook blog — funcionando
- [x] Publicación automática — funcionando (1 artículo publicado)
- [ ] HTML con data-attributes correctos — pendiente
- [ ] Integrar BlogArticle.tsx — pendiente
- [ ] TOC interactiva funcionando — pendiente
- [ ] Estilos callouts/FAQ/CTA — pendientes

---

## Notas

- El workflow tarda ~4-5 min por artículo completo
- Regla: NO disparar webhook más de 1 vez cada 5 min
- OpenRouter PROHIBIDO para blog — usar Replicate para imágenes
- BlogArticle.tsx soporta todos los componentes pero necesita data-attributes del HTML
