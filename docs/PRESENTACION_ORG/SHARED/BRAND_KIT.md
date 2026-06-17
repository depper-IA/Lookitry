# Lookitry - Brand Kit

**Assets de marca para presentaciones y documentos**

---

## Identidad de Marca

### Nombre
- **Oficial:** Lookitry
- **En texto:** `Look<span class="naranja">itry</span>` → **Look<span style="color:#FF5C3A">itry</span>**
- **Pronunciación:** /lu-kit-ri/

### Descripción One-liner
> "El probador virtual con IA para moda en Latinoamérica"

---

## Paleta de Colores

### Colores Principales

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| **Naranja Lookitry** | `#FF5C3A` | 255, 92, 58 | Accentos, CTAs, logo |
| **Negro Base** | `#0a0a0a` | 10, 10, 10 | Fondos principales |
| **Negro Card** | `#141414` | 20, 20, 20 | Tarjetas, paneles |
| **Crema/Beige** | `#f5f2ee` | 245, 242, 238 | Fondos claros, landing |
| **Blanco** | `#ffffff` | 255, 255, 255 | Texto principal |

### Escala de Grises (Modo Oscuro)

| Uso | Hex | Permitido |
|-----|-----|-----------|
| Texto secundario | `#999` | ✓ |
| Features / ayuda | `#bbb` | ✓ |
| Texto muy sutil (mínimo) | `#666` | ✓ |
| Prohibido para texto | `#333`, `#444`, `#555` | ✗ |

### Colores de Estado

| Estado | Color | Hex |
|--------|-------|-----|
| Info | Azul | `#3b82f6` |
| Warning | Ámbar | `#f59e0b` |
| Error | Rojo | `#ef4444` |
| Success | Verde | `#10b981` |

---

## Tipografía

### Familia Principal

| Uso | Familia | Peso | Notas |
|-----|---------|------|-------|
| **Títulos / Marca** | Plus Jakarta Sans | 400-800 | Primario |
| **Cuerpo / UI** | DM Sans | 300-500 | Secundario |

### Aplicación
- Pantallas de auth, checkout, dashboard: Jakarta para títulos, DM Sans para cuerpo
- Landing pages: Plus Jakarta Sans para todo

---

## Logo

### Versión SVG
- **Archivo:** `frontend/public/logo.svg`
- **Uso en código:** `<Image src="/logo.svg" ... />`

### Construcción
- Icono + texto "Lookitry"
- "itry" en naranja (`#FF5C3A`)
- Siempre: Logo + nombre juntos (nunca separados)

### Tamaños por Contexto

| Contexto | Tamaño | Altura |
|----------|--------|--------|
| Header / Sidebar | Small | `h-7` / `h-8` |
| Páginas de auth | Medium | `h-8` / `h-10` |
| Landing nav | Medium | `h-8` |
| Footer | Micro | `h-6` |

---

## Reglas de UI (No Hacer)

### Prohibiciones Absolutas

| No hacer | Razón | Alternativa |
|----------|-------|-------------|
| ❌ Emojis en UI | No son de marca | Usar SVG / lucide-react |
| ❌ Logo sin texto | Incompleto | Siempre logo + nombre |
| ❌ Bordes decorativos | No existe en la marca | Sombras, contraste de fondo |
| ❌ Divisores lineales (`<hr>`) | No existe en la marca | Espacio, sombras, diferencia de fondo |

### Regla de Oro de Profundidad
> Si necesitas separar algo visualmente → usa **sombra** o **contraste de fondo**. Nunca un borde o línea.

---

## Iconografía

- **Librería:** lucide-react
- **Estilo:** Lineal, 24px, stroke 1.5-2px
- **No usar:** Emojis, iconos pixelados, iconos inconsistency

---

## Photography / Imagery

### Estilo General
- Fotos de moda lifestyle
- Personas diversas (fisionomía latina)
- Contextos naturales (no estudio)
- Luz natural preferida

### No usar
- Fotos stock genéricas
- Modelos exclusivamente anglosajones
- Fotos de baja resolución
- Imágenes con watermarks

---

## Usos Correctos e Incorrectos

### ✅ Correcto

```
✓ Lookitry (naranja en "itry")
✓ Logo SVG + texto juntos
✓ Fondo oscuro (#0a0a0a) con texto blanco
✓ Botón naranja (#FF5C3A) como CTA principal
✓ Iconos lucide-react
```

### ❌ Incorrecto

```
✗ "LOOKITRY" todo en mayúsculas
✗ Logo solo (sin texto)
✗ Botón azul como primario
✗ Emojis en botones o navegación
✗ Bordes como separadores de sección
```

---

## Assets Disponibles

| Asset | Ubicación | Formato |
|-------|-----------|---------|
| Logo SVG | `frontend/public/logo.svg` | SVG |
| Favicon | `frontend/public/favicon.png` | PNG 64x64 |
| Screenshots UI | Pendiente | PNG |
| Fotos producto | Pendiente | JPG/PNG |
| Video demo | Pendiente | MP4 |

---

## Aplicaciones en Documentos

### En PPT / Slides
- Usar naranja `#FF5C3A` para highlights
- Fondo oscuro `#0a0a0a` para slides premium
- Fondo crema `#f5f2ee` para slides de contenido

### En PDF
- Mantener paleta oscura para docs ejecutivos
- Usar logo en header

### En sitio web
- https://lookitry.com (ya tiene branding aplicado)

---

## Contacto para Assets

Para requesting nuevos assets o variaciones del logo:
- Revisar `Cerebro/DESIGN.md` (fuente de verdad)
- Consultar con el equipo de diseño

---

**Última actualización:** Mayo 2026  
**Versión:** 1.0  
**Estado:** Actualizado desde Brain Vault

**Tags:** #BrandKit #Logo #Colors #Typography #Lookitry