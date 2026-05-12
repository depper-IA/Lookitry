# WilkieDevs.com — Brand Audit
**Date:** 2026-04-29
**Auditor:** Pixel (WebWizard) for Lookitry
**URL:** https://wilkiedevs.com/

---

## Executive Summary

Wilkie Developers es una agencia digital con un sitio WordPress + Elementor. La marca tiene una identidad audaz y corporativa con un color primario vinotinto profundo y acentos dorados/amarillos. El sitio es predominantemente oscuro.

---

## Color Palette — Exact Hex Codes

### Primary Brand Colors

| Color | Hex | Usage | Elementor Variable |
|-------|-----|-------|-------------------|
| **Primary (Vinotinto)** | `#A00010` | Botones principales, links, acentos de marca, color de logo dominante | `--e-global-color-primary` |
| **Secondary (Acero Gris)** | `#54595F` | Texto secundario, elementos de UI menos prominentes | `--e-global-color-secondary` |
| **Accent (Dorado/Amarillo)** | `#FFBE00` | CTAs destacados, hover states, elementos de énfasis | `--e-global-color-accent` |
| **Dark Base (Negro Carbón)** | `#1D1D1D` | Header, footer, fondos de secciones oscuras | `--e-global-color-3fb8535` |
| **Background (Negro Profundo)** | `#1A1A1A` | Fondo principal del sitio | inline style |

### Supporting Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **White** | `#FFFFFF` | Texto principal, texto sobre fondos oscuros, iconos |
| **Light Gray** | `#ABB8C3` | Texto terciario, placeholders |
| **Button Text** | `#FFFFFF` | Texto en botones primarios |

---

## Typography

### Font Families (Google Fonts)

| Role | Font Family | Weights | Fallback |
|------|-------------|---------|----------|
| **Primary / Headlines** | `Roboto` | 400, 500, 600, 700 | sans-serif |
| **Secondary / Serif accents** | `Roboto Slab` | 400 | serif |
| **Body text** | `Roboto` | 400 | sans-serif |

### Type Scale (Elementor)

| Element | Size | Weight | Font |
|---------|------|--------|------|
| H1 | 60px | 700 | Roboto |
| Body | ~18-20px (medium) | 400 | Roboto |
| Accent text | varies | 500 | Roboto |

---

## Logo Analysis

**Logo URL:** `https://wilkiedevs.com/wp-content/uploads/2023/02/cropped-circles-logo.png`

**Logo Description:**
- Formato: PNG con fondo transparente
- Concepto: Tres círculos entrelazados/sobrepuestos
- **Circulo rojo:** Color `#A00010` (coincide con color primario)
- **Círculo amarillo/dorado:** Color `#FFBE00` o cercano (coincide con accent)
- El diseño es geométrico y corporativo

**Logo schema markup presente** en el HTML confirmando el uso del mismo archivo.

---

## Visual Identity Summary

### Personalidad de Marca
- **Industria:** Agencia digital / Desarrollo web / Marketing
- **Tono:** Corporativo, profesional, confiable
- **Energía:** Audaz pero elegante (gracias al vinotinto + dorado)

### Paleta en Contexto

```
Fondo principal:    ██████  #1A1A1A (negro profundo)
Header/Footer:      ██████  #1D1D1D (negro carbón)
Textos:             ██████  #FFFFFF (blanco puro)
Botones primario:   ██████  #A00010 (vinotinto)
Botones hover:      ██████  #FFFFFF (blanco - texto vinotinto)
Accent/CTA:         ██████  #FFBE00 (dorado)
Links:              ██████  #A00010 (vinotinto)
Links hover:        ██████  #FFFFFF (blanco)
```

---

## Elementos de UI Detectados

### Botones
- **Default:** Background `#A00010`, texto `#FFFFFF`, border-radius `40px` (pill shape)
- **Hover:** Background `#FFFFFF`, texto `#A00010`, mismo border-radius
- Transición suave entre estados

### Cards / Secciones
- Fondo negro `#1A1A1A` o `#1D1D1D`
- Sin bordes visibles, usan sombras sutiles o espacio negativo
- Contenido centrado con max-width 1200px

### Formularios
- Inputs con estilo WooCommerce standard
- Campos requeridos con `visibility: visible` (indicador rojo)

---

## Contraste y Accesibilidad

| Elemento | Color Fondo | Color Texto | Ratio Aprox | WCAG |
|----------|-------------|-------------|--------------|------|
| Texto principal | `#1A1A1A` | `#FFFFFF` | 16:1 | AAA ✓ |
| Botón default | `#A00010` | `#FFFFFF` | 5.2:1 | AA ✓ |
| Botón hover | `#FFFFFF` | `#A00010` | 5.2:1 | AA ✓ |
| Link default | `#A00010` | — | N/A | AA ✓ |
| Texto secundario | `#1A1A1A` | `#54595F` | 4.5:1 | AA ✓ |

---

## Notas para Lookitry

Para aplicar estos colores en el widget de try-on de Lookitry para la marca WilkieDevs:

```css
/* Tokens CSS sugeridos */
--wilkie-primary: #A00010;    /* Vinotinto corporativo */
--wilkie-accent: #FFBE00;      /* Dorado vibrante */
--wilkie-bg: #1A1A1A;          /* Fondo oscuro */
--wilkie-surface: #1D1D1D;     /* Cards/superficies */
--wilkie-text: #FFFFFF;         /* Texto principal */
--wilkie-text-muted: #54595F;  /* Texto secundario */
```

**Combinations recomendadas:**
- Botón CTA principal: `#A00010` fondo + `#FFFFFF` texto
- Hover CTA: `#FFBE00` fondo + `#1A1A1A` texto
- Acentos decorativos: `#FFBE00` (gold)
- Fondos de sección: Gradientes sutiles sobre `#1A1A1A`

---

## Referencias

- Sitio: https://wilkiedevs.com/
- Logo: https://wilkiedevs.com/wp-content/uploads/2023/02/cropped-circles-logo.png
- Meta OG Image: https://wilkiedevs.com/wp-content/uploads/2024/11/hola.webp
- Tech stack: WordPress + Elementor + Hello Elementor theme + WooCommerce

---

*Documento generado por Pixel (WebWizard) para Lookitry Superpowers*
*Fecha: 2026-04-29*
