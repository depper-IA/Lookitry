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

El widget incluye DOS tipos de watermark:

**1. Watermark Visual (Frontend - superposición en pantalla)**
Aplica a las imágenes mientras se ven en el widget:

| Plan | Watermark Visual | Posición |
|------|-----------------|----------|
| **TRIAL** | `/watermark-trial.webp` | Ancho completo en parte inferior |
| **BASIC** | `/watermark-basic.webp` | Esquina inferior izquierda (w-20) |
| **PRO** | Sin watermark visual | — |
| **ENTERPRISE** | Sin watermark visual | — |

**2. Watermark Incrustado (Backend - queda en la imagen descargada)**
Se aplica mediante `image.service.ts` con Sharp cuando el usuario descarga la imagen:

| Plan | Watermark Archivo | Posición |
|------|-------------------|----------|
| **TRIAL** | `assets/watermark-trial.webp` | Centrado, 45% del ancho |
| **BASIC** | `assets/watermark-basic.webp` | Esquina inferior derecha, 10% del ancho |
| **PRO** | Sin watermark | — |
| **ENTERPRISE** | Sin watermark | — |

### Implementación Visual (Frontend)

```tsx
// En ResultDisplay.tsx
function Watermark({ plan }: { plan?: string }) {
  if (plan !== 'BASIC' && plan !== 'TRIAL') return null;

  if (plan === 'BASIC') {
    // Logo pequeño en esquina inferior izquierda
    return (
      <div className="absolute bottom-4 left-4 w-20 pointer-events-none select-none z-10 opacity-40">
        <img src="/watermark-basic.webp" alt="Lookitry" className="w-full h-auto" />
      </div>
    );
  }

  // TRIAL: Logo ancho ocupando todo el ancho inferior
  return (
    <div className="absolute bottom-0 left-0 w-full pointer-events-none select-none z-10 opacity-60">
      <img src="/watermark-trial.webp" alt="Lookitry" className="w-full h-auto" />
    </div>
  );
}
```

### Implementación Backend (Sharp)

```typescript
// En backend/src/services/image.service.ts
async processWithWatermark(imageUrl: string, plan: string): Promise<Buffer> {
  // Si es PRO, no aplicamos marca de agua
  if (plan === 'PRO') {
    return await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
  }

  // Seleccionar marca de agua según plan
  const watermarkPath = plan === 'BASIC'
    ? this.watermarkBasic   // assets/watermark-basic.webp
    : this.watermarkTrial; // assets/watermark-trial.webp

  if (plan === 'BASIC') {
    // BASIC: Esquina inferior derecha, 10% del ancho
    return await sharp(imageBuffer)
      .composite([{
        input: resizedWatermark,
        top: height - wmHeight - padding,
        left: width - wmWidth - padding,
        blend: 'over'
      }])
      .jpeg({ quality: 85 })
      .toBuffer();
  } else {
    // TRIAL: Centrado, 45% del ancho
    return await sharp(imageBuffer)
      .composite([{
        input: resizedWatermark,
        gravity: 'center',
        blend: 'over'
      }])
      .jpeg({ quality: 85 })
      .toBuffer();
  }
}
```

### Archivos

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| `watermark-basic.webp` | `frontend/public/watermark-basic.webp` | Visual en widget (BASIC) |
| `watermark-trial.webp` | `frontend/public/watermark-trial.webp` | Visual en widget (TRIAL) |
| `watermark-basic.webp` | `backend/assets/watermark-basic.webp` | Incrustado en descarga (BASIC) |
| `watermark-trial.webp` | `backend/assets/watermark-trial.webp` | Incrustado en descarga (TRIAL) |

### Propósito

1. **Branding visual** — El watermark en pantalla recuerda quién provee el servicio
2. **Watermark en imagen** — Queda Incrustado cuando el usuario descarga/comparte
3. **Monetización** — Incentivo para upgrade a PRO/ENTERPRISE (sin marca)

### Endpoint de Descarga

El watermark se aplica cuando se llama a `/api/images/look` con `download=true`:
```
GET /api/images/look?src={minio_url}&plan={PLAN}&download=true
```

---

**Última actualización:** Abril 2026
