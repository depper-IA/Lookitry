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
- [ ] T5.2: Deploy pendiente (autorizacion de Sam)
- [ ] T5.3: Medicion Pagespeed (post-deploy)
- [ ] T5.4: Documentar metricas

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