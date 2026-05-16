# Tasks: premium-conversion-landing-redesign

## Phase 1: Foundation — Constants & New Components

- [ ] 1.1 Create `frontend/src/components/landing/LandingCopy.ts` with all `LANDING_COPY` constants (section titles, features, trust badge, onboarding steps, banned-term mappings) per design spec
- [ ] 1.2 Create `frontend/src/components/landing/LandingOnboardingSteps.tsx` — horizontal 3-step stepper (Paga → Sube → Vende) with Lucide icons, scroll-triggered Framer Motion reveals, hover scale effects
- [ ] 1.3 Create `frontend/src/components/landing/LandingSocialProof.tsx` — Instagram "Link para Biografía" + WhatsApp "Venta por WhatsApp" section with floating notification/chat-bubble micro-animations using Framer Motion

## Phase 2: Core Implementation — Copy Updates

- [ ] 2.1 Update `LandingHero.tsx` — replace hero copy with "Pequeña Tienda Virtual" / "Tu Catálogo Interactivo" naming from `LandingCopy`
- [ ] 2.2 Update `LandingMiniLanding.tsx` — rename section to "Pequeña Tienda Virtual", update all feature copy to use `LandingCopy` constants, remove banned terms (widget, script, embed, slug)
- [ ] 2.3 Update `LandingPlugin.tsx` — rename features to "Link del Probador" and "Espejo Virtual", remove all "script" references, use `LandingCopy` constants
- [ ] 2.4 Update `LandingPricing.tsx` — add "Soporte Humano Incluido" badge + "Te ayudamos a configurar tu tienda — sin costos extra" copy, update feature list from `LandingCopy`

## Phase 3: Integration — PremiumLanding Orchestration

- [ ] 3.1 Update `PremiumLanding.tsx` — import `LandingOnboardingSteps` and `LandingSocialProof`, reorder sections: Hero → OnboardingSteps → MiniLanding (as VirtualShop) → Plugin → SocialProof → Pricing
- [ ] 3.2 Verify all dynamic imports and lazy-loading remain intact for below-the-fold components
- [ ] 3.3 Add Framer Motion scroll-triggered reveals to existing sections where missing (refer to design — "Social Media" floating elements)

## Phase 4: Testing & Verification

- [ ] 4.1 Run language audit: scan all public-facing strings in landing components for banned terms (widget, script, embed, slug) using regex — fail build if any found
- [ ] 4.2 Verify `LandingOnboardingSteps` renders horizontal stepper on desktop, vertical on mobile (`variant` prop)
- [ ] 4.3 Verify `LandingSocialProof` displays Instagram + WhatsApp integration copy from `LandingCopy`
- [ ] 4.4 Playwright: verify all sections render in correct order on landing page
- [ ] 4.5 Verify `/planes` page (if it has inline pricing) also receives "Soporte Humano Incluido" badge — or confirm it uses `LandingPricing`

## Phase 5: Cleanup

- [ ] 5.1 Remove any dead imports in `PremiumLanding.tsx` after section reordering
- [ ] 5.2 Commit with conventional commit: `feat: redesign premium landing with humanized copy and social proof section`

---

**Total**: 14 tasks across 5 phases
**Next**: sdd-apply (implementation phase)