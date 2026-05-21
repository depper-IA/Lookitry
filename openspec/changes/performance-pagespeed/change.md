# Change Record — performance-pagespeed

| Campo | Valor |
|-------|-------|
| **Change ID** | `performance-pagespeed` |
| **Spec** | `openspec/specs/performance-pagespeed-v1.md` |
| **Estado** | `completed` |
| **Completado** | 2026-05-21 |

---

## Resumen de Cambios

### Fase 1 — Video Hero Optimization
- [x] T1.1: Generado `hero-poster.webp` (46KB) desde el video
- [x] T1.2: `LandingHero.tsx` — `preload="none"` + `poster="/videos/hero-poster.webp"`

### Fase 2 — Next.js Image Optimization
- [x] T2.1: `unoptimized: true` -> `false` en `next.config.js`
- [x] T2.2: Agregado `formats: ['image/avif', 'image/webp']`

### Fase 3 — Priority Images Above-the-Fold
- [x] T3.1: `priority` agregado a `LandingSteps.tsx` (imagen LCP)
- [x] T3.2: `priority` agregado a `ReviewsSlider.tsx` (avatares)

### Fase 4 — Structured Data SEO
- [x] T4.1: Creado `review.ts` en `@/lib/seo` con `reviewSchema()` y `aggregateRatingSchema()`
- [x] T4.2: Agregado `AggregateRating` + `Review[]` al JSON-LD en `page.tsx`
- [x] T4.3: Exportados desde `lib/seo/index.ts`

### Fase 5 — Verificacion
- [x] T5.1: `pnpm build` exitoso — 0 errores
- [x] T5.2: Deploy completado (commit 92c7da3a)
- [x] T5.3: Medicion Pagespeed real — masiva de imagenes 3.8MB identificadas
- [x] T5.4: Optimizacion de imagenes del LookBook y chat widget

### Imagenes Optimizadas (Ahorro ~3.8MB)

| Archivo | Antes | Despues | Ahorro |
|---------|-------|---------|--------|
| `rebecca-avatar.png` | 1.5MB | 6.4KB (WebP) | 99.5% |
| `rebecca.png` | 1.9MB | 25KB (WebP) | 98.7% |
| `skirt-blue.webp` | 1.6MB | 2.6KB | 99.8% |
| `garment-product.webp` | 118KB | 4.7KB | 96% |
| `dress-white.webp` | 266KB | 5.5KB | 97.9% |
| `satin-bg.png` | 275KB | 22KB (WebP) | 92% |
| `falda-azul-bg.png` | 271KB | 29KB (WebP) | 89% |
| `vestido-blanco-bg.png` | 320KB | 31KB (WebP) | 90% |
| `blusa-satin-chica.jpg` | 412KB | 21KB (WebP) | 95% |
| `vestido-blanco-chica.jpg` | 407KB | 21KB (WebP) | 95% |
| `falda-azul-chica.jpg` | 409KB | 22KB (WebP) | 95% |

---

## Archivos Modificados

- `frontend/src/components/landing/LandingHero.tsx`
- `frontend/next.config.js`
- `frontend/src/components/landing/LandingSteps.tsx`
- `frontend/src/components/landing/ReviewsSlider.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/lib/seo/types.ts`
- `frontend/src/lib/seo/review.ts` (nuevo)
- `frontend/src/lib/seo/index.ts`
- `frontend/public/videos/hero-poster.webp` (nuevo, 46KB)

---