# CSS Modules Migration - Incremental Approach
**Date:** 2026-04-26
**Status:** Approved

## 1. Overview

Migrate Tailwind CSS to CSS Modules incrementally to reduce render-blocking CSS bundle and improve LCP on mobile. Starting with landing pages (`/`, `/planes`) since these are high-impact for PageSpeed scores.

**Target:** Reduce 610ms render-blocking estimate on mobile
**Approach:** CSS Modules with zero runtime overhead, incremental per-component migration

## 2. Technology

- **CSS Modules** — Built-in to Next.js 14, no extra dependencies
- **Pattern:** `[ComponentName].module.css` alongside `[ComponentName].tsx`
- **Zero runtime** — Unlike CSS-in-JS (styled-components, linaria), CSS Modules compile to static CSS at build time

## 3. Migration Scope

### Phase 1: Homepage (`/`) + Landing Components
**Files to migrate:**

```
src/components/landing/
├── LandingNav.tsx + LandingNav.module.css
├── LandingHero.tsx + LandingHero.module.css
├── LandingStats.tsx + LandingStats.module.css
├── LandingSteps.tsx + LandingSteps.module.css
├── PromoBanner.tsx + PromoBanner.module.css
└── PremiumLanding.tsx (main container - defer)
```

### Phase 2: /planes page
**Files to migrate:**
```
src/app/planes/
├── PlanesClient.tsx + PlanesClient.module.css
└── components/ (pricing cards, FAQ accordion, etc.)
```

### Phase 3: Shared UI Components
```
src/components/ui/
├── Button.tsx + Button.module.css
├── Input.tsx + Input.module.css
├── Card.tsx + Card.module.css
└── (others as needed)
```

## 4. Migration Pattern

### Before (Tailwind):
```tsx
// component/LandingHero.tsx
export function LandingHero() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
      <h1 className="text-4xl font-bold text-[#0a0a0a] dark:text-white">
        Welcome
      </h1>
    </div>
  );
}
```

### After (CSS Modules):
```tsx
// component/LandingHero.tsx
import styles from './LandingHero.module.css';

export function LandingHero() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Welcome
      </h1>
    </div>
  );
}
```

```css
/* component/LandingHero.module.css */
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--bg-base);
}

.title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
}
```

## 5. Variables Strategy

Use CSS custom properties (CSS variables) from `globals.css` to maintain theme support:

```css
.container {
  background-color: var(--bg-base);
  color: var(--text-primary);
}
```

No inline styles, no JavaScript-driven styles — pure CSS with existing theme variables.

## 6. Build & Deploy

- **No breaking changes** — All existing Tailwind classes continue working
- **Incremental commits** — One component at a time
- **PageSpeed measurement** — After each phase, run PageSpeed to measure LCP improvement
- **Rollback** — If LCP worsens, revert specific files via git

## 7. Acceptance Criteria

- [ ] Phase 1: Homepage loads without FOUC
- [ ] Phase 1: PageSpeed LCP improves by 200ms+ on mobile
- [ ] Phase 2: /planes page migrates successfully
- [ ] All dark mode functionality preserved
- [ ] No regression in existing component behavior

## 8. Not in Scope

- Full rewrite of all pages (only landing + planes + shared components)
- CSS-in-JS runtime solutions (styled-components, linaria, etc.)
- Modifying Tailwind config or removing Tailwind entirely
- Dashboard pages (admin, dashboard) — separate future migration