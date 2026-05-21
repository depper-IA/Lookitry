# SDD — Rendimiento y SEO: Lookitry.com Pagespeed Optimization

## Metadata

| Campo | Valor |
|-------|-------|
| **Spec** | `openspec/specs/performance-pagespeed-v1.md` |
| **Titulo** | Rendimiento y SEO Pagespeed Optimization |
| **Tipo** | Technical Improvement |
| **Prioridad** | P0 |
| **Creado** | 2026-05-21 |
| **Autor** | el Gentleman |
| **Estado** | `in-progress` |

---

## Resumen Ejecutivo

Optimizar el sitio Lookitry.com para mejorar las metricas Core Web Vitals (LCP, CLS, FID/INP) y SEO segun Google Pagespeed Insights. El objetivo es pasar de ~60-70 a +90 en mobile y +95 en desktop, reduciendo el Weight del hero video, habilitando optimizacion de imagenes en Next.js, agregando priority a imagenes above-the-fold, y anadiendo structured data para rich snippets.

---

## Contexto

El sitio actual presenta los siguientes problemas medidos via Pagespeed Insights:

- **LCP**: ~4-6s en mobile (objetivo <2.5s) — causado por video hero 4.2MB sin lazy load + imagenes sin `priority`
- **CLS**: ~0.05-0.1 (objetivo <0.1) — controlado pero riesgo por video sin poster
- **SEO Score**: ~85-90 (objetivo 95+) — falta structured data, itemprop semantics
- **unoptimized: true** en next.config.js causa que imagenes se sirvan en JPG/PNG original en lugar de WebP/AVIF

---

## Objetivos (Goals)

| # | Objetivo | Metrica | Target |
|---|---------|---------|--------|
| G1 | Reducir LCP mobile | Lighthouse LCP | <2.5s |
| G2 | Habilitar optimizacion automatica de imagenes | Next.js output | WebP/AVIF |
| G3 | Eliminar peso innecesario del video | hero.webm | Poster + preload=none |
| G4 | Agregar structured data para rich snippets | JSON-LD | Product + Review |
| G5 | Corregir imagenes above-the-fold sin priority | Lighthouse | 0 LCP warnings |
| G6 | Mejorar SEO score general | Pagespeed SEO | >95 |

---

## No-Goals

- No modificar la estructura de componentes ni el diseno visual
- No agregar nuevas funcionalidades
- No tocar el backend ni APIs
- No modificar el sistema de autenticacion
- No cambiar la arquitectura de caching existing

---

## Restricciones Tecnicas

1. **Next.js 14** con standalone output
2. **React 18** con streaming SSR
3. **Tailwind CSS** — no remover
4. **Framer Motion** para animaciones
5. **Supabase** para datos dinamicos
6. **CDN actual**: el sitio sirve desde el servidor con HSTS
7. **CSP headers** existentes deben mantenerse intactos
8. **next/image unoptimized: true** actualmente — cambiar a false

---

## Dependencias

| Dependencia | Tipo | Justificacion |
|-------------|------|---------------|
| `hero.webm` (4.2MB) | Video actual | Crear poster image para lazy load |
| `next.config.js` | Config | `unoptimized: true` actualmente |
| `LandingHero.tsx` | Componente | Video sin poster ni preload control |
| `LandingSteps.tsx` | Componente | Imagen above-the-fold sin priority |
| `ReviewsSlider.tsx` | Componente | Avatares sin priority |
| `page.tsx` | Ruta | Falta JSON-LD structured data |
| `next/image` | Modulo | Necesita formatos AVIF/WebP |

---

## Artefactos a Generar

1. **Poster image**: `/public/videos/hero-poster.webp` (~30-50KB)
2. **next.config.js actualizado**: `unoptimized: false` + formatos AVIF/WebP
3. **LandingHero.tsx actualizado**: `preload="none"` + `poster`
4. **LandingSteps.tsx actualizado**: `priority` en imagen LCP
5. **ReviewsSlider.tsx actualizado**: `priority` en avatares
6. **page.tsx actualizado**: JSON-LD para Product + Review
7. **LandingSocialProof.tsx**: revisar priority en logos
8. **LandingOnboardingSteps.tsx**: revisar priority en iconos

---

## Plan de Trabajo (Tasks)

### Fase 1 — Video Hero Optimization (P0)

- [ ] **T1.1**: Generar poster image del video hero (`hero-poster.webp`, ~30KB)
- [ ] **T1.2**: Actualizar `LandingHero.tsx` con `preload="none"` y `poster="/videos/hero-poster.webp"`
- [ ] **T1.3**: Verificar que el video no bloquea LCP

### Fase 2 — Next.js Image Optimization (P0)

- [ ] **T2.1**: Cambiar `unoptimized: true` -> `false` en `next.config.js`
- [ ] **T2.2**: Agregar `formats: ['image/avif', 'image/webp']` en `images` config
- [ ] **T2.3**: Agregar `quality: 80` global + `sizes` descriptivo en todas las imagenes

### Fase 3 — Priority Images Above-the-Fold (P0)

- [ ] **T3.1**: Agregar `priority` a `LandingSteps.tsx` imagen LCP
- [ ] **T3.2**: Agregar `priority` a `ReviewsSlider.tsx` avatares
- [ ] **T3.3**: Revisar `LandingNav.tsx` megamenu images — lazy load apropiado
- [ ] **T3.4**: Revisar `LandingSocialProof.tsx` logos

### Fase 4 — Structured Data SEO (P1)

- [ ] **T4.1**: Agregar JSON-LD `Product` en `page.tsx`
- [ ] **T4.2**: Agregar JSON-LD `Review` y `AggregateRating` en `page.tsx`
- [ ] **T4.3**: Agregar `itemprop` semantics a `ReviewsSlider.tsx`
- [ ] **T4.4**: Agregar JSON-LD en `/planes` page

### Fase 5 — Verificacion y Medicion (P1)

- [ ] **T5.1**: Run `pnpm build` para verificar no hay errores
- [ ] **T5.2**: Deploy al entorno de staging/review
- [ ] **T5.3**: Medir con PageSpeed Insights (antes vs despues)
- [ ] **T5.4**: Documentar metricas en spec

---

## Criterios de Aceptacion (Acceptance Criteria)

| AC# | Criterio | Validacion |
|-----|----------|-----------|
| AC1 | `hero.webm` ya no bloquea LCP | PageSpeed LCP <2.5s en mobile |
| AC2 | next.config.js tiene `unoptimized: false` | Git diff confirma cambio |
| AC3 | Todas las imagenes above-the-fold tienen `priority` | Lighthouse report: 0 LCP warnings |
| AC4 | El video muestra poster mientras carga | CLS <0.1 |
| AC5 | JSON-LD de Product y Review existe en home | Google Rich Results Test: passes |
| AC6 | Las imagenes se sirven en WebP | DevTools Network: content-type image/webp |
| AC7 | `pnpm build` successful sin errores | Build output: 0 errors |
| AC8 | SEO score Pagespeed >95 | Pagespeed SEO audit |

---

## Estimacion de Impacto

| Problema | Impacto Actual | Impacto Estimado Post-Fix |
|----------|---------------|--------------------------|
| LCP mobile | ~4-6s | ~1.5-2.5s |
| CLS | ~0.05-0.1 | ~0.02-0.05 |
| SEO Score | ~85-90 | ~95-98 |
| Peso imagenes | ~1.5MB | ~400-600KB (WebP) |
| Video weight | 4.2MB blocking | Poster ~40KB solo |

---

## Riesgos

| Riesgo | Severidad | Mitigacion |
|--------|----------|------------|
| Poster image no se ve bien esteticamente | Media | Revisar manualmente antes de deploy |
| `unoptimized: false` rompe alguna imagen SVG | Baja | Testear en staging antes de production |
| Video poster aumenta el total de requests | Baja | Solo 1 request adicional, peso bajo |
| JSON-LD malformado causa penalizacion | Baja | Validar con Google Rich Results Test |

---

## Siguiente Paso

Proceder a **T1.1**: Generar poster image del video hero.

---