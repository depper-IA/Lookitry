# Auditoría SEO — Lookitry
> Fecha: marzo 2026 | Dominio: pruebalo.wilkiedevs.com
> Mercado objetivo: Latinoamérica (CO, MX, AR, CL, PE, **VE**)

---

## Fundamentos y fuentes de referencia

Esta auditoría se basa en investigación actualizada a 2026:

- **SEO en Latam** — [bluethings.co](https://www.bluethings.co/blog/seo-in-latin-america-complete-guide):
  Google tiene >95% de market share en Latam. Más del 90% de búsquedas se realizan desde móvil.
  WhatsApp es parte del funnel de conversión. Cada país debe tratarse como un programa SEO separado.

- **Venezuela 2026** — [datareportal.com](https://datareportal.com/reports/digital-2026-venezuela):
  28.5M de población. 17.6M usuarios de internet (61.6% de penetración). 21.8M conexiones móviles (76.3%).
  16.6M usuarios de redes sociales. 88.6% urbano. Mediana de edad: 29.4 años.

- **Core Web Vitals 2026** — [veduis.com](https://veduis.com/blog/core-web-vitals-seo-impact-guide/):
  Los 3 pilares son LCP, INP (reemplazó a FID en marzo 2024) y CLS.
  INP <200ms = bueno. En Latam con redes 3G/4G el impacto es mayor que en mercados desarrollados.

- **Schema markup para SaaS 2026** — [agentberlin.ai](https://agentberlin.ai/blog/schema-markup-saas-2026):
  6 schemas esenciales: SoftwareApplication, FAQPage, HowTo, Organization, Product/Offer, Review/AggregateRating.
  El schema markup aumenta el CTR un 40% y la visibilidad SEO un 36.6%.

- **AI Overviews / SGE**:
  Aparecen en más del 50% de resultados. Reducen el CTR entre 20-40% en queries informacionales.
  Los featured snippets tienen 75% más probabilidad de ser citados en AI Overviews.
  FAQ schema + resúmenes de 50-70 palabras aumentan la probabilidad de inclusión.

- **Google ranking factors 2026**:
  Contenido de calidad, velocidad, backlinks, mobile-friendliness, keyword optimization,
  estructura, HTTPS, UX, search intent, video, internal links.

---

## Estado actual (resumen ejecutivo)

El proyecto tiene una base SEO razonable: metadata global en `layout.tsx`, JSON-LD en homepage,
`robots.ts` y `sitemap.ts` funcionales, Open Graph y Twitter Cards configurados, fuentes con
`display: swap`, y `lang="es"` en el HTML. Sin embargo, hay brechas importantes que limitan
el posicionamiento en búsquedas competitivas de Latam.

---

## PRIORIDAD ALTA — Impacto directo en ranking

### 1. Dominio — Cambiar a dominio propio
- **Problema:** El sitio vive en `pruebalo.wilkiedevs.com` (subdominio de marca de agencia).
  Google trata subdominios como entidades separadas y la autoridad de dominio no se acumula en Lookitry.
- **Acción:** Registrar `lookitry.com` o `lookitry.co` y migrar con redirecciones 301 permanentes.
- **Archivos a actualizar:** `layout.tsx`, `robots.ts`, `sitemap.ts`, `page.tsx` (BASE_URL).
- **Impacto:** Muy alto — es la acción de mayor retorno a largo plazo.
- **Fuente:** Práctica estándar de SEO técnico; confirmado por Google Search Central.

### 2. Páginas `'use client'` sin metadata — `/planes` y `/terminos`
- **Problema:** Ambas páginas son Client Components y no exportan `metadata`.
  Next.js no permite exportar `metadata` desde Client Components.
- **Acción:** Arquitectura Server + Client: Server Component exporta `metadata`, Client Component maneja interactividad.
- **Metadata sugerida para `/planes`:**
  ```ts
  export const metadata: Metadata = {
    title: 'Planes y precios — Probador virtual IA para tiendas',
    description: 'Elige el plan de probador virtual con IA para tu tienda. Básico desde $150.000 COP/mes. Pro desde $250.000 COP/mes. 7 días gratis.',
    alternates: { canonical: 'https://[dominio]/planes' },
  };
  ```
- **Metadata sugerida para `/terminos`:**
  ```ts
  export const metadata: Metadata = {
    title: 'Términos y Condiciones — Lookitry',
    description: 'Términos y condiciones de uso de la plataforma Lookitry. Ley 1480 de 2011, Ley 1581 de 2012 — Colombia.',
    robots: { index: true, follow: false },
  };
  ```

### 3. Sitemap incompleto
- **Problema:** El sitemap solo incluye 4 URLs. Faltan `/terminos`, `/register` y las mini-landings activas.
- **Acción:** Ampliar `sitemap.ts`:
  ```ts
  { url: `${BASE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.3 },
  // Generar dinámicamente mini-landings activas:
  const brands = await fetch(`${API_URL}/api/public/brands/active`).then(r => r.json());
  brands.map(b => ({ url: `${BASE_URL}/sitio/${b.slug}`, changeFrequency: 'weekly', priority: 0.6 }))
  ```
- **Archivo:** `src/app/sitemap.ts`
- **Fuente:** Google recomienda sitemaps completos para facilitar el crawl budget.

### 4. Imagen OG faltante o genérica
- **Problema:** El layout referencia `/og-image.png` pero no hay certeza de que exista ni esté optimizada.
  Una OG image bien diseñada aumenta el CTR desde redes sociales.
- **Acción:** Crear OG image de 1200×630px con logo, tagline y mockup del widget.
  Generar OG images dinámicas para mini-landings con `next/og` (ImageResponse).
- **Archivo:** `src/app/sitio/[brandSlug]/opengraph-image.tsx`

### 5. Canonical tags en páginas dinámicas
- **Problema:** `/sitio/[brandSlug]` y `/pruebalo/[brandSlug]` pueden servir contenido duplicado.
  Google puede penalizar por contenido duplicado.
- **Acción:** Canonical apuntando siempre a `/sitio/[slug]`. En `/pruebalo/[slug]` agregar
  `robots: { index: false }` o canonical hacia `/sitio/[slug]`.
- **Archivos:** `src/app/pruebalo/[brandSlug]/page.tsx`, `src/app/sitio/[brandSlug]/page.tsx`

---

## PRIORIDAD MEDIA — Mejoras de contenido y estructura

### 6. Keywords de cola larga para Latam + Venezuela
- **Problema:** Las keywords actuales son genéricas. Para Latam hay términos con menor competencia
  y mayor intención de compra. Venezuela tiene 17.6M usuarios de internet con mediana de edad 29.4 años
  — audiencia joven y digital-first ideal para e-commerce de moda.
- **Acción:** Agregar al array `keywords` en `layout.tsx`:
  ```ts
  'probador virtual Colombia',
  'probador virtual México',
  'probador virtual Venezuela',
  'probador virtual ropa online',
  'widget prueba virtual tienda online',
  'probador virtual para Instagram',
  'probador virtual para tienda Shopify',
  'probador virtual para WooCommerce',
  'aumentar ventas tienda ropa online',
  'reducir devoluciones tienda online',
  'virtual try-on Latam',
  'probador virtual sin app',
  'probador de ropa virtual Venezuela',
  'tienda ropa online Venezuela IA',
  ```
- **Fuente:** [bluethings.co](https://www.bluethings.co/blog/seo-in-latin-america-complete-guide) —
  tratar cada país como programa SEO separado; [datareportal.com](https://datareportal.com/reports/digital-2026-venezuela) — Venezuela: 16.6M usuarios de redes sociales.

### 7. Estructura de encabezados (H1/H2/H3) en LandingClient
- **Problema:** `LandingClient.tsx` es Client Component — el crawler puede tener dificultades
  para indexar contenido renderizado en cliente.
- **Acción:** Convertir secciones estáticas (hero, stats, pricing, steps, testimonials) a Server Components.
  Solo partes interactivas (selector de precio, botones con router.push) deben ser Client Components.
- **Beneficio:** HTML puro mejora tiempo de indexación y Core Web Vitals (LCP).
- **Fuente:** [veduis.com](https://veduis.com/blog/core-web-vitals-seo-impact-guide/) — LCP es pilar de CWV 2026.

### 8. JSON-LD — Ampliar schemas
- **Problema:** El JSON-LD tiene Organization, WebSite y SoftwareApplication, pero faltan schemas
  de alto valor para SaaS en Latam.
- **Acciones:**
  - Agregar `FAQPage` schema con las preguntas del `FaqSection` — alto impacto para featured snippets.
  - Agregar `PriceSpecification` con `validFrom`, `eligibleRegion` (CO, MX, AR, CL, PE, **VE**).
  - En `/planes`, agregar schema `Product` con `offers` para cada plan.
  - En mini-landings, agregar schema `LocalBusiness` o `Store` con datos de la marca.
- **Fuente:** [agentberlin.ai](https://agentberlin.ai/blog/schema-markup-saas-2026) —
  schema markup aumenta CTR 40% y visibilidad SEO 36.6%.

### 9. Página `/register` sin metadata
- **Acción:**
  ```ts
  export const metadata: Metadata = {
    title: 'Crear cuenta gratis — Lookitry',
    description: 'Crea tu cuenta y activa el probador virtual con IA para tu tienda. 7 días gratis, sin tarjeta de crédito.',
    robots: { index: true, follow: false },
  };
  ```

### 10. Atributos `alt` en imágenes de mini-landings
- **Problema:** Imágenes de productos probablemente usan alt genérico o vacío.
- **Acción:** En `MiniLanding`, usar `alt={product.name}` y `alt={brand.name}` en imágenes de marca.

### 11. Velocidad de carga — Core Web Vitals
- **Problema:** Estilos inline `fontFamily: 'Syne, sans-serif'` crean dependencia redundante
  cuando las fuentes ya están cargadas con `next/font`.
- **Acciones:**
  - Eliminar todos los `style={{ fontFamily: 'Syne, sans-serif' }}` inline.
  - Reemplazar por clases CSS (`font-syne`, `font-dm-sans`) usando variables CSS (`--font-syne`, `--font-dm-sans`).
  - Revisar que imágenes de `/steps/paso-*.webp` usen `sizes` correctos y `loading="lazy"`.
- **Fuente:** [veduis.com](https://veduis.com/blog/core-web-vitals-seo-impact-guide/) —
  INP <200ms = bueno. En Latam con 3G/4G el impacto es mayor. Venezuela: 76.3% conexiones móviles.

### 12. Breadcrumbs en páginas internas
- **Problema:** No hay breadcrumbs en `/planes`, `/terminos` ni mini-landings.
- **Acción:** Agregar `BreadcrumbList` JSON-LD:
  ```json
  { "@type": "BreadcrumbList", "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://[dominio]/" },
    { "@type": "ListItem", "position": 2, "name": "Planes", "item": "https://[dominio]/planes" }
  ]}
  ```

---

## PRIORIDAD BAJA — Optimizaciones adicionales

### 13. Hreflang para variantes regionales — incluir Venezuela
- **Problema:** El sitio apunta a múltiples países de Latam pero no tiene hreflang.
  Google puede mostrar la versión incorrecta según el país del usuario.
- **Acción:** Agregar `alternates.languages` en el metadata global:
  ```ts
  alternates: {
    canonical: BASE_URL,
    languages: {
      'es': BASE_URL,
      'es-CO': BASE_URL,
      'es-MX': BASE_URL,
      'es-AR': BASE_URL,
      'es-CL': BASE_URL,
      'es-PE': BASE_URL,
      'es-VE': BASE_URL,  // Venezuela — 17.6M usuarios de internet
    }
  }
  ```
- **Fuente:** [bluethings.co](https://www.bluethings.co/blog/seo-in-latin-america-complete-guide) —
  tratar cada país como programa SEO separado.

### 14. Robots.txt — Agregar rutas adicionales a disallow
- **Acción:** Agregar a `disallow`:
  ```
  /checkout/
  /pago-exitoso/
  /trial-payment/
  /trial-activado/
  /registro-pro/
  /auth/
  /verify-email/
  /embed/
  ```
- **Archivo:** `src/app/robots.ts`

### 15. Página 404 personalizada
- **Problema:** No existe `src/app/not-found.tsx`.
- **Acción:** Crear con nav, mensaje claro y links a homepage y `/planes`.

### 16. Sitemap de imágenes
- **Problema:** Google Images es canal de tráfico relevante para plataforma de moda.
- **Acción:** Extender sitemap principal con imágenes de `/steps/paso-*.webp` y OG image.

### 17. Performance — Eliminar `cache: 'no-store'` en mini-landings
- **Problema:** `sitio/[brandSlug]/page.tsx` usa `cache: 'no-store'` — deshabilita caché de Next.js
  y aumenta el TTFB. Crítico en Venezuela donde la latencia de red es mayor.
- **Acción:** Cambiar a `revalidate: 60` (ISR). Agregar endpoint de revalidación manual.

### 18. Verificación en Google Search Console y Bing Webmaster Tools
- **Acción:**
  - Verificar en [Google Search Console](https://search.google.com/search-console)
  - Verificar en [Bing Webmaster Tools](https://www.bing.com/webmasters) — Bing tiene cuota relevante en MX y AR
  - Enviar sitemap manualmente tras cada deploy importante

### 19. Schema de Reviews/Ratings
- **Problema:** Los testimonios en la landing no tienen markup estructurado.
- **Acción:** Agregar schema `Review` o `AggregateRating` en JSON-LD de homepage.
  Puede generar estrellas en resultados de búsqueda.
- **Fuente:** [agentberlin.ai](https://agentberlin.ai/blog/schema-markup-saas-2026) —
  Review/AggregateRating es uno de los 6 schemas esenciales para SaaS.

### 20. Página de blog / contenido SEO
- **Problema:** Sin contenido editorial no hay captura de tráfico orgánico de cola larga.
- **Acción (largo plazo):** Crear sección `/blog` con artículos orientados a keywords como:
  - "cómo aumentar ventas en tienda de ropa online"
  - "probador virtual para Instagram: guía completa"
  - "reducir devoluciones en tienda online con IA"
  - "cómo integrar un widget de prueba virtual en tu tienda"
  - "probador virtual de ropa para tiendas en Venezuela"
- **Fuente:** Contenido editorial es el canal más efectivo para tráfico orgánico de cola larga en Latam.

---

## Checklist de implementación

| # | Tarea | Prioridad | Esfuerzo | Estado |
|---|-------|-----------|----------|--------|
| 1 | Migrar a dominio propio (lookitry.com) | Alta | Alto | Pendiente |
| 2 | Metadata en `/planes` y `/terminos` | Alta | Medio | Pendiente |
| 3 | Ampliar sitemap con rutas faltantes y mini-landings | Alta | Bajo | Pendiente |
| 4 | Crear/verificar OG image + OG dinámico para mini-landings | Alta | Medio | Pendiente |
| 5 | Canonical en `/pruebalo/[slug]` y `/sitio/[slug]` | Alta | Bajo | Pendiente |
| 6 | Ampliar keywords Latam + Venezuela en layout.tsx | Media | Bajo | Pendiente |
| 7 | Convertir secciones estáticas de landing a Server Components | Media | Alto | Pendiente |
| 8 | Ampliar JSON-LD: FAQPage, Product, LocalBusiness | Media | Medio | Pendiente |
| 9 | Metadata en `/register` | Media | Bajo | Pendiente |
| 10 | Alt text en imágenes de mini-landings | Media | Bajo | Pendiente |
| 11 | Eliminar fontFamily inline, usar clases CSS | Media | Medio | Pendiente |
| 12 | Breadcrumbs JSON-LD en páginas internas | Media | Bajo | Pendiente |
| 13 | Hreflang básico + es-VE en metadata global | Baja | Bajo | Pendiente |
| 14 | Ampliar disallow en robots.ts | Baja | Bajo | Pendiente |
| 15 | Crear página 404 personalizada | Baja | Bajo | Pendiente |
| 16 | Sitemap de imágenes | Baja | Bajo | Pendiente |
| 17 | ISR en mini-landings (revalidate: 60) | Baja | Bajo | Pendiente |
| 18 | Verificar en GSC y Bing Webmaster Tools | Baja | Bajo | Pendiente |
| 19 | Schema Reviews/AggregateRating | Baja | Bajo | Pendiente |
| 20 | Sección de blog con contenido editorial | Baja | Muy alto | Pendiente |
