# Guía Técnica del Widget Lookitry

## Resumen

El widget de Lookitry es un componente JavaScript autocontenido que permite a las tiendas integrar el probador virtual sin iframes ni desarrollos backend. Es el **método principal y recomendado** de integración.

---

## Arquitectura del Widget

### Método Principal: Script (`/widget.js`)

El widget script es un loader JavaScript que:
1. Se carga de forma asíncrona (`async defer`)
2. Inyecta el probador directamente en el DOM
3. Se adapta automáticamente al diseño de la tienda
4. No requiere iframe ni contenedor de dimensiones fijas

**Código de integración:**
```html
<div id="lookitry-tester-container" data-slug="tu-marca"></div>
<script src="https://lookitry.com/widget.js" async defer></script>
```

### Método Legacy: Iframe (`/embed/[brandSlug]`)

La ruta `/embed/[brandSlug]` existe para:
- **Fallback** cuando el widget script no funciona en el entorno del cliente
- **Integraciones específicas** que el cliente requiera explícitamente
- **Plugin WooCommerce** — internamente usa script primero, iframe como fallback

> **Importante:** El iframe NO es el método principal. Es legacy y de uso restringido.

---

## Cómo Funciona el Widget Script

### Flujo de Carga

```
1. Página del cliente carga widget.js
2. widget.js detecta #lookitry-tester-container
3. widget.js lee data-slug y otros atributos
4. widget.js inyecta el probador modular
5. Comunicación postMessage con la página host
```

### Atributos del Contenedor

| Atributo | Descripción | Ejemplo |
|----------|-------------|---------|
| `data-slug` | Slug de la marca (requerido) | `data-slug="mi-marca"` |
| `data-product-id` | ID del producto específico | `data-product-id="123"` |
| `data-modal` | Abrir en modal | `data-modal="true"` |
| `data-hide-legal` | Ocultar textos legales | `data-hide-legal="true"` |
| `data-height` | Altura personalizada | `data-height="760"` |

### API JavaScript

El widget expone `window.LookitryWidget`:

```typescript
interface LookitryWidget {
  init(container: HTMLElement, options?: WidgetOptions): void;
}

interface WidgetOptions {
  slug?: string;
  productId?: string;
  modal?: boolean;
  hideLegal?: boolean;
  height?: number;
  onTryonComplete?: (data: TryonResult) => void;
  onError?: (error: Error) => void;
}

interface TryonResult {
  imageUrl: string;
  productName: string;
  generationId: string;
}
```

---

## Integración con Plugins

### WooCommerce (Plugin lookitry-woocommerce)

El plugin de WordPress:
1. **Método principal:** Carga `widget.js` dinámicamente
2. **Fallback a iframe:** Si `widget.js` falla, usa `/embed/[brandSlug]`

```javascript
// Del archivo: lookitry-woocommerce/assets/js/lookitry-public.js

const widgetScriptFallbackUrl = 'https://lookitry.com/widget.js';

ensureWidgetScript(widgetUrl)
  .then(function() {
    // Éxito: usar widget script
    renderWidgetInModal({ brandSlug, productId });
  })
  .catch(function(error) {
    // Fallback: usar iframe legacy
    renderIframeFallback(embedUrl);
  });
```

### Shopify

El método recomendado es el script insertado en `theme.liquid`:

```html
<div id="lookitry-tester-container" data-slug="tu-marca"></div>
<script src="https://lookitry.com/widget.js" async defer></script>
```

---

## Comparativa: Script vs Iframe

| Característica | Script (`widget.js`) | Iframe (`/embed`) |
|----------------|----------------------|-------------------|
| **Método** | Principal | Legacy |
| **Rendimiento** | Optimizado, lazy-load | Mayor overhead |
| **Adaptación visual** | Se adapta al contenedor | Dimensiones fijas |
| **Comunicación** | postMessage API | postMessage API |
| **CORS** | Sin restricciones | Requiere `frame-ancestors` |
| **Fallback** | No necesita | Solo para errores |

---

## Endpoints Relacionados

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/widget.js` | GET | Loader JavaScript del widget |
| `/embed/[brandSlug]` | GET | Página embed legacy |
| `/api/embed/wordpress/init` | POST | Inicialización para plugin WordPress |
| `/api/pruebalo/:brandSlug` | GET/POST | API del probador |

---

## Seguridad

- El widget script solo se carga desde dominios autorizados (`lookitry.com`, `www.lookitry.com`)
- La comunicación entre widget y página host usa `postMessage` con validación de origen
- El API key del cliente se pasa por header `x-api-key`, nunca en el código embed
- CSP del frontend permite `frame-ancestors` solo para rutas embebibles

---

## Notas de Implementación

### EmbedSection.tsx (Dashboard)

El componente `frontend/src/components/dashboard/EmbedSection.tsx` genera ambos códigos:
- **Widget code** (script): Método principal ofrecido
- **Iframe code**: Legacy, marcado como "iFrame clásico"

```typescript
const widgetCode = `<div id="lookitry-tester-container" data-slug="${brand?.slug}"></div>
<script src="${baseUrl}/widget.js" async defer></script>`;

const iframeCode = `<iframe src="${baseUrl}/embed/${brand?.slug}" ...></iframe>`;
```

### Middleware CSP

El middleware de Next.js configura:
- `frame-ancestors` para rutas embebibles (`/embed/*`, `/pruebalo/*`)
- `script-src` permitiendo scripts de `widget.js`

---

## Sistema de Marca de Agua (Watermark)

### Lógica de Visibilidad

El widget incluye un sistema de marca de agua "Powered by Lookitry AI" que aparece en las imágenes generadas según el plan del cliente:

| Plan | Marca de Agua | Detalle |
|------|---------------|---------|
| **TRIAL** | Visible | "Lookitry AI" badge en esquina inferior derecha |
| **BASIC** | Visible | "Lookitry AI" badge en esquina inferior derecha |
| **PRO** | Oculta | Sin marca — beneficio premium |
| **ENTERPRISE** | Oculta | Sin marca — beneficio premium |

### Implementación

```tsx
// En ResultDisplay.tsx
function Watermark({ plan }: { plan?: string }) {
  const PREMIUM_PLANS = ['PRO', 'ENTERPRISE'];
  const showWatermark = !plan || !PREMIUM_PLANS.includes(plan.toUpperCase());

  if (!showWatermark) return null;

  return (
    <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
      <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
        {/* Logo SVG mini de Lookitry */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF5C3A"/>
          <path d="M2 17L12 22L22 17" stroke="#FF5C3A" strokeWidth="1.5"/>
          <path d="M2 12L12 17L22 12" stroke="#FF5C3A" strokeWidth="1.5"/>
        </svg>
        <span className="text-white/90 text-[9px] font-black uppercase tracking-wider">
          Lookitry AI
        </span>
      </div>
    </div>
  );
}
```

### Propósito

1. **Branding** — Cada imagen generada incluye atribución a Lookitry
2. **Monetización** — Incentivo para upgrade a PRO/ENTERPRISE
3. **Viralidad** — Usuarios comparten imágenes "con marca", difundiendo el producto

### Archivo

- **Ubicación:** `frontend/src/components/tryon/ResultDisplay.tsx`
- **Línea:** ~55 (invocación), ~7-45 (definición)
- **Prop:** `brandPlan` se pasa desde el componente padre

---

**Última actualización:** Abril 2026
