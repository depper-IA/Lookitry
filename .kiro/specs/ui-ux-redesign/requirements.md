# Requirements Document

## Introduction

Mejora visual UI/UX integral del frontend de Lookitry — SaaS de probador virtual con IA para tiendas de ropa en Latinoamérica. El objetivo es que toda la interfaz se sienta premium, consistente y alineada con la identidad de marca en todos los componentes y páginas, sin romper ninguna funcionalidad existente.

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS. Solo cambios visuales — sin tocar lógica de backend ni APIs.

**SCOPE PERMITIDO:**
- Dashboard y todas sus sub-páginas (`/dashboard/*`) — FOCO PRINCIPAL
- Login (`/login`) y Register (`/register`) — solo en casos de inconsistencias graves de marca
- Admin panel (`/admin/*`) — mejoras visuales consistentes con el dashboard
- Componentes compartidos de UI (`frontend/src/components/ui/`) — Button, Card, Input, Spinner
- Componentes del dashboard (`frontend/src/components/dashboard/`) — DashboardLayout, sidebar, header, cards
- Confirmation_Pages (`/pago-exitoso`, `/trial-activado`) — páginas de confirmación post-pago y post-trial

**ABSOLUTAMENTE PROHIBIDO MODIFICAR:**
- Landing page (`/`) — ya pasó auditoría SEO, no tocar nada
- Checkout (`/checkout`, `/dashboard/checkout`, `/dashboard/checkout-landing`) — no tocar
- Templates de mini-landing (`frontend/src/components/mini-landing/`) — no tocar
- Cualquier lógica de negocio, APIs o funcionalidad existente

---

## Glossary

- **System**: El frontend de Lookitry (Next.js 14, App Router)
- **Design_System**: El conjunto de variables CSS definidas en `globals.css` (`var(--bg-base)`, `var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, etc.)
- **Accent_Color**: `#FF5C3A` — único color de acento de la marca, nunca reemplazable
- **Dark_Mode**: Modo oscuro implementado con la clase `.dark` en el elemento `<html>`
- **Dashboard**: El área autenticada `/dashboard` y sus sub-páginas
- **Admin_Panel**: El área de administración `/admin/dashboard` y sus sub-páginas
- **Auth_Pages**: Las páginas `/login` y `/register`
- **Shared_Components**: Los componentes en `frontend/src/components/ui/` — `Button`, `Card`, `Input`, `Spinner`, `ThemeToggle`, `Breadcrumbs`
- **Prohibited_Colors**: Colores de texto prohibidos: `#333`, `#444`, `#555` (demasiado oscuros para modo oscuro)
- **Minimum_Text_Gray**: El gris mínimo permitido para texto secundario es `#999` o equivalente en variables CSS
- **Font_Jakarta**: Plus Jakarta Sans — tipografía para títulos (`--font-jakarta`)
- **Font_DM_Sans**: DM Sans — tipografía para cuerpo (`--font-dm-sans`)
- **Confirmation_Pages**: Las páginas `/pago-exitoso` y `/trial-activado` — páginas de confirmación post-pago y post-activación de trial
- **Skill_Checklist**: Pre-Delivery Checklist del skill UI/UX Pro Max — reglas obligatorias: no emojis como iconos (solo SVG/Lucide), `cursor-pointer` en todos los elementos clickeables, hover states con transiciones 150-300ms, contraste mínimo 7:1 en dark mode, focus states visibles, `prefers-reduced-motion` respetado, sin scroll horizontal en mobile, sticky nav con padding-top compensatorio
- **OLED_Dark_Style**: Estilo Dark Mode OLED del skill — deep black `#000000`/`#121212`, high contrast, minimal glow con `text-shadow: 0 0 10px` usando Accent_Color muy sparingly, dark-to-light transitions
- **Executive_Dashboard_Style**: Estilo Executive Dashboard del skill — KPI cards grandes (4-6 max), trend sparklines, status colors, card shadows para jerarquía visual

---

## Requirements

### Requirement 1: Sistema de diseño consistente en componentes compartidos

**User Story:** As a developer, I want all shared UI components to use CSS variables from the Design_System, so that the interface is consistent across light and dark modes without hardcoded color values.

#### Acceptance Criteria

1. THE System SHALL use `var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-secondary)` in all Shared_Components instead of hardcoded Tailwind color classes for backgrounds and borders.
2. WHEN a Shared_Component renders in Dark_Mode, THE System SHALL display correct contrast ratios using the `.dark` CSS variable overrides already defined in `globals.css`.
3. THE Button component SHALL apply `focus-visible:ring-2 focus-visible:ring-[#FF5C3A]/50` for keyboard navigation focus states on all variants.
4. THE Input component SHALL display a `focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]` state when focused, using the Accent_Color.
5. IF a Shared_Component uses a toggle or switch element, THEN THE System SHALL style the active state with Accent_Color (`#FF5C3A`), never with `bg-blue-600` or other non-brand colors.
6. THE System SHALL NOT use Prohibited_Colors (`#333`, `#444`, `#555`) for any text element; text colors SHALL use Design_System variables or values at or above Minimum_Text_Gray (`#999`).
7. THE System SHALL NOT introduce new npm package dependencies to implement any visual change.
8. THE System SHALL comply with the Skill_Checklist: all interactive elements SHALL have `cursor-pointer`, hover transitions SHALL be between 150ms and 300ms (`duration-150` to `duration-300`), and no emoji characters SHALL be used as icons.

---

### Requirement 2: Auth pages — formularios premium y accesibles

**User Story:** As a new user, I want the login and register forms to feel polished and trustworthy, so that I feel confident entering my credentials.

#### Acceptance Criteria

1. THE Auth_Pages SHALL use `var(--bg-base)` for the page background instead of hardcoded `bg-[#0a0a0a]`, to support both light and Dark_Mode.
2. THE Auth_Pages form card SHALL use `var(--bg-card)` and `var(--border-color)` instead of hardcoded `bg-[#141414]` and `border-[#2a2a2a]`.
3. THE Auth_Pages form inputs SHALL use `var(--bg-input)` for background and `var(--border-color)` for border instead of hardcoded `bg-[#0f0f0f]` and `border-[#2a2a2a]`.
4. THE Auth_Pages form labels SHALL use `var(--text-secondary)` instead of hardcoded `text-[#888]`.
5. WHEN a form input has a validation error, THE System SHALL display the error message using `text-[#ef4444]` (the defined error state color), not `text-[#ff6b6b]`.
6. THE Auth_Pages error alert box SHALL use `bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]` for consistent error state styling.
7. THE Auth_Pages "¿Ya tienes cuenta?" / "¿No tienes cuenta?" link text SHALL use `var(--text-muted)` instead of hardcoded `text-[#444]`.
8. THE LoginForm and RegisterForm SHALL display the logo using the standard pattern: `<Image src="/logo.svg" />` + `Look<span className="text-[#FF5C3A]">itry</span>`.
9. THE Auth_Pages SHALL comply with the OLED_Dark_Style: in Dark_Mode, backgrounds SHALL use `var(--bg-base)` (`#0a0a0a`) and card backgrounds SHALL use `var(--bg-card)` (`#141414`), achieving a minimum contrast ratio of 7:1 for all text elements.

---

### Requirement 3: Dashboard — layout, sidebar y header consistentes

**User Story:** As an authenticated brand owner, I want the dashboard to feel cohesive and professional, so that I can navigate and manage my virtual try-on efficiently.

#### Acceptance Criteria

1. THE DashboardLayout sidebar SHALL use `var(--bg-sidebar)` for background and `#1f1f1f` for internal borders, maintaining the dark sidebar aesthetic in both light and Dark_Mode.
2. WHEN a sidebar navigation item is active, THE System SHALL apply `background-color: #FF5C3A` and `color: #ffffff` to that item.
3. WHEN a sidebar navigation item is hovered (not active), THE System SHALL apply `var(--bg-sidebar-hover)` as background color.
4. THE DashboardLayout header SHALL use `var(--bg-header)`, `var(--border-color)`, and `var(--shadow-header)` for its background, border, and shadow respectively.
5. THE DashboardLayout main content area SHALL use `var(--bg-base)` as background.
6. THE Dashboard page titles (`h1`) SHALL use Font_Jakarta (`font-jakarta` class or `var(--font-jakarta)`) with `var(--text-primary)` color.
7. THE Dashboard page subtitles and descriptions SHALL use `var(--text-secondary)` color.
8. WHEN the email verification banner is shown, THE System SHALL use `var(--bg-card)` background and `var(--border-color)` border instead of hardcoded `bg-[#0a0a0a]` and `border-[#1a1a1a]`.
9. THE DashboardLayout mobile drawer SHALL animate with `transition-transform duration-200 ease-in-out` for smooth open/close.
10. WHEN the viewport width is below 768px, THE System SHALL render the sidebar as a full-height overlay drawer with a backdrop overlay, hiding it by default and toggling it via a hamburger button in the header.
11. WHEN the sidebar drawer is open on mobile, THE System SHALL display a semi-transparent backdrop that closes the drawer when tapped.
12. WHILE the sidebar is open on mobile, THE System SHALL prevent body scroll by applying `overflow-hidden` to the document body.
13. THE DashboardLayout SHALL comply with the Skill_Checklist: the fixed header SHALL include a `padding-top` compensatory value on the main content area so the sticky nav does not obscure content, and all sidebar navigation items SHALL have `cursor-pointer`.
14. THE Dashboard SHALL apply the Executive_Dashboard_Style to KPI/stat cards: maximum 4-6 KPI cards per view, card shadows for visual hierarchy (`shadow-sm` or `shadow-md`), and status colors using Design_System variables.

---

### Requirement 4: Dashboard sub-páginas — cards y estados de datos

**User Story:** As a brand owner, I want all dashboard sub-pages (products, analytics, settings, usage, subscription) to use consistent card styles and data display patterns, so that the interface feels unified.

#### Acceptance Criteria

1. THE Dashboard sub-pages SHALL use `var(--bg-card)` and `var(--border-color)` for all data cards and containers, with `rounded-xl` or `rounded-2xl` border radius.
2. THE Dashboard error alert messages SHALL use `border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]` instead of hardcoded `border-red-200 bg-red-50 text-red-700` (which breaks in Dark_Mode).
3. THE Dashboard success alert messages SHALL use `border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]` instead of hardcoded `border-emerald-200 bg-emerald-50 text-emerald-700`.
4. THE Analytics page stat cards SHALL use `var(--bg-card)` and `var(--border-color)` with the accent icon container using `bg-[#FF5C3A]/10`.
5. THE Analytics page bar chart bars SHALL use `bg-[#FF5C3A]` for filled portions and `var(--bg-hover)` for the track background.
6. THE Products page view mode selector buttons SHALL use `#FF5C3A` background for the active mode and `var(--text-secondary)` color for inactive modes.
7. THE Subscription page plan hero card SHALL maintain its gradient backgrounds and accent colors as currently implemented (these are intentionally distinct per plan).
8. WHEN a dashboard table renders, THE System SHALL use `var(--border-color)` for row dividers and `var(--bg-hover)` for row hover states.
9. WHEN the viewport width is below 768px, THE System SHALL stack dashboard stat cards in a single column and adjust table layouts to prioritize the most important columns.
10. THE Dashboard sub-pages SHALL comply with the Executive_Dashboard_Style: stat cards SHALL include card shadows (`shadow-sm`) and status colors SHALL use Design_System variables (`#10b981` for success, `#ef4444` for error, `#FF5C3A` for accent).

---

### Requirement 5: Admin panel — consistencia con el sistema de diseño

**User Story:** As an admin, I want the admin panel to use the same design system as the dashboard, so that the interface is consistent and professional.

#### Acceptance Criteria

1. THE Admin_Panel sidebar SHALL use the same structure as the DashboardLayout sidebar: `var(--bg-sidebar)` background, `#1f1f1f` internal borders, `#FF5C3A` active item background.
2. THE Admin_Panel header SHALL use `var(--bg-header)`, `var(--border-color)`, and `var(--shadow-header)` — identical to the Dashboard header.
3. THE Admin_Panel navigation group labels SHALL use `#4a4a4a` color (already implemented) and SHALL NOT use Prohibited_Colors.
4. WHEN an admin nav item has a notification badge, THE System SHALL display it with `bg-[#ef4444]` background (error state color) and white text.
5. THE Admin_Panel page titles SHALL use Font_Jakarta with `var(--text-primary)` color, consistent with Dashboard page titles.
6. WHEN the viewport width is below 768px, THE Admin_Panel SHALL render the sidebar as a mobile drawer with the same behavior as the Dashboard mobile sidebar.
7. THE Admin_Panel SHALL comply with the Skill_Checklist: all admin nav items SHALL have `cursor-pointer`, hover transitions SHALL use `duration-150` to `duration-300`, and borders SHALL be visible in both light and Dark_Mode using `var(--border-color)`.

---

### Requirement 6: Responsive — comportamiento correcto en todos los dispositivos

**User Story:** As a user on any device, I want the dashboard and admin panel to be fully usable on mobile, tablet, and desktop, so that I can manage my account from any device.

#### Acceptance Criteria

1. THE System SHALL render all Dashboard and Admin_Panel pages without horizontal overflow at the following skill-defined breakpoints: 375px (mobile), 768px (tablet), 1024px (laptop), and 1440px (desktop).
2. THE DashboardLayout SHALL use a responsive grid that collapses from multi-column to single-column at the `md` breakpoint (768px).
3. WHEN the viewport width is below 768px, THE System SHALL hide the persistent sidebar and show a hamburger menu button in the header.
4. THE Dashboard header SHALL remain fixed at the top of the viewport on all screen sizes, with a minimum height of 56px on mobile.
5. THE Dashboard form pages (settings, profile) SHALL use full-width inputs on mobile and constrained-width inputs on desktop (`max-w-lg` or similar).
6. THE System SHALL apply `overflow-x-hidden` to the main content wrapper to prevent horizontal scroll caused by wide tables or cards.
7. WHEN a data table is rendered on mobile, THE System SHALL wrap it in a horizontally scrollable container (`overflow-x-auto`) rather than truncating content.
8. THE System SHALL comply with the Skill_Checklist responsive rules: no horizontal scroll at any breakpoint (375px, 768px, 1024px, 1440px), sticky nav SHALL NOT obscure content (main content SHALL have `padding-top` equal to the header height), and mobile back button navigation SHALL preserve browser history correctly.

---

### Requirement 7: Accesibilidad y micro-interacciones

**User Story:** As any user, I want interactive elements to provide clear visual feedback and be keyboard-navigable, so that the interface is usable and accessible.

#### Acceptance Criteria

1. THE System SHALL apply `cursor-pointer` to all interactive card elements, buttons, and links that do not already have it via their HTML element type.
2. THE System SHALL apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A]/50` to all interactive elements for keyboard navigation.
3. WHEN a card or interactive container is hovered, THE System SHALL provide visual feedback via `hover:border-[#FF5C3A]/40` or `hover:shadow-md` transitions with `transition-all duration-200`.
4. THE System SHALL NOT use emoji characters as UI icons; all icons SHALL be SVG elements or components from `lucide-react`.
5. THE System SHALL apply `transition-colors duration-200` or `transition-all duration-200` to all hover state changes to ensure smooth visual transitions.
6. WHEN an image element is used in a UI component, THE System SHALL include a descriptive `alt` attribute.
7. THE System SHALL apply `prefers-reduced-motion` respect by using Tailwind's `motion-safe:` prefix for transform-based animations (translate, scale) on hover states.
8. THE System SHALL comply with the Skill_Checklist interaction rules: all hover state transitions SHALL be between 150ms and 300ms, all interactive elements SHALL have visible focus states, and all clickable cards SHALL have `cursor-pointer`.

---

### Requirement 8: Modo oscuro — compatibilidad completa

**User Story:** As a user who prefers dark mode, I want every page and component to render correctly in dark mode, so that I never see broken contrast or invisible elements.

#### Acceptance Criteria

1. THE System SHALL NOT use hardcoded light-mode-only colors (e.g., `bg-white`, `bg-gray-50`, `text-gray-900`, `border-gray-200`) in any component within the Dashboard, Admin_Panel, or Auth_Pages.
2. WHEN the `.dark` class is applied to the `<html>` element, THE System SHALL display all backgrounds, borders, and text using the dark-mode CSS variable values defined in `globals.css`.
3. THE System SHALL use `var(--bg-card)` instead of `bg-white` for card backgrounds in all dashboard and auth components.
4. THE System SHALL use `var(--border-color)` instead of `border-gray-200` or `border-[#e8e4df]` for borders in all dashboard and auth components.
5. THE Dashboard error and success alert boxes SHALL use opacity-based color classes (`bg-[#ef4444]/10`, `bg-[#10b981]/10`) instead of Tailwind semantic color classes (`bg-red-50`, `bg-emerald-50`) that do not adapt to Dark_Mode.
6. THE ThemeToggle component SHALL remain functional and SHALL toggle the `.dark` class on the `<html>` element without any visual regression.
7. THE System SHALL comply with the OLED_Dark_Style in Dark_Mode: all card borders SHALL be visible (`var(--border-color)` resolves to `#2a2a2a` in dark), text contrast SHALL meet a minimum ratio of 7:1 for primary text, and minimal glow effects using Accent_Color (`text-shadow: 0 0 10px #FF5C3A`) SHALL only be applied sparingly to key accent elements.

---

### Requirement 9: Confirmation Pages — feedback visual post-acción

**User Story:** As a user who just completed a payment or activated a trial, I want to see a clear confirmation page, so that I know my action was successful and what to do next.

#### Acceptance Criteria

1. THE Confirmation_Pages (`/pago-exitoso`, `/trial-activado`) SHALL use `var(--bg-base)` for the page background and `var(--bg-card)` for the confirmation card, consistent with the Design_System.
2. WHEN a Confirmation_Page renders, THE System SHALL display a visible success checkmark icon (SVG or `lucide-react` `CheckCircle`) with Accent_Color (`#FF5C3A`) or success color (`#10b981`), never a silent or empty state.
3. THE Confirmation_Pages SHALL display a clear primary action button (e.g., "Ir al Dashboard") styled with Accent_Color background and `cursor-pointer`, using the standard Button component.
4. THE Confirmation_Pages SHALL use Font_Jakarta for the confirmation title and Font_DM_Sans for the body text, consistent with the rest of the Design_System.
5. WHEN the Confirmation_Page renders in Dark_Mode, THE System SHALL apply the OLED_Dark_Style: `var(--bg-base)` (`#0a0a0a`) background, `var(--bg-card)` (`#141414`) card, and `var(--border-color)` (`#2a2a2a`) borders with minimum 7:1 contrast ratio for all text.
6. THE Confirmation_Pages SHALL comply with the Skill_Checklist: the success icon SHALL be SVG/Lucide (no emoji), the primary action button SHALL have `cursor-pointer`, and all interactive elements SHALL have visible focus states.
7. WHEN the viewport width is below 768px, THE Confirmation_Pages SHALL render the confirmation card in full-width layout without horizontal overflow.
