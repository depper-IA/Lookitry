# Proposal: Premium Conversion Landing Redesign

## Intent

The current landing page relies heavily on technical jargon (slug, widget, script) which creates friction for non-technical boutique owners. We need to humanize the language to focus on business benefits, clarify the "Pay-to-Enter" conversion flow, and highlight the ease of integration with social media platforms (Instagram/WhatsApp).

## Scope

### In Scope
- Rewrite all landing page copy to business-focused language (humanizing).
- Restructure the conversion flow to clearly indicate: Choose Plan -> Pay -> Get Setup.
- Add "3 Simple Steps" onboarding section.
- Add "Social Media Integration" highlights (Instagram Bio, WhatsApp link).
- Add "Human Support/Installation Included" guarantee.

### Out of Scope
- Major architectural changes to the backend API.
- Re-designing the core Try-On algorithm.

## Capabilities

### New Capabilities
- `landing-human-copy`: New copy and messaging framework centered on business value.
- `onboarding-steps-component`: New UI component for "3 Simple Steps" visualization.
- `social-use-cases-section`: Section highlighting Instagram/WhatsApp integrations.
- `support-guarantee-component`: Visual element for installation support.

### Modified Capabilities
- `pricing-conversion-flow`: Requirement change to force Payment before Setup (Pay-to-Enter).

## Approach

- Humanize UI copy: Replace "slug/widget/script" with "link/mirror/setup".
- Redesign the landing page content strategy to prioritize conversion (Pay -> Setup).
- Implement the "3 Simple Steps" component.
- Update the pricing section to ensure clear Pay-to-Enter behavior.
- Add the Support Guarantee component to the footer/pricing area.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/app/page.tsx` | Modified | Landing page text and structure |
| `frontend/src/components/` | New | Onboarding steps, support guarantee |
| `frontend/src/app/pricing/` | Modified | Conversion flow logic |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conversion rate drop due to Pay-to-Enter | Medium | Monitor KPIs closely, provide clear onboarding support |
| Existing users confused by new language | Low | Keep brief tooltips if necessary |

## Rollback Plan

- Revert to previous landing page copy/layout via Git commit.

## Dependencies

- None.

## Success Criteria

- [ ] Clear conversion flow: Choose Plan -> Pay -> Setup.
- [ ] Improved understanding of technical concepts (as measured by user testing/feedback).
- [ ] Increased conversion from landing page to paid setup.
