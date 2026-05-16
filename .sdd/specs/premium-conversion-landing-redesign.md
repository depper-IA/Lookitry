# Premium Conversion Landing Redesign — Specification

## Purpose

Redesign the public-facing landing and pricing pages to use human, commerce-oriented language; clarify the Pay-to-Enter onboarding flow; and highlight social media integration as the primary sales channel.

---

## ADDED Requirements

### Requirement: Mini-Landing Rename — "Pequeña Tienda Virtual"

The term "Mini-Landing" and all variants SHALL be replaced throughout all public-facing copy with **"Pequeña Tienda Virtual"** (preferred) or **"Tu Catálogo Interactivo"** (secondary). The chosen term MUST be consistent within a given context:
- Pricing page headings → "Pequeña Tienda Virtual"
- Feature descriptions → "Tu Catálogo Interactivo"
- Body copy → either, based on sentence flow

The system MUST NOT display "Mini-Landing", "mini-landing", or any variant on public-facing pages.

#### Scenario: Pricing page displays the renamed product

- GIVEN a user visits the pricing page
- WHEN the page renders
- THEN the product tier formerly called "Mini-Landing" displays as "Pequeña Tienda Virtual"
- AND no instance of "mini-landing" or "Mini-Landing" appears in the rendered output

---

### Requirement: Pay-to-Enter Onboarding — 3-Step Flow

The landing page and pricing page MUST display a **3-step onboarding visualization** with the following exact sequence:

**Step 1 — "Elige tu Plan y Paga"**: User selects a plan and completes payment before accessing the product.

**Step 2 — "Sube tus Prendas"**: User uploads their clothing catalog to the platform.

**Step 3 — "Vende en Instagram, WhatsApp y la Web"**: User receives their shop link and shares it across social channels.

The system SHALL render this as a horizontal stepper or vertical numbered list, visible above the fold on the landing page and in the pricing page CTA area.

#### Scenario: User completes Step 1 (payment)

- GIVEN a user has selected a plan and entered payment information
- WHEN payment is confirmed
- THEN the system grants access to the dashboard
- AND displays Step 2 "Sube tus Prendas" as the next active step

#### Scenario: User completes Step 2 (upload)

- GIVEN a user has paid and accessed the dashboard
- WHEN the user uploads at least one product image
- THEN the system marks Step 2 as complete
- AND displays Step 3 "Vende en Instagram, WhatsApp y la Web"

---

### Requirement: Social Media Integration Section

The landing page MUST include a dedicated section explicitly highlighting:

1. **"Link para Biografía de Instagram"**: A short, shareable link that directs followers to the user's virtual shop. The copy MUST use the phrase "Link para Biografía de Instagram" — not "Instagram bio link" or any technical variant.

2. **"Venta por WhatsApp"**: A callout that describes how customers can browse and purchase via WhatsApp. The copy MUST use the phrase "Venta por WhatsApp" — not "WhatsApp commerce" or any technical variant.

This section MUST appear before the pricing section and MUST use iconography (Instagram and WhatsApp brand icons) alongside the copy.

#### Scenario: Landing page renders social integration section

- GIVEN a user loads the landing page
- WHEN the page finishes rendering
- THEN the section displays "Link para Biografía de Instagram" with an Instagram icon
- AND displays "Venta por WhatsApp" with a WhatsApp icon

---

### Requirement: Trust Seal — "Soporte Humano Incluido"

The landing page and pricing page MUST display a visible trust seal or badge labeled **"Soporte Humano Incluido"**. This element MUST:

- Appear in the pricing area or immediately below the primary CTA
- Use text label: "Soporte Humano Incluido"
- Be accompanied by a brief statement: "Te ayudamos a configurar tu tienda — sin costos extra"

#### Scenario: Trust seal appears on pricing page

- GIVEN a user views the pricing page
- WHEN the page renders
- THEN the "Soporte Humano Incluido" badge is visible near the plan selection
- AND the support statement appears beneath the badge

---

### Requirement: Language Audit — Ban Technical Terms from Public Pages

The following terms are PROHIBITED from appearing on any public-facing landing page or pricing page:

| Banned Term | Required Replacement |
|-------------|---------------------|
| "widget" | "Probador" |
| "script" | "Link del Probador" |
| "embed" | "Espejo Virtual" |
| "slug" | "Tu link" or product name |

The system MUST NOT render these banned terms in any visible copy. This applies to all text, tooltips, placeholder content, and error messages shown to end users.

#### Scenario: Copy passes language audit

- GIVEN a content editor reviews the landing page source
- WHEN the page renders
- THEN none of the banned terms appear in the visible output
- AND all replacements are correctly applied

#### Scenario: Old references are updated in metadata

- GIVEN a user inspects page meta tags or OG descriptions
- WHEN the system renders meta tags for the landing page
- THEN no banned terms appear in the metadata content

---

## MODIFIED Requirements

### Requirement: Pricing Conversion Flow — Pay-to-Enter

The pricing page and signup flow MUST require payment before granting access to product setup. The user MUST NOT be able to access the dashboard or upload inventory without completing a payment transaction first.

(Previously: Free tier allowed partial access before payment)

#### Scenario: New user selects a plan

- GIVEN a new user clicks "Comenzar" on a plan card
- WHEN the payment form renders
- THEN the user is required to enter payment details before proceeding
- AND upon successful payment, the system redirects to the product upload step

#### Scenario: User attempts to skip payment

- GIVEN a user tries to navigate directly to the dashboard URL without paying
- WHEN the system checks for an active subscription
- THEN the system returns an access-denied response
- AND redirects the user to the pricing page with a message "Elige un plan para continuar"

---

## REMOVED Requirements

### Requirement: Free Mini-Landing Access (deprecated)

The free tier that allowed users to access the Mini-Landing editor and generate shareable links before subscribing is REMOVED. All access now requires a paid plan.

(Reason: Pay-to-Enter flow required for conversion-focused landing redesign)

---

## Acceptance Criteria Summary

| # | Criterion |
|---|-----------|
| 1 | "Mini-Landing" term fully replaced with "Pequeña Tienda Virtual" / "Tu Catálogo Interactivo" |
| 2 | 3-step onboarding visible on landing and pricing pages |
| 3 | "Link para Biografía de Instagram" and "Venta por WhatsApp" explicit copy present |
| 4 | "Soporte Humano Incluido" badge visible near CTA |
| 5 | No banned terms (widget, script, embed, slug) in public copy |
| 6 | Pay-to-Enter enforced — no dashboard access without payment |