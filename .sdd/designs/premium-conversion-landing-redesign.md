# Design: premium-conversion-landing-redesign

## Technical Approach

Convert the public landing/pricing pages to commerce-first, non-technical-friendly language. The change touches 4 landing components, 1 pricing component, introduces a new 3-step onboarding section, and adds a social media integration block — all while enforcing a language audit that bans technical terms (`widget`, `script`, `embed`, `slug`) from public-facing copy.

---

## Architecture Decisions

### Decision: New Section Structure in PremiumLanding.tsx

**Choice**: Reorder existing section render order to insert `LandingSocialProof` (Instagram/WhatsApp block) before pricing, and prepend the 3-step onboarding stepper before the hero CTAs. Rename `LandingMiniLanding` → `LandingVirtualShop` and `LandingPlugin` → `LandingIntegration`.

**Alternatives considered**: Creating entirely new components; keeping the old section names
**Rationale**: Preserves lazy-loading architecture already in `PremiumLanding.tsx` while making the page flow match user intent (see → understand value → see price). Renaming components in the orchestrating component avoids renaming the physical files (which would break imports elsewhere).

### Decision: Language Mapping via Constants File

**Choice**: Create `frontend/src/components/landing/LandingCopy.ts` — a single constants file with all public-facing strings indexed by slug. Components import from this file only.

**Alternatives considered**: Inline find/replace; i18n library
**Rationale**: One source of truth for copy, easy to audit, avoids i18n overhead given the scope is limited to landing/pricing pages.

### Decision: 3-Step Onboarding as New Component

**Choice**: Create `frontend/src/components/landing/LandingOnboardingSteps.tsx` — renders the horizontal 3-step stepper (Paga → Sube → Vende) with icons and copy.

**Alternatives considered**: Extending `LandingSteps.tsx` (has different semantics — that's the try-on flow)
**Rationale**: Distinct visual identity from the existing "how the AI works" 3-step section. Allows independent animation and placement.

---

## Data Flow

```
PremiumLanding.tsx
├── LandingNav
├── LandingHero (hero copy updated: "Pequeña Tienda Virtual" / "Tu Catálogo Interactivo")
├── LandingOnboardingSteps [NEW — 3-step stepper]
├── LandingMiniLanding → renamed "Pequeña Tienda Virtual" section
├── LandingPlugin → renamed "Link del Probador + Espejo Virtual" section
├── LandingSocialProof [NEW — Instagram + WhatsApp icons + copy]
├── LandingPricing [updated: "Soporte Humano Incluido" badge, Pay-to-Enter flow]
└── ...
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/landing/PremiumLanding.tsx` | Modify | Reorder sections; import new components; rename `LandingMiniLanding` → `LandingVirtualShop` (no rename of file) |
| `frontend/src/components/landing/LandingHero.tsx` | Modify | Update hero headline/sub to use new naming; update meta/OG if applicable |
| `frontend/src/components/landing/LandingMiniLanding.tsx` | Modify | Section renamed to "Pequeña Tienda Virtual"; copy updated |
| `frontend/src/components/landing/LandingPlugin.tsx` | Modify | Features renamed to "Link del Probador" and "Espejo Virtual"; remove "script" references |
| `frontend/src/components/landing/LandingPricing.tsx` | Modify | Add badge "Soporte Humano Incluido" + "Te ayudamos a configurar tu tienda — sin costos extra"; update feature list copy |
| `frontend/src/components/landing/LandingCopy.ts` | Create | Constants file: all public-facing strings by slug |
| `frontend/src/components/landing/LandingOnboardingSteps.tsx` | Create | 3-step stepper component (Paga / Sube / Vende) |
| `frontend/src/components/landing/LandingSocialProof.tsx` | Create | Instagram "Link para Biografía" + WhatsApp "Venta por WhatsApp" section |

---

## Interfaces / Contracts

### LandingCopy.ts — Key Mappings

```typescript
export const LANDING_COPY = {
  // Section titles
  'pequena-tienda-virtual': 'Pequeña Tienda Virtual',
  'tu-catalogo-interactivo': 'Tu Catálogo Interactivo',
  // Features
  'link-del-probador': 'Link del Probador',
  'espejo-virtual': 'Espejo Virtual',
  'venta-por-whatsapp': 'Venta por WhatsApp',
  'link-para-biografia-instagram': 'Link para Biografía de Instagram',
  // Trust badge
  'soporte-humano-incluido': 'Soporte Humano Incluido',
  'soporte-humano-desc': 'Te ayudamos a configurar tu tienda — sin costos extra',
  // Onboarding steps
  'step-1-paga': 'Elige tu Plan y Paga',
  'step-2-sube': 'Sube tus Prendas',
  'step-3-vende': 'Vende en Instagram, WhatsApp y la Web',
  // Banned terms (for reference)
  'banned-widget': 'widget',      // → 'Probador'
  'banned-script': 'script',       // → 'Link del Probador'
  'banned-embed': 'embed',         // → 'Espejo Virtual'
  'banned-slug': 'slug',           // → 'Tu link' or product name
} as const;
```

### LandingOnboardingSteps — Props

```typescript
interface LandingOnboardingStepsProps {
  variant?: 'horizontal' | 'vertical';
  // default: 'horizontal' — stepper above the fold
  // 'vertical' — stacked layout for mobile
}
```

### LandingSocialProof — Structure

```tsx
<section id="integracion-redes" aria-label="Integración con redes sociales">
  {/* Instagram: Link para Biografía de Instagram */}
  {/* WhatsApp: Venta por WhatsApp */}
</section>
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `LandingCopy` constants — no banned terms present | `vitest` — regex scan over all values |
| Unit | New components render with correct copy | `vitest` snapshot |
| Integration | `PremiumLanding` renders all sections in order | Playwright — verify sections exist in DOM |
| E2E | Pay-to-Enter flow — no dashboard access without payment | Playwright — navigate to `/dashboard` without session → redirect to pricing |

---

## Migration / Rollout

**No database migration required.** This is a pure copy/UI change.

Rollout:
1. Deploy frontend changes
2. Verify all public pages (`/`, `/planes`) pass the language audit (no banned terms in rendered HTML)
3. Monitor conversion metrics (expect lift from clearer Pay-to-Enter messaging)

---

## Open Questions

- [ ] Should `/planes` page (`frontend/src/app/planes/page.tsx`) also receive the "Soporte Humano Incluido" badge? Currently the badge is only in `LandingPricing.tsx` (section component). The `/planes` page may render its own pricing — need to confirm if it uses `LandingPricing` or has inline pricing.
- [ ] Should the new 3-step onboarding stepper appear on the `/planes` page as well, or only on the landing page? Spec says "landing page and pricing page" — clarify if `/planes` counts as "pricing page."
- [ ] OG meta tags and page titles still contain old terms (e.g., in `app/layout.tsx` or page-specific metadata). Should these be included in the language audit scope?