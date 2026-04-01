# Design Doc - Lookitry

## Sistema de Diseño y Patrones UI/UX

---

## 1. Identidad de Marca

### 1.1 Nombre
- **Nombre oficial:** Lookitry
- **En JSX:** `Look<span className="text-[#FF5C3A]">itry</span>`

### 1.2 Descripción del Producto
Lookitry es un probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

---

## 2. Paleta de Colores

### 2.1 Colores Corporativos

| Nombre | Hex | Uso Principal |
|--------|-----|---------------|
| Naranja Lookitry | `#FF5C3A` | Color de marca, CTAs, acentos, ítem activo en nav |
| Negro base | `#0a0a0a` | Fondo principal (modo oscuro) |
| Negro card | `#141414` | Fondo de tarjetas y paneles |
| Crema / Beige | `#f5f2ee` | Fondo alternativo claro, secciones landing |
| Blanco | `#ffffff` | Texto principal sobre fondos oscuros |

### 2.2 Grises (Modo Oscuro - Regla de Legibilidad)

| Uso | Valor Mínimo | Prohibido |
|-----|--------------|-----------|
| Texto secundario / ayuda | `#999` | — |
| Texto de features / listas | `#bbb` | — |
| Texto muy sutil (mínimo) | `#666` | — |
| **PROHIBIDO para texto** | — | `#333`, `#444`, `#555` |

### 2.3 Colores de Estado / Severidad

| Estado | Color | Hex |
|--------|-------|-----|
| Info | Azul | `#3b82f6` |
| Warning | Ámbar | `#f59e0b` |
| Error | Rojo | `#ef4444` |
| Success | Verde | `#10b981` |

### 2.4 Plan Badges

| Plan | Color | Hex |
|------|-------|-----|
| TRIAL | Violeta | `#6366f1` |

---

## 3. Tipografía

### 3.1 Familias
- **Títulos / Marca:** **Plus Jakarta Sans** (`--font-jakarta`) — pesos 400–800
- **Cuerpo / UI:** **DM Sans** (`--font-dm-sans`) — pesos 300–500

### 3.2 Regla de Aplicación
- Pantallas de auth, checkout, pago exitoso y dashboard deben respetar:
  - `font-jakarta` en títulos
  - `DM Sans` en cuerpo/UI

---

## 4. Variables CSS del Sistema

```css
:root {
  /* Fondos */
  --bg-base;          /* Fondo principal */
  --bg-card;          /* Fondo de tarjetas */
  --bg-sidebar;       /* Fondo del sidebar */
  --bg-sidebar-hover; /* Hover en sidebar */
  --bg-header;        /* Fondo del header sticky */
  --bg-hover;         /* Hover genérico */
  
  /* Bordes */
  --border-color;
  
  /* Texto */
  --text-primary;     /* Texto principal */
  --text-secondary;   /* Texto secundario */
  --text-muted;       /* Texto muy sutil */
  --text-sidebar;     /* Texto en sidebar */
  
  /* Sombras */
  --shadow-header;    /* Sombra del header */
}
```

---

## 5. Componentes de UI

### 5.1 Botones
- **Primario:** `#FF5C3A` (naranja)
- **Secundario:** Fondo transparente con borde
- **Toggle activo:** `#FF5C3A` (NUNCA `bg-blue-600`)

### 5.2 Inputs
- Fondo: `#141414` (dark) o `#ffffff` (light)
- Borde: `#333` mínimo, mejor `--border-color`
- Focus: `#FF5C3A` outline

### 5.3 Accesibilidad
- **Regla obligatoria:** Botones de mostrar/ocultar contraseña deben ser:
  - Focusables
  - Llevar `aria-label`

---

## 6. Logo

### 6.1 Archivo
- **SVG activo:** `frontend/public/logo.svg`
- **Favicon:** `frontend/public/favicon.png` (64x64)

### 6.2 Renderizado
- Siempre usar `<Image src="/logo.svg" ... />` (nunca `logo.png`)
- Sempre mostrar: `Look<span className="text-[#FF5C3A]">itry</span>`

### 6.3 Tamaños por Contexto

| Contexto | Tamaño |
|----------|--------|
| Sidebar / header dashboard | `h-7` o `h-8` |
| Páginas de auth (login, register) | `h-8` o `h-10` |
| Landing pública (nav) | `h-8` |
| Footer | `h-6` |

---

## 7. Reglas de UI

### 7.1 Prohibiciones
- **SIN emojis** en UI — solo SVG / lucide-react
- **NUNCA mostrar** solo el logo sin el nombre de texto, ni solo el nombre sin el logo

### 7.2 Fondo por Contexto
- Dashboard: `#0a0a0a` (oscuro por defecto)
- Landing: puede usar `#f5f2ee` como sección alternativa

### 7.3 Sitemap - Páginas Públicas

| URL | Priority | Frecuencia |
|-----|----------|------------|
| `/` | 1.0 | weekly |
| `/planes` | 0.9 | weekly |
| `/register` | 0.8 | monthly |
| `/login` | 0.5 | monthly |
| `/sobre-nosotros` | 0.6 | monthly |
| `/terminos` | 0.4 | yearly |
| `/politicas-privacidad` | 0.4 | yearly |

### 7.4 Páginas NO Indexadas (No en sitemap)
- `/dashboard/*`
- `/admin/*`
- `/checkout`
- `/pago-exitoso`
- `/trial-payment`
- `/pruebalo/*`
- `/sitio/*`
- `/embed/*`

---

## 8. Componentes Clave

### 8.1 Autenticación
- `RegisterForm.tsx` — Registro con Turnstile
- `LoginForm.tsx` — Login
- `IdleTimer.tsx` — Timer de sesión

### 8.2 Landing
- `LandingNav.tsx` — Navegación
- `LandingFooter.tsx` — Footer
- `PremiumLanding.tsx` — Landing premium
- `LandingPricing.tsx` — Sección de precios

### 8.3 Try-On
- `TryOnWidget.tsx` — Widget de prueba virtual
- `SelfieUploader.tsx` — Subida de selfie
- `ResultDisplay.tsx` — Resultado
- `GenerationLoader.tsx` — Loader durante generación

### 8.4 Dashboard
- `DashboardLayout.tsx` — Layout con sidebar
- `UpgradeModal.tsx` — Modal de upgrade
- `ProductList.tsx` — Lista de productos
- `UsageStats.tsx` — Stats de uso
- `SubscriptionBadge.tsx` — Badge del plan

### 8.5 Pagos
- `WompiButton.tsx` — Botón de pago Wompi
- `StepProgress.tsx` — Progress en flujos multi-step

### 8.6 Mini-Landing
- `MiniLanding.tsx` — Componente principal
- `TemplateClassic.tsx`
- `TemplateEditorial.tsx`
- `TemplateProbador.tsx`
- `TemplateModerno.tsx`

---

## 9. Templates de Widget

| Template | Descripción |
|----------|-------------|
| `TemplateBare` | Minimal, básico |
| `TemplateMinimalTopBar` | Top bar minimal |
| `TemplateModernSidebar` | Sidebar moderno |
| `TemplateBoldProStudio` | Bold Pro Studio |

---

## 10. UI States

### 10.1 Estados de Suscripción
| Estado | Descripción |
|--------|-------------|
| `active` | Suscripción activa |
| `expiring_soon` | Por expirar |
| `expired` | Expirada |
| `suspended` | Suspendida |

### 10.2 Estados de Generación
| Estado | Descripción |
|--------|-------------|
| `PENDING` | Procesando |
| `SUCCESS` | Exitosa |
| `FAILED` | Fallida |

---

## 11. Animaciones y Transiciones

- Usar **Framer Motion** para transiciones
- GSAP disponible (`@gsap/react`, `gsap`)
- Transiciones suaves en modals, sidebars, loaders

---

## 12. Responsive

- **Regla:** Toda nueva vista debe estar 100% responsive
- Mobile-first approach recomendado
- Breakpoints estándar de Tailwind

---

##不走

Este documento define el sistema de diseño de Lookitry. Cualquier nuevo componente o página debe seguir estas reglas.

**Última actualización:** Abril 2026