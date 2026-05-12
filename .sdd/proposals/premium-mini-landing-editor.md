# Proposal: premium-mini-landing-editor

## Intent

The current mini-landing editor (`/dashboard/mi-pagina`) is functional but feels generic. This upgrade transforms it into a premium Webflow/Figma-like editing experience with glassmorphism aesthetics, advanced custom controls (color picker with gradient mesh, typography scale, live preview), and an improved layout that makes brand configuration feel exclusive and powerful.

## Scope

### In Scope (Phase 1)
- **UI Polish**: Frosted glass panels, refined shadows, premium micro-animations, dark-mode-first palette
- **Premium Controls**: 
  - Color picker with gradient mesh + recent/history swatches
  - Typography scale selector with live font previews
  - Opacity/overlay sliders with visual handle
- **Layout Enhancement**: Two-column editor → stacked sections with collapsible panels; improved preview positioning (larger, more prominent)
- **Design Tab Refactor**: Extract into smaller sub-components (`ColorSection`, `TypographySection`, `HeroSection`, `ContentSection`, `SocialSection`, `ScheduleSection`)

### Out of Scope
- Drag-and-drop reorder (future phase)
- Multi-brand/team collaboration (future phase)
- AI-generated copy suggestions (future phase)
- Mobile-responsive editor (separate ticket)

## Capabilities

### New Capabilities
- `glassmorphism-editor-shell`: Frosted glass container wrapping the editor shell with backdrop-blur, refined border treatment
- `premium-color-picker`: Extended color control with gradient mesh, recent swatches, and auto-contrast checker
- `typography-scale-picker`: Font family + weight + size scale selector with inline preview
- `collapsible-editor-panels`: Accordion-style collapsible sections in DesignTab for cleaner UX

### Modified Capabilities
- None (Phase 1 is pure UI enhancement; no spec-level behavior change)

## Approach

- **Glassmorphism System**: Add `.glass-panel` class to Tailwind config — `backdrop-blur-xl bg-white/60 border border-white/20 shadow-2xl`
- **Control Upgrades**: Replace bare `<input type="color">` with a custom `PremiumColorPicker` component (swatches + gradient + contrast checker)
- **Font Selector**: Extend existing font grid into a `TypographyScalePicker` with size/weight/lh options
- **Panel Refactor**: Break `DesignTab.tsx` (425 lines) into `sections/` sub-components per capability listed above
- **Preview Enhancement**: Increase sticky preview height, add zoom toggle, show device frame selector (desktop/tablet/mobile)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/app/dashboard/mi-pagina/page.tsx` | Modified | Two-column → enhanced two-column; preview upgrades |
| `frontend/src/app/dashboard/mi-pagina/components/DesignTab.tsx` | Refactored | Split into `sections/` sub-components |
| `frontend/src/app/dashboard/mi-pagina/components/preview/` | New | New `PremiumColorPicker.tsx`, `TypographyScalePicker.tsx` |
| `frontend/src/app/dashboard/mi-pagina/components/LandingPreview.tsx` | Modified | Device frame selector, zoom toggle |
| `frontend/src/styles/globals.css` | Modified | Glassmorphism utility classes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backdrop blur causes performance issues on low-end devices | Low | Add `prefers-reduced-motion` media query fallback; make glassmorphism a toggle |
| Color picker refactor breaks existing color save/load | Medium | Snapshot tests; verify brand config loads in preview |
| Over-designing makes the editor slower to use | Medium | User testing session after Phase 1; iterate on panel collapse UX |

## Rollback Plan

1. Revert `globals.css` glassmorphism classes
2. Restore original `DesignTab.tsx` from git
3. Revert `page.tsx` layout changes
4. No DB migration needed (only UI changes)

## Dependencies

- Framer Motion (already in use — extend animations)
- Tailwind CSS (already in use — add glass utilities)

## Success Criteria

- [ ] DesignTab reduced to <200 lines via sub-components
- [ ] PremiumColorPicker has gradient mesh + recent swatches + contrast check
- [ ] Preview shows device frame selector (desktop/tablet/mobile)
- [ ] Glassmorphism panels render without visual artifacts on target browsers
- [ ] Zero regression in save/load brand config flow