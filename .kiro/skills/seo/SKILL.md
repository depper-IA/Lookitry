---
name: seo
description: Skill para gestionar, auditar y mejorar el SEO de Lookitry (Next.js 14 App Router). Cubre metadata, JSON-LD, sitemap, robots, OG tags, Core Web Vitals y estrategia de keywords para 2026.
---

# Skill: SEO — Lookitry 2026

## Cuándo usar este skill

Activa este skill cuando el usuario pida:
- Agregar o mejorar metadata de una página
- Crear o actualizar JSON-LD (structured data)
- Actualizar sitemap.ts o robots.ts
- Auditar el SEO de una página o del sitio completo
- Mejorar posicionamiento para keywords específicas
- Agregar Open Graph / Twitter Cards
- Optimizar para Core Web Vitals
- Crear una nueva página pública con SEO correcto desde el inicio

---

## Stack SEO del proyecto

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 App Router |
| Metadata API | `export const metadata: Metadata` (por página) |
| Metadata global | `frontend/src/app/layout.tsx` |
| Sitemap | `frontend/src/app/sitemap.ts` |
| Robots | `frontend/src/app/robots.ts` |
| Structured data | JSON-LD inline con `<script type="application/ld+json">` |
| OG Image | `/public/og-image.png` (1200×630) |
| Favicon | `/public/favicon.png` (64×64) |
| Fuentes | Plus Jakarta Sans + DM Sans (Google Fonts, `display: swap`) |

---

## URLs del sitio

| Entorno | URL base |
|---------|----------|
| Producción | `https://lookitry.com` |
| Local | `http://localhost:3000` |

Siempre usar la constante `BASE_URL = 'https://lookitry.com'` en los archivos de metadata.

---

## Páginas públicas indexadas (sitemap actual)

| Ruta | Priority | Frecuencia | Notas |
|------|----------|------------|-------|
| `/` | 1.0 | weekly | Landing principal con JSON-LD completo |
| `/planes` | 0.9 | weekly | Precios dinámicos desde pricing_config |
| `/register` | 0.8 | monthly | Registro de marca |
| `/login` | 0.5 | monthly | Login |
| `/sobre-nosotros` | 0.6 | monthly | About |
| `/terminos` | 0.4 | yearly | Términos y condiciones |
| `/politicas-privacidad` | 0.4 | yearly | Política de privacidad |

**Regla:** Al crear una nueva página pública, SIEMPRE agregarla al sitemap.ts.

---

## Páginas privadas (NO indexar)

Las siguientes rutas están en `disallow` en robots.ts y NO deben tener `index: true`:

```
/admin/, /dashboard/, /api/, /checkout/, /pago-exitoso/,
/trial-payment/, /trial-activado/, /registro-pro/, /auth/, /verify-email/, /embed/
```

Para páginas privadas, agregar en su metadata:
```typescript
robots: { index: false, follow: false }
```

---

## Patrón de metadata por página

### Página pública estándar

```typescript
import type { Metadata } from 'next';

const BASE_URL = 'https://lookitry.com';

export const metadata: Metadata = {
  title: 'Título de la página — Lookitry',
  description: 'Descripción de 150-160 caracteres con keyword principal al inicio.',
  alternates: {
    canonical: `${BASE_URL}/ruta-de-la-pagina`,
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/ruta-de-la-pagina`,
    title: 'Título OG — Lookitry',
    description: 'Descripción OG de 90-120 caracteres.',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Título Twitter',
    description: 'Descripción Twitter.',
    images: [`${BASE_URL}/og-image.png`],
  },
};
```

### Página privada (dashboard, admin, checkout)

```typescript
export const metadata: Metadata = {
  title: 'Nombre de la sección | Lookitry',
  robots: { index: false, follow: false },
};
```

---

## JSON-LD — Tipos usados en el proyecto

### Organization (solo en `/`)
```json
{
  "@type": "Organization",
  "@id": "https://lookitry.com/#organization",
  "name": "Lookitry",
  "url": "https://lookitry.com",
  "logo": { "@type": "ImageObject", "url": "https://lookitry.com/logo.svg" },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+57-310-543-6281",
    "contactType": "customer service",
    "areaServed": ["CO", "MX", "AR", "CL", "PE", "VE"],
    "availableLanguage": "Spanish"
  }
}
```

### BreadcrumbList (páginas internas)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://lookitry.com/" },
    { "@type": "ListItem", "position": 2, "name": "Nombre de la página", "item": "https://lookitry.com/ruta" }
  ]
}
```

### FAQPage (landing `/`)
Ya implementado. Agregar nuevas preguntas cuando se añadan features relevantes.

### SoftwareApplication (landing `/`)
Ya implementado. Actualizar `priceValidUntil` y `reviewCount` periódicamente.

### Article (para páginas de blog/contenido, si se crean)
```json
{
  "@type": "Article",
  "headline": "Título del artículo",
  "datePublished": "2026-01-15",
  "dateModified": "2026-03-20",
  "author": { "@type": "Organization", "name": "Lookitry" },
  "publisher": { "@id": "https://lookitry.com/#organization" }
}
```

---

## Keywords objetivo 2026

### Primarias (alta intención de compra)
- `probador virtual IA` — volumen medio, competencia baja en Latam
- `probador virtual tienda online` — intención comercial alta
- `widget probador virtual` — intención de integración
- `virtual try-on Colombia` / `virtual try-on México`
- `prueba ropa online sin app`

### Secundarias (long-tail)
- `probador virtual para Shopify`
- `probador virtual para WooCommerce`
- `probador virtual para Instagram`
- `reducir devoluciones tienda ropa online`
- `aumentar conversión tienda ropa`
- `probador virtual ropa Colombia`
- `probador virtual ropa México`
- `probador virtual ropa Venezuela`
- `probador virtual ropa Argentina`
- `probador virtual ropa Chile`
- `probador virtual ropa Perú`

### Por país (geo-targeting)
Cada país de Latam tiene su variante. Prioridad: CO > MX > VE > AR > CL > PE.

---

## Reglas de título y descripción

### Títulos (`<title>`)
- Formato: `Keyword principal — Lookitry` o `Nombre de sección | Lookitry`
- Longitud: 50-60 caracteres
- Keyword al inicio siempre que sea natural
- Nunca duplicar títulos entre páginas

### Descripciones (`<meta description>`)
- Longitud: 150-160 caracteres
- Keyword principal en las primeras palabras
- Incluir CTA implícito ("Intégralo en 10 minutos", "7 días gratis")
- Nunca duplicar descripciones entre páginas

### Open Graph
- Título OG: puede ser más largo que el `<title>` (hasta 90 chars)
- Descripción OG: 90-120 caracteres, más conversacional
- Imagen OG: siempre `og-image.png` (1200×630) — no crear imágenes OG por página a menos que se pida explícitamente

---

## Actualizar sitemap.ts

Al agregar una nueva página pública:

```typescript
// En frontend/src/app/sitemap.ts
{
  url: `${BASE_URL}/nueva-pagina`,
  lastModified: new Date(),
  changeFrequency: 'monthly', // weekly | monthly | yearly según el contenido
  priority: 0.7,              // 1.0 = home, 0.9 = planes, 0.8 = register, etc.
},
```

---

## Actualizar robots.ts

Al agregar una nueva página privada:

```typescript
// En frontend/src/app/robots.ts — agregar a la lista disallow
disallow: [
  // ... existentes ...
  '/nueva-pagina-privada/',
],
```

---

## Checklist SEO al crear una nueva página pública

- [ ] `export const metadata: Metadata` con `title`, `description`, `alternates.canonical`
- [ ] `robots: { index: true, follow: true }` (o no incluirlo, ya que el default del layout es `index: true`)
- [ ] `openGraph` con `url`, `title`, `description`, `images`
- [ ] `twitter` card (opcional pero recomendado)
- [ ] JSON-LD `BreadcrumbList` si es una página interna
- [ ] Agregar URL al `sitemap.ts`
- [ ] Verificar que NO esté en `disallow` de `robots.ts`
- [ ] `<h1>` único y con keyword principal
- [ ] Imágenes con `alt` descriptivo
- [ ] No hay texto duplicado de otras páginas

## Checklist SEO al crear una nueva página privada

- [ ] `robots: { index: false, follow: false }` en metadata
- [ ] Agregar ruta a `disallow` en `robots.ts`
- [ ] NO agregar al `sitemap.ts`

---

## Auditoría SEO rápida por página

Para auditar una página existente, verificar:

1. **Metadata**: ¿tiene `title`, `description`, `canonical`?
2. **OG tags**: ¿tiene `openGraph.url`, `openGraph.title`, `openGraph.images`?
3. **JSON-LD**: ¿tiene structured data apropiado para el tipo de página?
4. **H1**: ¿existe exactamente un `<h1>` con keyword?
5. **Imágenes**: ¿todas tienen `alt`?
6. **Canonical**: ¿apunta a la URL correcta sin trailing slash?
7. **Sitemap**: ¿está incluida si es pública?
8. **Robots**: ¿está en disallow si es privada?

---

## Herramientas de verificación (externas)

| Herramienta | URL | Para qué |
|-------------|-----|----------|
| Google Search Console | search.google.com/search-console | Indexación, errores, keywords |
| Rich Results Test | search.google.com/test/rich-results | Validar JSON-LD |
| OG Debugger (Facebook) | developers.facebook.com/tools/debug | Validar OG tags |
| Twitter Card Validator | cards-dev.twitter.com/validator | Validar Twitter cards |
| PageSpeed Insights | pagespeed.web.dev | Core Web Vitals |

---

## Notas importantes del proyecto

- La landing `/` tiene precios **hardcodeados** intencionalmente para SEO/SSR — no cambiar a dinámicos
- El `og-image.png` debe existir en `/public/og-image.png` — si no existe, crearlo (1200×630px)
- El `apple-touch-icon.png` debe existir en `/public/apple-touch-icon.png` (180×180px)
- Las URLs de `alternates.languages` en el layout cubren CO, MX, AR, CL, PE, VE — no agregar más sin consultar
- `fb:app_id` en el layout es el ID genérico de Facebook — no cambiar
- El `revalidate = 300` en `/planes` es intencional para ISR — no reducir
- Nunca usar `noindex` en páginas públicas del sitemap
- El `siteName` en OG siempre es `'Lookitry'` (sin variantes)
