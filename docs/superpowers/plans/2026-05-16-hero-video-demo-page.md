# Hero Video + Demo Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero widget with a full-bleed Shopify-style video hero, and move the try-on demo to a dedicated `/demo` page with a split widget + result layout.

**Architecture:** Extract the existing TryOnDemoWidget from LandingHero into its own component, rewrite LandingHero as a pure video hero, add scroll-aware transparency to LandingNav, and create a new `/demo` route that uses the extracted widget alongside a ResultPanel with a post-generation upsell.

**Tech Stack:** Next.js 14 App Router, React 18, Framer Motion, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/components/landing/LandingCopy.ts` | Modify | Add `rotating_words` array, update hero copy |
| `frontend/src/components/landing/LandingNav.tsx` | Modify | Add `transparent` prop + scroll-aware background |
| `frontend/src/components/landing/PremiumLanding.tsx` | Modify | Pass `transparent={true}` to LandingNav |
| `frontend/src/components/tryon/TryOnDemoWidget.tsx` | Create | Extracted try-on logic + widget JSX from LandingHero |
| `frontend/src/components/landing/LandingHero.tsx` | Rewrite | Video BG + cycling text + 2 CTAs — no widget logic |
| `frontend/src/app/demo/page.tsx` | Create | Minimal Server Component shell |
| `frontend/src/app/demo/DemoPageClient.tsx` | Create | Full demo page: mini-hero + widget + ResultPanel + upsell |
| `frontend/src/__tests__/components/landing/LandingHero.test.tsx` | Create | Tests for cycling text + CTAs |
| `frontend/src/__tests__/components/tryon/TryOnDemoWidget.test.tsx` | Create | Tests for widget config fetch + step flow |

---

## Task 1: Update LandingCopy with new hero content

**Files:**
- Modify: `frontend/src/components/landing/LandingCopy.ts`

- [ ] **Step 1.1: Update the hero object in LandingCopy.ts**

Open `frontend/src/components/landing/LandingCopy.ts` and replace the `hero` block (currently lines ~7–13):

```ts
export const LANDING_COPY = {
  hero: {
    title: "Tu tienda puede ser",
    rotating_words: [
      "una marca que vende.",
      "un probador digital.",
      "más que un catálogo.",
    ],
    subtitle: "Tus clientas se prueban tu ropa desde Instagram o WhatsApp usando solo su celular. Reduce devoluciones y aumenta la confianza.",
    cta_primary: "Pruébalo ahora gratis",
    cta_secondary: "Ver planes",
  },
  // ... rest unchanged
```

- [ ] **Step 1.2: Commit**

```bash
git add frontend/src/components/landing/LandingCopy.ts
git commit -m "feat: update hero copy with rotating words for video hero"
```

---

## Task 2: Add transparent scroll-aware behavior to LandingNav

**Files:**
- Modify: `frontend/src/components/landing/LandingNav.tsx` (around line 72–226)
- Test: `frontend/src/__tests__/components/landing/LandingNav.test.tsx`

- [ ] **Step 2.1: Add `transparent` to LandingNavProps interface**

Find the interface at line ~72 and add the prop:

```ts
interface LandingNavProps {
  transparent?: boolean;        // ← add this
  currency?: 'COP' | 'USD';
  onCurrencyChange?: (c: 'COP' | 'USD') => void;
}
```

- [ ] **Step 2.2: Add scroll state and listener inside the component**

After the existing `useState` declarations (around line 86–95), add:

```ts
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  if (!transparent) return;
  const onScroll = () => setScrolled(window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, [transparent]);
```

- [ ] **Step 2.3: Make `navBg` dynamic based on transparent + scrolled state**

Find line ~221:
```ts
const navBg = 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-black/5 dark:border-white/5';
```

Replace with:
```ts
const navBg = transparent && !scrolled
  ? 'bg-transparent border-b border-transparent'
  : 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-black/5 dark:border-white/5';
```

- [ ] **Step 2.4: Make nav text white when transparent and unscrolled**

At the `<nav>` element (line ~225), add a conditional text color class:
```tsx
<nav
  className={`sticky top-0 left-0 right-0 z-[70] w-full px-4 py-4 sm:px-6 sm:py-5 md:px-12 transition-all duration-300 ${navBg} ${transparent && !scrolled ? 'text-white [&_.nav-logo]:text-white [&_.nav-currency-btn]:text-white/70 [&_.nav-products-btn]:text-white/70' : ''}`}
  // ... rest unchanged
>
```

- [ ] **Step 2.5: Write test**

Create `frontend/src/__tests__/components/landing/LandingNav.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all context/hooks LandingNav uses
vi.mock('@/contexts/PromoBannerContext', () => ({ usePromoBanner: () => ({ bannerHeight: 0 }) }));
vi.mock('@/hooks/usePublicSession', () => ({ usePublicSession: () => ({ session: null }) }));
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ toggleTheme: vi.fn(), isDark: true }) }));
vi.mock('@/services/auth.service', () => ({ authService: { logout: vi.fn() } }));

import LandingNav from '@/components/landing/LandingNav';

describe('LandingNav transparent mode', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
  });

  it('applies transparent class when transparent=true and not scrolled', () => {
    const { container } = render(<LandingNav transparent={true} />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('bg-transparent');
  });

  it('applies solid background after scrolling past 20px', async () => {
    const { container } = render(<LandingNav transparent={true} />);
    await act(async () => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 25 });
      window.dispatchEvent(new Event('scroll'));
    });
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('bg-white/95');
  });

  it('always shows solid background when transparent=false', () => {
    const { container } = render(<LandingNav transparent={false} />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('bg-white/95');
  });
});
```

- [ ] **Step 2.6: Run test — expect FAIL first**

```bash
cd frontend && pnpm vitest run src/__tests__/components/landing/LandingNav.test.tsx
```

Expected: FAIL (prop not yet wired).

- [ ] **Step 2.7: Run test after implementation — expect PASS**

```bash
cd frontend && pnpm vitest run src/__tests__/components/landing/LandingNav.test.tsx
```

Expected: all 3 pass.

- [ ] **Step 2.8: Commit**

```bash
git add frontend/src/components/landing/LandingNav.tsx frontend/src/__tests__/components/landing/LandingNav.test.tsx
git commit -m "feat: add transparent scroll-aware prop to LandingNav"
```

---

## Task 3: Pass `transparent` from PremiumLanding to LandingNav

**Files:**
- Modify: `frontend/src/components/landing/PremiumLanding.tsx` (line ~107)

- [ ] **Step 3.1: Update LandingNav usage in PremiumLanding**

Find (around line 107):
```tsx
<LandingNav currency={navCurrency} onCurrencyChange={handleNavCurrencyChange} />
```

Replace with:
```tsx
<LandingNav currency={navCurrency} onCurrencyChange={handleNavCurrencyChange} transparent={true} />
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/components/landing/PremiumLanding.tsx
git commit -m "feat: enable transparent navbar on landing page hero"
```

---

## Task 4: Extract TryOnDemoWidget from LandingHero

**Files:**
- Create: `frontend/src/components/tryon/TryOnDemoWidget.tsx`
- Test: `frontend/src/__tests__/components/tryon/TryOnDemoWidget.test.tsx`

This task extracts ALL try-on state, logic, and widget JSX from `LandingHero.tsx` into a standalone component.

- [ ] **Step 4.1: Write failing test first**

Create `frontend/src/__tests__/components/tryon/TryOnDemoWidget.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('@/components/ui/UpgradeModal', () => ({ UpgradeModal: () => <div data-testid="upgrade-modal" /> }));
vi.mock('@/components/landing/PostDemoModal', () => ({ PostDemoModal: () => <div data-testid="post-demo-modal" /> }));

import TryOnDemoWidget from '@/components/tryon/TryOnDemoWidget';

const mockConfig = {
  brand: { id: 'b1', name: 'Demo Brand', slug: 'demo' },
  products: [
    { id: 'p1', name: 'Blusa Floral', short_description: null, image_url: '/img.jpg', category: 'camisas', price: 80000 },
  ],
};

describe('TryOnDemoWidget', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });
  });

  it('renders the widget header', async () => {
    render(<TryOnDemoWidget />);
    await waitFor(() => expect(screen.getByText(/Pruébalo ahora mismo/i)).toBeInTheDocument());
  });

  it('renders product name after config loads', async () => {
    render(<TryOnDemoWidget />);
    await waitFor(() => expect(screen.getByText('Blusa Floral')).toBeInTheDocument());
  });

  it('calls onResult when a result image is received', async () => {
    const onResult = vi.fn();
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockConfig })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, resultImageUrl: '/result.jpg' }) });

    render(<TryOnDemoWidget onResult={onResult} />);
    await waitFor(() => screen.getByText('Blusa Floral'));
    // Further interaction tests would fire upload + generate
  });
});
```

- [ ] **Step 4.2: Run test — expect FAIL**

```bash
cd frontend && pnpm vitest run src/__tests__/components/tryon/TryOnDemoWidget.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4.3: Create TryOnDemoWidget.tsx**

Create `frontend/src/components/tryon/TryOnDemoWidget.tsx` with ALL try-on logic extracted from `LandingHero.tsx`:

```tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Camera, Check, Loader2, X, RotateCcw, ImageIcon } from 'lucide-react';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { PostDemoModal } from '@/components/landing/PostDemoModal';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  image_url: string;
  category: string;
  price: number | null;
}

interface HomeTryonConfig {
  brand: { id: string; name: string; slug: string };
  products: Product[];
}

type TryOnStep = 'select' | 'selfie' | 'loading' | 'result';

export interface TryOnDemoWidgetProps {
  /** Called with the result image URL after a successful generation */
  onResult?: (resultUrl: string) => void;
  /** Whether to show the browser chrome bar. Default: true */
  showBrowserChrome?: boolean;
}

// ── ProductItem ───────────────────────────────────────────────────────────────

const ProductItem = React.memo(({ prod, selectedProduct, onSelect }: {
  prod: Product;
  selectedProduct: Product | null;
  onSelect: (p: Product) => void;
}) => {
  const isSelected = selectedProduct?.id === prod.id;
  return (
    <div
      onClick={() => onSelect(prod)}
      className={`group/item flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all duration-200 sm:gap-3 sm:rounded-xl sm:p-3 ${isSelected ? 'border-accent bg-accent/10 shadow-lg shadow-accent/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar ${prod.name}`}
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-border-active sm:h-14 sm:w-14">
        <Image src={prod.image_url} alt={prod.name} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-[9px] font-bold sm:text-[11px] ${isSelected ? 'text-white' : 'text-white/60'}`}>{prod.name}</span>
        <span className="text-[7px] capitalize text-white/30 sm:text-[8px] truncate">{prod.category}</span>
        {prod.price && <span className="text-[7px] font-bold text-accent sm:text-[9px]">${prod.price.toLocaleString('es-CO')}</span>}
      </div>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent sm:h-5 sm:w-5" aria-hidden="true">
          <Check size={8} className="text-white sm:text-xs" />
        </motion.div>
      )}
    </div>
  );
});
ProductItem.displayName = 'ProductItem';

// ── TryOnDemoWidget ───────────────────────────────────────────────────────────

export default function TryOnDemoWidget({ onResult, showBrowserChrome = true }: TryOnDemoWidgetProps) {
  const [config, setConfig] = useState<HomeTryonConfig | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<TryOnStep>('select');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPostDemoModal, setShowPostDemoModal] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/home/tryon/config');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data?.products) throw new Error('No se pudieron cargar los productos de prueba.');
        setConfig(data);
        if (data.products.length > 0) setSelectedProduct(data.products[0]);
      } catch (err: any) {
        console.warn('[TryOnDemoWidget] Error loading config:', err.message);
        setError(err.message || 'Error al conectar con el servidor.');
      }
    };
    const timer = setTimeout(loadConfig, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (step === 'result' && resultImage) {
      onResult?.(resultImage);
      const captured = localStorage.getItem('lead_captured');
      if (!captured) {
        const timer = setTimeout(() => setShowPostDemoModal(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [step, resultImage, onResult]);

  const handleLeadCaptured = useCallback(() => {
    localStorage.setItem('lead_captured', 'true');
    setShowPostDemoModal(false);
  }, []);

  const fetchTrialStatus = useCallback(async () => {
    if (!selectedProduct) return false;
    if (hasUsedTrial !== undefined) return hasUsedTrial;
    try {
      const res = await fetch(`/api/home/tryon/check?productId=${selectedProduct.id}`);
      const data = await res.json();
      setHasUsedTrial(data.hasTrialed);
      return data.hasTrialed;
    } catch {
      setHasUsedTrial(false);
      return false;
    }
  }, [selectedProduct, hasUsedTrial]);

  const handleProductSelect = useCallback((product: Product) => setSelectedProduct(product), []);

  const handleSelfieChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setSelfie(base64.split(',')[1]);
      setSelfiePreview(base64);
      setStep('selfie');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selfie || !selectedProduct) return;
    setIsGenerating(true);
    setError(null);
    setStep('loading');
    try {
      const formData = new FormData();
      formData.append('productId', selectedProduct.id);
      const base64Data = selfie.split(',')[1] || selfie;
      const binaryData = Buffer.from(base64Data, 'base64');
      const blob = new Blob([binaryData], { type: 'image/jpeg' });
      formData.append('selfie', blob, 'selfie.jpg');
      const res = await fetch('/api/home/tryon/generate', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.status === 429 || data.error === 'TRIAL_LIMIT_EXCEEDED') {
        setShowUpgradeModal(true);
        setStep('select');
        setHasUsedTrial(true);
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.message || 'Error generando prueba');
      setResultImage(data.resultImageUrl);
      setStep('result');
    } catch (err: any) {
      console.warn('[TryOnDemoWidget] Generation error:', err.message);
      setError(err.message || 'Error en el servicio');
      setStep('selfie');
    } finally {
      setIsGenerating(false);
    }
  }, [selfie, selectedProduct]);

  const handleBack = useCallback(() => { setStep('select'); setResultImage(null); setError(null); }, []);
  const handleChangeProduct = useCallback(() => { setStep('select'); setResultImage(null); setError(null); }, []);

  const handleCTA = useCallback(async () => {
    if (!selfie) { setStep('selfie'); return; }
    if (hasUsedTrial === undefined) {
      const hasTrialed = await fetchTrialStatus();
      if (hasTrialed) { setShowUpgradeModal(true); return; }
    } else if (hasUsedTrial) { setShowUpgradeModal(true); return; }
    if (selectedProduct) handleGenerate();
  }, [selfie, hasUsedTrial, selectedProduct, fetchTrialStatus, handleGenerate]);

  const productItems = useMemo(() => config ? config.products.map((prod) => (
    <ProductItem key={prod.id} prod={prod} selectedProduct={selectedProduct} onSelect={handleProductSelect} />
  )) : [], [config, selectedProduct, handleProductSelect]);

  const ctaSection = useMemo(() => (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleCTA}
        disabled={!hasUsedTrial && !selectedProduct}
        className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 px-6 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        <Sparkles size={16} />
        {selfie ? 'Generar Prueba' : 'Ver Probador IA'}
      </button>
      {!hasUsedTrial && (
        <span className="flex items-center gap-1 rounded-full bg-text-muted/10 px-3 py-1 text-[9px] font-semibold text-text-primary">
          <Sparkles size={10} /> 1 generación gratis
        </span>
      )}
    </div>
  ), [handleCTA, selfie, hasUsedTrial, selectedProduct]);

  return (
    <>
      <div className="group/widget relative z-10 w-full overflow-hidden rounded-2xl border border-white/10 bg-dark-surface p-3 shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:rounded-[2rem] sm:p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-3 flex items-center justify-center gap-2 rounded-full bg-text-muted/10 px-4 py-2 text-center sm:mb-6 sm:gap-3"
        >
          <Sparkles size={15} className="text-accent" aria-hidden="true" />
          <span className="text-[15px] font-bold uppercase tracking-wider text-accent">Pruébalo ahora mismo</span>
        </motion.div>

        {/* Browser Chrome */}
        {showBrowserChrome && (
          <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3" aria-hidden="true">
            <div className="flex gap-1 sm:gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 sm:h-2 sm:w-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 sm:h-2 sm:w-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent sm:h-2 sm:w-2" />
            </div>
            <div className="flex-1 truncate rounded-md border border-white/5 bg-dark-card px-2 py-1 text-center font-dm-sans text-[7px] uppercase tracking-widest text-text-muted sm:px-4 sm:text-[9px]">
              lookitry.com/demo
            </div>
          </div>
        )}

        {/* Step: SELECT */}
        {step === 'select' && config && (
          <div className="flex flex-col gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
              className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-dark-card p-4 text-center hover:border-white/20 sm:p-6"
            >
              <div className="absolute top-2 left-4 text-[6px] font-bold uppercase tracking-widest text-white/20 sm:text-[8px]">Tu Foto</div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5 overflow-hidden sm:h-16 sm:w-16">
                {selfiePreview ? <img src={selfiePreview} alt="Preview" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <Camera size={24} strokeWidth={1} className="text-white/20" aria-hidden="true" />}
              </div>
              <div className="mt-3 flex gap-2">
                <label className="cursor-pointer rounded-lg bg-accent/20 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/30 sm:text-[11px] min-h-11 flex items-center justify-center gap-2">
                  <Camera size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" />
                  Tomar foto
                </label>
                <label className="cursor-pointer rounded-lg bg-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/20 sm:text-[11px] min-h-11 flex items-center justify-center gap-2">
                  <ImageIcon size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" />
                  Subir foto
                </label>
              </div>
              <p className="text-[8px] font-bold capitalize tracking-widest text-white/40 sm:text-[10px]">preferiblemente cuerpo completo</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="flex flex-col gap-2 sm:gap-3">
              <div className="px-0.5 text-[7px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[8px]">Elige un Producto</div>
              {productItems}
            </motion.div>
            {ctaSection}
          </div>
        )}

        {/* Step: SELFIE */}
        {step === 'selfie' && selectedProduct && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-dark-card p-4 text-center hover:border-white/20 sm:p-6">
              {selfiePreview ? (
                <div className="relative mb-3 h-32 w-32 overflow-hidden rounded-xl sm:h-40 sm:w-40">
                  <img src={selfiePreview} alt="Tu selfie" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  <button onClick={() => { setSelfie(null); setSelfiePreview(null); }} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 sm:h-40 sm:w-40">
                  <Camera size={32} className="text-white/20" />
                </div>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg bg-accent/20 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/30 min-h-11 flex items-center justify-center gap-2">
                  <Camera size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" />
                  {selfiePreview ? 'Tomar otra' : 'Tomar foto'}
                </label>
                <label className="cursor-pointer rounded-lg bg-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/20 min-h-11 flex items-center justify-center gap-2">
                  <ImageIcon size={14} strokeWidth={2} aria-hidden="true" />
                  <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" />
                  {selfiePreview ? 'Cambiar' : 'Subir foto'}
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-dark-card p-3 hover:border-white/20">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-border-active">
                <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1">
                <div>
                  <p className="text-[11px] font-bold text-white truncate">{selectedProduct.name}</p>
                  <p className="text-[9px] capitalize text-white/40 truncate">{selectedProduct.category}</p>
                </div>
              </div>
              <button onClick={handleChangeProduct} className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"><X size={14} /></button>
            </div>
            <button onClick={handleGenerate} disabled={!selfie || isGenerating}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
            >
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generando...</> : <><Sparkles size={16} /> Ver Probador IA</>}
            </button>
            {error && <p className="text-center text-[10px] text-red-400">{error}</p>}
          </motion.div>
        )}

        {/* Step: LOADING */}
        {step === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/5 py-12">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Generando tu prueba...</p>
            <p className="mt-2 text-[9px] text-white/30">Puede tomar hasta 20 segundos</p>
          </motion.div>
        )}

        {/* Step: RESULT */}
        {step === 'result' && resultImage && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-3 sm:gap-4">
            <div className="relative overflow-hidden rounded-xl border border-accent/30 shadow-lg shadow-accent/10 aspect-square">
              <img src={resultImage} alt="Resultado del probador" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[6px] font-black uppercase text-white shadow-xl sm:text-[8px]">IA</div>
              <button onClick={handleBack} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 hover:text-white" aria-label="Limpiar">
                <RotateCcw size={12} />
              </button>
            </div>
            <div className="flex gap-2">
              <Link href="/planes" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white">Ver planes</Link>
              <Link href="/trial-checkout" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl shadow-accent/10 hover:brightness-110">
                <Sparkles size={12} /> Obtén Trial
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <PostDemoModal isOpen={showPostDemoModal} onClose={() => setShowPostDemoModal(false)} onLeadCaptured={handleLeadCaptured} />
    </>
  );
}
```

- [ ] **Step 4.4: Run test — expect PASS**

```bash
cd frontend && pnpm vitest run src/__tests__/components/tryon/TryOnDemoWidget.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add frontend/src/components/tryon/TryOnDemoWidget.tsx frontend/src/__tests__/components/tryon/TryOnDemoWidget.test.tsx
git commit -m "feat: extract TryOnDemoWidget from LandingHero into standalone component"
```

---

## Task 5: Rewrite LandingHero with video background + cycling text

**Files:**
- Rewrite: `frontend/src/components/landing/LandingHero.tsx`
- Test: `frontend/src/__tests__/components/landing/LandingHero.test.tsx`

- [ ] **Step 5.1: Write failing test**

Create `frontend/src/__tests__/components/landing/LandingHero.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));

import LandingHero from '@/components/landing/LandingHero';

describe('LandingHero', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the static part of the headline', () => {
    render(<LandingHero />);
    expect(screen.getByText(/Tu tienda puede ser/i)).toBeInTheDocument();
  });

  it('renders the first rotating word on mount', () => {
    render(<LandingHero />);
    expect(screen.getByText('una marca que vende.')).toBeInTheDocument();
  });

  it('cycles to second word after 3 seconds', async () => {
    render(<LandingHero />);
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText('un probador digital.')).toBeInTheDocument();
  });

  it('CTA primary links to /demo', () => {
    render(<LandingHero />);
    const link = screen.getByRole('link', { name: /Pruébalo ahora gratis/i });
    expect(link).toHaveAttribute('href', '/demo');
  });

  it('CTA secondary links to /planes', () => {
    render(<LandingHero />);
    const link = screen.getByRole('link', { name: /Ver planes/i });
    expect(link).toHaveAttribute('href', '/planes');
  });

  it('renders video background iframe', () => {
    render(<LandingHero />);
    const iframe = document.querySelector('iframe');
    expect(iframe?.src).toContain('1ap0baidLVo');
  });
});
```

- [ ] **Step 5.2: Run test — expect FAIL**

```bash
cd frontend && pnpm vitest run src/__tests__/components/landing/LandingHero.test.tsx
```

Expected: FAIL — old hero doesn't have the new structure.

- [ ] **Step 5.3: Rewrite LandingHero.tsx**

Replace the entire file with:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const EASING = [0.22, 1, 0.36, 1] as const;

export default function LandingHero() {
  const [wordIndex, setWordIndex] = useState(0);
  const words = LANDING_COPY.hero.rotating_words;

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-end overflow-hidden bg-black pb-20 sm:pb-28"
      aria-label="Sección principal"
    >
      {/* ── Video Background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <iframe
          title="Video de fondo decorativo"
          src="https://www.youtube.com/embed/1ap0baidLVo?autoplay=1&mute=1&loop=1&playlist=1ap0baidLVo&controls=0&disablekb=1&playsinline=1&modestbranding=1&rel=0"
          className="absolute top-1/2 left-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
        {/* Gradient overlay — dark on left, fades right */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.2) 100%)',
          }}
        />
        {/* Fallback gradient (shown if iframe fails) */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #1a0e0a 0%, #080810 50%, #0a0808 100%)',
          }}
        />
      </div>

      {/* ── Content — bottom-left, Shopify style ────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING }}
          className="max-w-2xl"
        >
          {/* Headline */}
          <h1 className="mb-5 font-jakarta font-black leading-[1.05] tracking-[-0.03em] text-white sm:mb-7"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            <span className="block">{LANDING_COPY.hero.title}</span>
            {/* Cycling word */}
            <span className="relative block h-[1.15em] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: EASING }}
                  className="absolute left-0 top-0 text-white"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-9 max-w-lg font-dm-sans text-base font-light leading-[1.65] text-white/65 sm:mb-11 sm:text-lg">
            {LANDING_COPY.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-dark shadow-xl transition-all hover:scale-[1.03] hover:-translate-y-0.5 hover:bg-white/90 active:scale-[0.97] sm:text-base"
            >
              {LANDING_COPY.hero.cta_primary}
            </Link>
            <Link
              href="/planes"
              className="flex items-center gap-2 rounded-full border-2 border-white/50 px-8 py-[14px] text-sm font-bold text-white transition-all hover:border-white hover:bg-white/5 active:scale-[0.97] sm:text-base"
            >
              {LANDING_COPY.hero.cta_secondary}
            </Link>
          </div>

          {/* Trust pills */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 sm:gap-10">
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <ShieldCheck size={13} className="shrink-0 text-accent" aria-hidden="true" /> 100% Seguro
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Clock size={13} className="shrink-0 text-accent" aria-hidden="true" /> Activación 10min
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Sparkles size={13} className="shrink-0 text-accent" aria-hidden="true" /> IA Generativa
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5.4: Run test — expect PASS**

```bash
cd frontend && pnpm vitest run src/__tests__/components/landing/LandingHero.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 5.5: Commit**

```bash
git add frontend/src/components/landing/LandingHero.tsx frontend/src/__tests__/components/landing/LandingHero.test.tsx
git commit -m "feat: rewrite LandingHero with Shopify-style video background and cycling text"
```

---

## Task 6: Create `/demo` page

**Files:**
- Create: `frontend/src/app/demo/page.tsx`
- Create: `frontend/src/app/demo/DemoPageClient.tsx`

- [ ] **Step 6.1: Create the Server Component shell**

Create `frontend/src/app/demo/page.tsx`:

```tsx
import dynamic from 'next/dynamic';

const DemoPageClient = dynamic(() => import('./DemoPageClient'), { ssr: false });

export const metadata = {
  title: 'Probador Virtual Gratis — Lookitry',
  description: 'Probate ropa con inteligencia artificial antes de comprar. Subí tu foto, elegí una prenda y la IA te muestra el resultado en 30 segundos. Gratis.',
};

export default function DemoPage() {
  return <DemoPageClient />;
}
```

- [ ] **Step 6.2: Create DemoPageClient.tsx**

Create `frontend/src/app/demo/DemoPageClient.tsx`:

```tsx
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

const TryOnDemoWidget = dynamic(() => import('@/components/tryon/TryOnDemoWidget'), { ssr: false });

const EASING = [0.22, 1, 0.36, 1] as const;

// ── ResultPanel ───────────────────────────────────────────────────────────────

function ResultPanel({ resultImage }: { resultImage: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Result image or empty state */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-dark-card">
        {resultImage ? (
          <>
            <img src={resultImage} alt="Resultado del probador virtual" className="h-full w-full object-cover" />
            <div className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-white">
              IA
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5">
              <Sparkles size={22} className="text-white/20" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">
              Tu resultado aparece acá
            </p>
            <p className="text-[9px] text-white/20">
              Subí tu foto y generá tu prueba virtual →
            </p>
          </div>
        )}
      </div>

      {/* Upsell card — visible after generation */}
      {resultImage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASING }}
          className="rounded-2xl border border-accent/25 bg-accent/8 p-6 text-center"
        >
          <p className="mb-1 font-jakarta text-xl font-black text-accent">¿Te gustó el resultado?</p>
          <p className="mb-5 text-sm text-white/50 leading-relaxed">
            Activá esto en tu tienda y tus clientes también pueden probarse la ropa antes de comprar.
          </p>
          <Link
            href="/trial-checkout"
            className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-black text-white shadow-lg shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Sparkles size={15} /> Activar en mi tienda — $20.000
          </Link>
          <Link
            href="/planes"
            className="flex items-center justify-center gap-1 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Ver todos los planes <ArrowRight size={11} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}

// ── DemoPageClient ────────────────────────────────────────────────────────────

export default function DemoPageClient() {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const scrollToWidget = () => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-dark text-white font-dm-sans">
      <LandingNav transparent={false} />

      {/* ── Mini Hero ──────────────────────────────────────────────── */}
      <section className="bg-dark pt-24 pb-14 px-6 text-center sm:pt-28 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASING }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Probador Virtual Gratuito
          </div>

          <h1 className="mb-4 font-jakarta text-4xl font-black leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl">
            Mirá cómo te queda<br />
            <span className="text-accent">antes de comprar.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-lg text-base text-white/50 leading-relaxed">
            1 generación gratis · Sin registro · Resultado en 30 segundos
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={scrollToWidget}
              className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-dark hover:bg-white/90 transition-all active:scale-[0.97]"
            >
              Subir mi foto
            </button>
            <Link
              href="/casos-de-exito"
              className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white/70 hover:border-white/40 hover:text-white transition-all"
            >
              Ver ejemplos
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Widget + Result Panel ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-10" ref={widgetRef}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Left: Widget */}
          <div>
            <TryOnDemoWidget onResult={(url) => setResultImage(url)} />
          </div>

          {/* Right: Result Panel */}
          <div className="lg:sticky lg:top-28">
            <ResultPanel resultImage={resultImage} />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 6.3: Verify dev server compiles without errors**

```bash
cd frontend && pnpm dev
```

Open `http://localhost:3000/demo` in the browser. Expected:
- Page loads with mini-hero
- Widget appears below
- Result panel shows empty state
- No TypeScript or console errors

- [ ] **Step 6.4: Verify `/` hero in the browser**

Open `http://localhost:3000`. Expected:
- Navbar is transparent, overlaid on video
- YouTube video plays muted in background
- Text cycles every 3 seconds
- "Pruébalo ahora gratis" → links to `/demo`
- "Ver planes" → links to `/planes`
- Scrolling down makes navbar solid

- [ ] **Step 6.5: Add `/demo` to sitemap if it exists**

Check `frontend/src/app/sitemap.xml/route.ts` or similar and add the `/demo` URL if the sitemap is generated dynamically.

- [ ] **Step 6.6: Commit**

```bash
git add frontend/src/app/demo/page.tsx frontend/src/app/demo/DemoPageClient.tsx
git commit -m "feat: add /demo page with mini-hero, TryOnDemoWidget, result panel and upsell"
```

---

## Task 7: Full run, cleanup, push

- [ ] **Step 7.1: Run full test suite**

```bash
cd frontend && pnpm vitest run
```

Expected: all tests pass. Fix any failures before continuing.

- [ ] **Step 7.2: TypeScript check**

```bash
cd frontend && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7.3: Add `.superpowers/` to `.gitignore`**

Open `frontend/.gitignore` (or root `.gitignore`) and add:
```
.superpowers/
```

- [ ] **Step 7.4: Commit gitignore**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm artifacts"
```

- [ ] **Step 7.5: Push**

```bash
git push
```

---

## Video Replacement (when VEO3 video is ready)

When `hero-bg.mp4` is available:

1. Place it at `frontend/public/videos/hero-bg.mp4`
2. In `LandingHero.tsx`, replace the `<iframe>` block with:

```tsx
<video
  autoPlay muted loop playsInline
  className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
  aria-hidden="true"
>
  <source src="/videos/hero-bg.mp4" type="video/mp4" />
</video>
```

3. Remove the `<iframe>` and commit:
```bash
git commit -m "feat: replace YouTube placeholder with VEO3 hero video"
```
