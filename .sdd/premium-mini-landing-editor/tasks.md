# Tasks: Premium Mini-Landing Editor Upgrade

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Add `.glass-panel` utility to `frontend/src/styles/globals.css` — `backdrop-blur-xl bg-white/60 border border-white/20 shadow-2xl` with `prefers-reduced-motion` fallback
- [x] 1.2 Create `frontend/src/app/dashboard/mi-pagina/components/sections/` directory
- [x] 1.3 Create `frontend/src/app/dashboard/mi-pagina/components/preview/` directory

## Phase 2: Premium Controls — PremiumColorPicker & TypographyScalePicker

- [x] 2.1 Create `PremiumColorPicker.tsx` in `components/preview/` — wrap `<input type="color">` + hex input, gradient mesh canvas, WCAG contrast badge (green/amber/red vs white), recent swatches (last 8 from localStorage)
- [x] 2.2 Create `TypographyScalePicker.tsx` in `components/preview/` — button grid with live "Aa" preview using actual font class, extend existing font buttons (Jakarta, Playfair, Tech, DM Sans)
- [x] 2.3 Export both components from `components/preview/index.ts`

## Phase 3: DesignTab Refactor — Section Components

- [ ] 3.1 Create `ThemeSection.tsx` — logo uploads (main + light/dark adaptive), font selector, header visibility toggle (~60 lines)
- [ ] 3.2 Create `ColorSection.tsx` — 4 color inputs using `PremiumColorPicker` (primary, secondary, widgetBg, coverBg) with tooltips (~40 lines)
- [ ] 3.3 Create `HeroSection.tsx` — cover image upload, cover overlay opacity slider, background color fallback (~50 lines)
- [ ] 3.4 Create `ContentSection.tsx` — slogan input, CTA text input, description textarea (~30 lines)
- [ ] 3.5 Create `SocialSection.tsx` — WhatsApp, socials (IG, FB, TikTok, YT, X), address, rating/reviews, national shipping toggle (~70 lines)
- [ ] 3.6 Create `ScheduleSection.tsx` — 7-day schedule inputs (Lunes-Domingo) (~40 lines)
- [ ] 3.7 Refactor `DesignTab.tsx` to import and render all 6 sections — target ~50 lines, remove all section code (~425→~50)
- [ ] 3.8 Move `Tooltip` component to shared `components/ui/Tooltip.tsx` and import in both DesignTab and sections

## Phase 4: Layout & UI Polish

- [ ] 4.1 Update `page.tsx` — increase preview sticky height from 640px to 720px, add device frame toggle (desktop/tablet/mobile icons) in browser bar
- [ ] 4.2 Apply `glass-panel` class to preview container in `page.tsx`
- [ ] 4.3 Add zoom toggle (50%/75%/100%) to preview status bar in `page.tsx`
- [ ] 4.4 Wrap DesignTab sections in collapsible accordion panels with framer-motion animatePresence

## Phase 5: Integration & Verification

- [ ] 5.1 Verify save/load flow: change color/font in editor → `handleSave` payload matches original schema → reload brand → values restored
- [ ] 5.2 Unit test `PremiumColorPicker` contrast calculation: luminance formula returns correct WCAG ratio for white (#fff) and amber (#febc2e)
- [ ] 5.3 Snapshot test `TypographyScalePicker` renders correct font class for each font option
- [ ] 5.4 Verify `DesignTab` reduced to <200 lines via line count check
- [ ] 5.5 Verify glassmorphism panels render without visual artifacts on Chrome/Firefox/Safari

## Implementation Order
Glass utilities first (1.1–1.3) → Premium controls (2.x) → Section components (3.x) in parallel → DesignTab refactor (3.7–3.8) → Layout polish (4.x) → Tests (5.x). Controls (2.x) are standalone and can be built before section components (3.x).
