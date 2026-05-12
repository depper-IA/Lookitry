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

### 7.3 Footer - Modo Oscuro (Regla Obligatoria)
En el footer de la página principal (`LandingFooter.tsx`), los enlaces de las secciones **Ecosistema**, **Recursos** y **Legal** deben seguir estas reglas en modo oscuro:

| Elemento | Color Normal | Color Hover | Efecto Hover |
|----------|--------------|-------------|--------------|
| Enlaces de secciones (Ecosistema/Recursos/Legal) | `white/60` | `#FF5C3A` | Transición `300ms` + scale sutil `1.02` |
| Botones de redes sociales | `white/60` con borde `white/5` | Fondo `#FF5C3A`, borde `#FF5C3A`, icono blanco | Transición `300ms` + scale `1.1` + sombra |
| Título de sección | `white` | — | — |

**Regla CSS obligatoria:**
```css
/* Footer dark mode links */
footer a.hover-naranja {
  color: rgba(255, 255, 255, 0.6);
  transition: color 300ms ease, transform 300ms ease;
}
footer a.hover-naranja:hover {
  color: #FF5C3A;
  transform: scale(1.02);
}

/* Social buttons */
footer .social-btn {
  color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.05);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
footer .social-btn:hover {
  color: #ffffff;
  background: #FF5C3A;
  border-color: #FF5C3A;
  transform: scale(1.1);
  box-shadow: 0 4px 20px rgba(255, 92, 58, 0.4);
}
```

---

## 8. Sitemap - Páginas Públicas

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

### Páginas NO Indexadas (No en sitemap)
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

## 9. Componentes Clave

### 9.1 Autenticación
- `RegisterForm.tsx` — Registro con Turnstile
- `LoginForm.tsx` — Login
- `IdleTimer.tsx` — Timer de sesión
- `GoogleAuthButton.tsx` — Botón Google Sign-In

### 9.2 Landing
- `LandingNav.tsx` — Navegación
- `LandingFooter.tsx` — Footer
- `PremiumLanding.tsx` — Landing premium
- `LandingPricing.tsx` — Sección de precios

### 9.3 Try-On
- `TryOnWidget.tsx` — Widget de prueba virtual
- `SelfieUploader.tsx` — Subida de selfie
- `ResultDisplay.tsx` — Resultado
- `GenerationLoader.tsx` — Loader durante generación
- `LiveTryOnButton.tsx` — Botón try-on en vivo

### 9.4 Dashboard
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

### 9.5 Pagos y Checkout
- `WompiButton.tsx` — Botón de pago Wompi
- `StepProgress.tsx` — Progress en flujos multi-step
- `CheckoutHeader.tsx` — Header del checkout
- `UserDataStep.tsx` — Paso de datos de usuario
- `PlanSelectionStep.tsx` — Paso de selección de plan
- `PaymentMethodStep.tsx` — Paso de método de pago
- `OrderSummary.tsx` — Resumen de orden
- `CouponInput.tsx` — Input de cupón de descuento
- `ReferralInput.tsx` — Input de código de referido

### 9.6 Mini-Landing
- `MiniLanding.tsx` — Componente principal
- `TemplateClassic.tsx`
- `TemplateEditorial.tsx`
- `TemplateModerno.tsx`
- `TemplateBare.tsx`

### 9.7 Blog
- `BlogList.tsx` — Lista de posts
- `BlogCard.tsx` — Card de post individual
- `BlogShareRail.tsx` — Barra de compartir en redes

### 9.8 Admin
- `EnterpriseCalculator.tsx` — Calculadora de plan enterprise
- `ConfirmDialog.tsx` — Diálogo de confirmación
- `AdminNotifications.tsx` — Panel de notificaciones admin
- `MissionControl.tsx` — Dashboard central de métricas
- `AgentDetailModal.tsx` — Modal de detalle de agente
- `AdminAuditLog.tsx` — Log de auditoría de acciones admin
- `SecurityDashboard.tsx` — Dashboard de seguridad
- `LoginAuditTable.tsx` — Tabla de auditoría de login
- `EmailCampaignManager.tsx` — Gestor de campañas de email
- `LeadPipelineTable.tsx` — Pipeline de leads con estados

### 9.9 Widget Templates
- `TemplateBare` — Minimal, básico
- `TemplateMinimalTopBar` — Top bar minimal
- `TemplateModernSidebar` — Sidebar moderno
- `TemplateBoldProStudio` — Bold Pro Studio
- `TemplateLandingEmbed` — Para embebidos en landing pages
- `TemplateShowcase` — Showcase de producto con gallery

---

## 10. Estados de UI — Colores

> Los valores de los estados (active, pending, failed, etc.) están definidos en [[PRD]]. Aquí solo se definen los colores visuales.

### 10.1 Estados de Suscripción
| Estado | Color | Hex |
|--------|-------|-----|
| `active` | Verde | `#10b981` |
| `expiring_soon` | Ámbar | `#f59e0b` |
| `expired` | Rojo | `#ef4444` |
| `suspended` | Gris | `#6b7280` |
| `trial` | Violeta | `#6366f1` |

### 10.2 Estados de Generación
| Estado | Color | Hex |
|--------|-------|-----|
| `PENDING` | Ámbar | `#f59e0b` |
| `SUCCESS` | Verde | `#10b981` |
| `FAILED` | Rojo | `#ef4444` |

### 10.3 Estados de Pago
| Estado | Color | Hex |
|--------|-------|-----|
| `pending` | Ámbar | `#f59e0b` |
| `completed` | Verde | `#10b981` |
| `failed` | Rojo | `#ef4444` |
| `refunded` | Gris | `#6b7280` |

### 10.4 Estados de Leads
| Estado | Color | Hex |
|--------|-------|-----|
| `NEW` | Azul | `#3b82f6` |
| `CONTACTED` | Cyan | `#06b6d4` |
| `QUALIFIED` | Violeta | `#8b5cf6` |
| `INTERESTED` | Naranja | `#f97316` |
| `CONVERTED` | Verde | `#22c55e` |
| `LOST` | Gris | `#6b7280` |

### 10.5 Estados de Agentes
| Estado | Color | Hex |
|--------|-------|-----|
| `online` | Verde | `#10b981` |
| `busy` | Ámbar | `#f59e0b` |
| `offline` | Gris | `#6b7280` |

---

## 11. Páginas de Error y Estado

| Página | Archivo | Estándar de Diseño |
|--------|---------|---------------------|
| **404 Not Found** | `not-found.tsx` | Branding central, soporte Light/Dark, `pt-40` para Navbar. |
| **Runtime Error** | `error.tsx` | Fondo dinámico, botón `reset()`, ID de error monospaciado. |
| **Mantenimiento** | `mantenimiento/page.tsx` | Indicador de pulso activo, mensaje dinámico, branding premium. |
| **Global Error** | `global-error.tsx` | Root level recovery, layout minimalista, máxima resiliencia. |
| **Estado del Sistema** | `estado/page.tsx` | Indicadores de salud de servicios. |
| **Ayuda** | `ayuda/page.tsx` | Centro de ayuda y soporte. |

---

## 12. Animaciones y Transiciones

- Usar **Framer Motion** para transiciones
- GSAP disponible (`@gsap/react`, `gsap`)
- Transiciones suaves en modals, sidebars, loaders

---

## 13. Responsive

- **Regla:** Toda nueva vista debe estar 100% responsive
- Mobile-first approach recomendado
- Breakpoints estándar de Tailwind

---

## Referencias Cruzadas

| Documento | Contenido |
|-----------|-----------|
| [[PRD]] | Lógica de negocio, features, flujos, APIs, reglas de negocio |
| [[TECH_STACK]] | Stack técnico, librerías, DB schema, arquitectura IA |
| [[AGENTS]] | Configuración del equipo de agentes IA |
| [[REGLAS_IMPORTANTES]] | Reglas operativas del proyecto |

---

Este documento define el sistema de diseño de Lookitry. Cualquier nuevo componente o página debe seguir estas reglas.

**Última actualización:** Mayo 2026 - v2.1 (deduplicado con PRD y TECH_STACK)
