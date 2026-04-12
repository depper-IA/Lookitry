# SPEC: Mini-Landing Templates — Mejoras Incrementales SEO/UX/Performance
**Fecha:** 2026-04-12  
**Autor:** Sammy (contexto WebWizard)  
**Status:** Borrador

---

## 1. Resumen

Aplicar mejoras incrementales a los 3 templates de mini-landing (Classic, Editorial, Moderno) para potenciar SEO, UX/UI, accesibilidad y performance sin redesign radical.

---

## 2. Scope

### 2.1 Templates afectados
- `TemplateClassic.tsx` (409 líneas)
- `TemplateEditorial.tsx` (328 líneas)
- `TemplateModerno.tsx` (262 líneas)

### 2.2 Áreas de mejora

| # | Área | Prioridad |
|---|------|----------|
| 1 | SEO - OpenGraph dinámico por template | 🔴 Alta |
| 2 | SEO - JSON-LD Schema.org Product | 🔴 Alta |
| 3 | SEO - Meta description customizable | 🟡 Media |
| 4 | UX - Skeleton loaders en productos | 🔴 Alta |
| 5 | UX - Microinteracciones hover | 🟡 Media |
| 6 | UI - Animaciones de entrada suaves | 🟡 Media |
| 7 | UI - Transición de productos mejorada | 🟡 Media |
| 8 | Accesibilidad - Focus visible mejorado | 🔴 Alta |
| 9 | Accesibilidad - aria-labels faltantes | 🟡 Media |
| 10 | Performance - Lazy loading con Next/Image | 🔴 Alta |
| 11 | Performance - Blur placeholder en imágenes | 🟡 Media |

---

## 3. Detalle de Cambios

### 3.1 SEO

#### 3.1.1 OpenGraph dinámico
Agregar `<Head>` con meta tags dinámicos basados en `brand.name`, `brand.slogan`, y `brand.brand_description`:

```tsx
// Cada template tendrá:
<Head>
  <title>{brand.name} — Prueba virtual con IA | Lookitry</title>
  <meta name="description" content={brand.brand_description || `Pruébate virtualmente la ropa de ${brand.name}`} />
  <meta property="og:title" content={`${brand.name} — Pruébatelo con IA`} />
  <meta property="og:description" content={brand.brand_description || 'Sin devoluciones, sin dudas'} />
  <meta property="og:image" content={brand.cover_image_url || brand.logo} />
  <meta property="og:type" content="website" />
</Head>
```

#### 3.1.2 JSON-LD Schema.org Product
Agregar schema markup para rich snippets en Google:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": brand.name,
      "description": brand.brand_description,
      "image": brand.cover_image_url,
      "brand": {
        "@type": "Brand",
        "name": brand.name
      },
      "offers": {
        "@type": "Offer",
        "url": `${process.env.NEXT_PUBLIC_BASE_URL}/sitio/${brand.slug}`,
        "priceCurrency": "COP"
      }
    })
  }}
/>
```

#### 3.1.3 Meta description customizable
Usar `brand.brand_description` como meta description principal. Si no existe, fallback a texto genérico relacionado con Try-On.

---

### 3.2 UX - Skeleton Loaders

**Estado actual:** Los productos cargan sin estado de loading (puede mostrar spinner vacío o flash de contenido).

**Cambio:** Integrar el componente `Skeleton.tsx` ya creado:

```tsx
// En cada template, envolver lista de productos con:
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  if (products && products.length > 0) {
    setIsLoading(false);
  }
}, [products]);

// Render:
{isLoading ? (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {[0,1,2,3,4,5].map(i => <ProductSkeleton key={i} />)}
  </div>
) : (
  <div className="grid ...">/* productos */</div>
)}
```

**Componente ProductSkeleton reutilizable:**
```tsx
function ProductSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100 p-3">
      <Skeleton height="aspect-[3/4]" borderRadius="1.5rem" />
      <div className="mt-3 space-y-2">
        <Skeleton height="0.75rem" width="80%" />
        <Skeleton height="0.5rem" width="40%" />
      </div>
    </div>
  );
}
```

---

### 3.3 UX - Microinteracciones

**Hover effects mejorados:**

| Elemento | Efecto actual | Efecto nuevo |
|----------|---------------|--------------|
| Product cards | scale-105 + shadow | scale-105 + shadow-xl + brightness sutil |
| CTA buttons | hover:brightness + scale | hover:brightness + scale + glow sutil si primary color |
| Social icons | scale-110 | scale-110 + color fill |

**Transiciones CSS:**
```css
/* Usar transitions existentes mejorados */
.product-card {
  @apply transition-all duration-500;
}
.product-card:hover {
  @apply shadow-xl scale-[1.02];
  filter: brightness(1.02);
}
```

---

### 3.4 UI - Animaciones de Entrada

**Usar animate-in de Tailwind + variants ya definidas:**
- Hero: `animate-in fade-in slide-in-from-bottom-4 duration-1000`
- Productos: `animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100`
- Trust bar: `animate-in fade-in duration-700 delay-200`

**Scroll-triggered animations (IntersectionObserver):**
```tsx
// Hook reutilizable
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return { ref, isVisible };
}
```

---

### 3.5 Accesibilidad - Focus Visible

**Mejorar focus rings:**

```tsx
// En todos los elementos interactivos:
className={`
  ...
  focus-visible:outline-none 
  focus-visible:ring-2 
  focus-visible:ring-[#FF5C3A] 
  focus-visible:ring-offset-2
`}
// NOTA: Ya existe en algunos, verificar que TODOS lo tengan
```

**Checklist de aria-labels faltantes:**
- [ ] Botones de scroll (catalogo, probador)
- [ ] Selector de producto (si no tiene label visual)
- [ ] Botón de WhatsApp FAB (ya tiene ✅)
- [ ] Botones de red social (ya tiene ✅)

---

### 3.6 Performance - Lazy Loading

**Cambios en ProductImage:**

```tsx
// Usar Next/Image en vez de <img> directo
import Image from 'next/image';

// En los templates:
<ProductImage 
  src={product.image_url} 
  alt={product.name}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
  placeholder="blur"
  blurDataURL={product.blur_hash || 'data:image/jpeg;base64,...'}
/>
```

**Blur placeholder:**
- Generar blur hash en upload
- Guardar en `products.blur_hash`
- Usar como fallback

---

## 4. Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `TemplateClassic.tsx` | +Head SEO, +JSON-LD, +Skeleton, +Lazy, +Focus |
| `TemplateEditorial.tsx` | +Head SEO, +JSON-LD, +Skeleton, +Lazy, +Focus |
| `TemplateModerno.tsx` | +Head SEO, +JSON-LD, +Skeleton, +Lazy, +Focus |
| `shared.tsx` | +ProductSkeleton, +useScrollReveal hook |

---

## 5. Validación

### 5.1 Checklist de implementación
- [ ] OpenGraph tags en cada template
- [ ] JSON-LD schema en cada template  
- [ ] Skeleton loading state en grid de productos
- [ ] Lazy loading con Next/Image
- [ ] Focus rings en todos los interactivos
- [ ] aria-labels completos
- [ ] Scroll reveal animations
- [ ] Microinteracciones hover mejoradas

### 5.2 Testing
- Lighthouse SEO score > 90
- Lighthouse Performance score > 85
- Lighthouse Accessibility score > 90
- Sin errores de consola
- Mobile-first responsive check

---

## 6. Orden de Implementación

1. **SEO** (OpenGraph + JSON-LD) — 30 min
2. **Performance** (Lazy loading) — 30 min  
3. **UX** (Skeleton + Microinteracciones) — 45 min
4. **Accesibilidad** (Focus + aria) — 30 min
5. **UI Polish** (Animaciones entrada) — 30 min

**Total estimado:** ~3 horas

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Romper productos existentes | Baja | Alto | Tests locales antes de commit |
| Imágenes sin blur_hash | Media | Bajo | Fallback a color sólido |
| Schema markup malformado | Baja | Medio | Validar JSON-LD |

---

**Última actualización:** 2026-04-12 — Creado
