# Hero Video + Demo Page — Design Spec

**Fecha:** 2026-05-16
**Estado:** Aprobado — listo para implementar

---

## 1. Resumen

Dos cambios coordinados:

1. **Hero nuevo** — full-bleed video background estilo Shopify. Se elimina el widget del hero. Dos CTAs: "Pruébalo ahora gratis" (→ `/demo`) y "Ver planes" (→ `/planes`). Texto ciclante en la segunda línea.
2. **Página `/demo` nueva** — experiencia completa con mini-hero, widget funcional, panel de resultado en paralelo y upsell post-generación.

---

## 2. Hero Rediseño

### 2.1 Layout

- **Full-bleed video background** cobriendo el 100% del viewport (`min-h-screen`)
- Overlay oscuro: `linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.1) 100%)`
- Contenido posicionado **bottom-left** (como Shopify): `position: absolute; bottom: 80px; left: 48px`
- En mobile: centrado, `bottom: 40px`, padding horizontal `24px`

### 2.2 Video Background (temporal → permanente)

**Temporal (YouTube embed):**
```
https://www.youtube.com/embed/1ap0baidLVo?autoplay=1&mute=1&loop=1&playlist=1ap0baidLVo&controls=0&disablekb=1&playsinline=1&modestbranding=1&rel=0
```

Técnica de embed full-screen:
```tsx
<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
  <iframe
    src="https://www.youtube.com/embed/1ap0baidLVo?autoplay=1&mute=1&loop=1&playlist=1ap0baidLVo&controls=0&disablekb=1&playsinline=1&modestbranding=1&rel=0"
    className="absolute top-1/2 left-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2"
    allow="autoplay; encrypted-media"
  />
</div>
```

**Permanente (cuando esté listo el video VEO3):**
```
/public/videos/hero-bg.mp4
```
Reemplazar el iframe por `<video autoPlay muted loop playsInline>`.

### 2.3 Texto Ciclante — Opción D (Shopify formula)

Headline estructura:
```
Tu tienda puede ser
[palabra que rota]
```

Palabras que ciclan cada 3 segundos con fade+slide:
1. `una marca que vende.`
2. `un probador digital.`
3. `más que un catálogo.`

Implementación: array de strings + `useState` con `setInterval(3000)`. Animación via Framer Motion `AnimatePresence` + `motion.span` con `initial={{ opacity:0, y:12 }}` → `animate={{ opacity:1, y:0 }}` → `exit={{ opacity:0, y:-12 }}`.

### 2.4 CTAs

```tsx
// Primario (blanco, pill)
<Link href="/demo" className="...rounded-full bg-white text-dark font-black px-8 py-4...">
  Pruébalo ahora gratis
</Link>

// Secundario (outline blanco)
<Link href="/planes" className="...rounded-full border-2 border-white/50 text-white font-bold px-8 py-4...">
  Ver planes
</Link>
```

Sin el link "Por qué creamos Lookitry".

### 2.5 Navbar Transparente

`LandingNav` recibe prop `transparent?: boolean`. Cuando `transparent=true`:
- Estado inicial: `bg-transparent`
- Al hacer scroll > 20px: transiciona a `bg-dark/90 backdrop-blur-md`

Implementación: `useEffect` con `window.addEventListener('scroll', ...)` dentro de `LandingNav`.

`PremiumLanding` pasa `transparent={true}` al `LandingNav`.

---

## 3. Página `/demo`

### 3.1 Ruta

`frontend/src/app/demo/page.tsx` — Server Component que renderiza `DemoPageClient`.
`frontend/src/app/demo/DemoPageClient.tsx` — `'use client'` component.

### 3.2 Layout (Opción C — Experiencia completa)

```
┌─────────────────────────────────────────────────────┐
│  LandingNav (transparent, scroll-aware)              │
├─────────────────────────────────────────────────────┤
│  MINI HERO (dark, full-width)                        │
│  "Mirá cómo te queda antes de comprar."             │
│  [Subir mi foto]  [Ver ejemplos]                    │
├──────────────────────┬──────────────────────────────┤
│  TryOnDemoWidget     │  ResultPanel                 │
│  (columna izq)       │  (columna der)               │
│  - Selfie upload     │  - Imagen resultado           │
│  - Product selector  │  - Upsell post-gen            │
│  - CTA generar       │    "¿Te gustó? → Ver planes" │
├─────────────────────────────────────────────────────┤
│  LandingFooter                                      │
└─────────────────────────────────────────────────────┘
```

En mobile: columna única, widget arriba, resultado abajo.

### 3.3 Mini Hero

```tsx
<section className="bg-dark pt-24 pb-12 px-6 text-center">
  <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent mb-6">
    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
    Probador Virtual Gratuito
  </div>
  <h1 className="font-jakarta text-4xl font-black text-white mb-3">
    Mirá cómo te queda<br/>
    <span className="text-accent">antes de comprar.</span>
  </h1>
  <p className="text-white/50 text-base mb-8">1 generación gratis · Sin registro · Resultado en 30 segundos</p>
  <div className="flex gap-3 justify-center">
    <button onClick={scrollToWidget}>Subir mi foto</button>
    <button onClick={openExamples}>Ver ejemplos</button>
  </div>
</section>
```

### 3.4 TryOnDemoWidget

Extraer **toda** la lógica actual de `LandingHero.tsx` (estado del try-on, fetch de config, pasos select/selfie/loading/result, PostDemoModal, UpgradeModal) a un componente reutilizable:

```
frontend/src/components/tryon/TryOnDemoWidget.tsx
```

Props:
```ts
interface TryOnDemoWidgetProps {
  onResult?: (resultUrl: string) => void;  // notifica al ResultPanel
}
```

`LandingHero.tsx` queda **sin** lógica de widget — solo video background + texto + CTAs.

### 3.5 ResultPanel

Columna derecha en desktop. Muestra:
- Estado vacío: placeholder oscuro con icono, texto "Acá verás tu resultado"
- Estado con resultado: imagen generada + upsell card

```tsx
// Upsell card (aparece después de generación exitosa)
<div className="rounded-2xl border border-accent/20 bg-accent/8 p-5 text-center">
  <p className="text-accent font-black text-lg mb-1">¿Te gustó el resultado?</p>
  <p className="text-white/50 text-sm mb-4">Activá esto en tu tienda y tus clientes lo prueban también.</p>
  <Link href="/trial-checkout" className="...bg-accent text-white...">
    Activar en mi tienda — $20.000
  </Link>
  <Link href="/planes" className="...text-white/40 text-sm...">
    Ver todos los planes
  </Link>
</div>
```

### 3.6 PostDemoModal

El `PostDemoModal` existente se mueve de `LandingHero` a `DemoPageClient`. Mismo comportamiento: aparece 2s después del resultado, respeta `lead_captured` en localStorage.

---

## 4. Archivos Afectados

| Archivo | Acción |
|---|---|
| `components/landing/LandingHero.tsx` | Reescribir — eliminar widget, agregar video BG + texto ciclante + CTAs |
| `components/landing/LandingNav.tsx` | Agregar prop `transparent` + scroll listener |
| `components/landing/PremiumLanding.tsx` | Pasar `transparent={true}` a LandingNav |
| `components/landing/LandingCopy.ts` | Actualizar `hero.title`, `hero.cta`, agregar `hero.rotating_words` |
| `components/tryon/TryOnDemoWidget.tsx` | Crear — extraer lógica de widget de LandingHero |
| `app/demo/page.tsx` | Crear — Server Component |
| `app/demo/DemoPageClient.tsx` | Crear — layout completo de la página demo |

---

## 5. Detalles Técnicos

### Video fallback
Si el YouTube embed no carga (bloqueado, offline), mostrar un gradient animado:
```css
background: linear-gradient(135deg, #1a0e0a 0%, #080810 50%, #0a0808 100%);
animation: gradientShift 8s ease-in-out infinite alternate;
```

### Accesibilidad
- `<iframe>` del video: `title="Video de fondo decorativo"`, `aria-hidden="true"`
- Botón de video: opción de pausar (pequeño botón bottom-right del hero, visible solo en focus/hover)

### Performance
- `LandingHero` ya carga con `ssr: false` en `PremiumLanding` — sin cambio
- `/demo/page.tsx` carga `DemoPageClient` con `dynamic(..., { ssr: false })`
- El iframe del video carga con `loading="lazy"` 

### Mobile
- En mobile (`< lg`): video background activo pero más oscuro (overlay `rgba(0,0,0,0.75)`)
- Texto centrado, bottom → center vertical
- CTAs stack verticalmente

---

## 6. Notas de Reemplazo de Video

Cuando llegue el video de VEO3:
1. Colocarlo en `frontend/public/videos/hero-bg.mp4`
2. En `LandingHero.tsx` reemplazar el bloque `<iframe>` por:
```tsx
<video
  autoPlay muted loop playsInline
  className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
>
  <source src="/videos/hero-bg.mp4" type="video/mp4" />
</video>
```
