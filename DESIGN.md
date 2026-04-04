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
| `/contacto` | 0.6 | monthly |
| `/casos-de-exito` | 0.7 | weekly |
| `/blog` | 0.8 | weekly |
| `/blog/[slug]` | 0.7 | weekly |
| `/probador-virtual` | 0.8 | weekly |
| `/api-developer` | 0.5 | monthly |
| `/plugin-woocommerce` | 0.6 | monthly |
| `/mini-landing` | 0.5 | monthly |
| `/ayuda` | 0.5 | monthly |
| `/estado` | 0.4 | monthly |
| `/terminos` | 0.4 | yearly |
| `/politicas-privacidad` | 0.4 | yearly |
| `/politica-de-uso` | 0.4 | yearly |
| `/aviso-legal` | 0.4 | yearly |
| `/cookies` | 0.4 | yearly |

### 7.4 Páginas NO Indexadas (No en sitemap)
- `/dashboard/*`
- `/admin/*`
- `/checkout`
- `/trial-checkout`, `/trial-payment`, `/trial-activado`
- `/pago-exitoso`
- `/registro-pro`
- `/pruebalo/*`
- `/sitio/*`
- `/embed/*`
- `/marca/*`
- `/auth/verify`, `/verify-email`
- `/register/google-setup`
- `/mantenimiento`
- `/test-not-found`, `/test-error`

---

## 8. Componentes Clave

### 8.1 Autenticación
- `RegisterForm.tsx` — Registro con Turnstile
- `LoginForm.tsx` — Login
- `IdleTimer.tsx` — Timer de sesión
- `GoogleAuthButton.tsx` — Botón Google Sign-In

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
- `LiveTryOnButton.tsx` — Botón try-on en vivo

### 8.4 Dashboard
- `DashboardLayout.tsx` — Layout con sidebar
- `UpgradeModal.tsx` — Modal de upgrade
- `ProductList.tsx` — Lista de productos
- `UsageStats.tsx` — Stats de uso
- `SubscriptionBadge.tsx` — Badge del plan
- `OnboardingWizard.tsx` — Wizard de onboarding
- `EmbedSection.tsx` — Sección de embed para plugins
- `CreditUsageAlert.tsx` — Alerta de uso de créditos
- `SuspensionModal.tsx` — Modal de suspensión de landing
- `ReviewPromptModal.tsx` — Prompt para solicitar review
- `LandingTutorial.tsx` — Tutorial de mini-landing
- `DashboardNotifications.tsx` — Notificaciones del dashboard
- `TrialBanner.tsx` — Banner de trial
- `ProUpgradeBanner.tsx` — Banner de upgrade a PRO

### 8.5 Pagos y Checkout
- `WompiButton.tsx` — Botón de pago Wompi
- `StepProgress.tsx` — Progress en flujos multi-step
- `CheckoutHeader.tsx` — Header del checkout
- `UserDataStep.tsx` — Paso de datos de usuario
- `PlanSelectionStep.tsx` — Paso de selección de plan
- `PaymentMethodStep.tsx` — Paso de método de pago
- `OrderSummary.tsx` — Resumen de orden
- `CouponInput.tsx` — Input de cupón de descuento
- `ReferralInput.tsx` — Input de código de referido

### 8.6 Mini-Landing
- `MiniLanding.tsx` — Componente principal
- `TemplateClassic.tsx`
- `TemplateEditorial.tsx`
- `TemplateModerno.tsx` (antes TemplateProbador)
- `TemplateBare.tsx`

### 8.7 Blog
- `BlogList.tsx` — Lista de posts
- `BlogCard.tsx` — Card de post individual
- `BlogShareRail.tsx` — Barra de compartir en redes

### 8.8 Admin
- `EnterpriseCalculator.tsx` — Calculadora de plan enterprise
- `ConfirmDialog.tsx` — Diálogo de confirmación
- `AdminNotifications.tsx` — Panel de notificaciones admin

### 8.9 Widget Templates
- `TemplateBare` — Minimal, básico
- `TemplateMinimalTopBar` — Top bar minimal
- `TemplateModernSidebar` — Sidebar moderno
- `TemplateBoldProStudio` — Bold Pro Studio

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
| `trial` | Período de prueba |

### 10.2 Estados de Generación
| Estado | Descripción |
|--------|-------------|
| `PENDING` | Procesando |
| `SUCCESS` | Exitosa |
| `FAILED` | Fallida |

### 10.3 Estados de Pago
| Estado | Descripción |
|--------|-------------|
| `pending` | Pago pendiente |
| `completed` | Pago completado |
| `failed` | Pago fallido |
| `refunded` | Reembolsado |

### 10.4 Estados de Plan Change Request
| Estado | Descripción |
|--------|-------------|
| `pending` | Solicitud pendiente |
| `processing` | En proceso |
| `completed` | Completada |
| `failed` | Fallida |

### 10.5 Páginas de Error y Estado
| Página | Archivo | Estándar de Diseño |
|--------|---------|---------------------|
| **404 Not Found** | `not-found.tsx` | Branding central, soporte Light/Dark, `pt-40` para Navbar. |
| **Runtime Error** | `error.tsx` | Fondo dinámico, botón `reset()`, ID de error monospaciado. |
| **Mantenimiento** | `mantenimiento/page.tsx` | Indicador de pulso activo, mensaje dinámico, branding premium. |
| **Global Error** | `global-error.tsx` | Root level recovery, layout minimalista, máxima resiliencia. |
| **Estado del Sistema** | `estado/page.tsx` | Indicadores de salud de servicios. |
| **Ayuda** | `ayuda/page.tsx` | Centro de ayuda y soporte. |

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