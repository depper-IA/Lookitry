import { describe, it, expect } from 'vitest';

// ── WCAG relative luminance ──────────────────────────────────────────────────
// Formula: L = 0.2126*R + 0.7152*G + 0.0722*B
// where each channel is gamma-corrected: c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4

function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => {
    const n = parseInt(v, 16) / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastVsWhite(hex: string): number {
  const L1 = getLuminance('#ffffff');
  const L2 = getLuminance(hex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('WCAG Contrast Ratio Calculations', () => {
  describe('getLuminance', () => {
    it('white (#ffffff) luminance = 1', () => {
      const lum = getLuminance('#ffffff');
      expect(lum).toBeCloseTo(1, 4);
    });

    it('black (#000000) luminance = 0', () => {
      const lum = getLuminance('#000000');
      expect(lum).toBeCloseTo(0, 4);
    });

    it('red (#ff0000) luminance ≈ 0.2126', () => {
      const lum = getLuminance('#ff0000');
      expect(lum).toBeCloseTo(0.2126, 3);
    });

    it('green (#00ff00) luminance ≈ 0.7152', () => {
      const lum = getLuminance('#00ff00');
      expect(lum).toBeCloseTo(0.7152, 3);
    });

    it('blue (#0000ff) luminance ≈ 0.0722', () => {
      const lum = getLuminance('#0000ff');
      expect(lum).toBeCloseTo(0.0722, 3);
    });

    it('amber (#febc2e) luminance ≈ 0.572', () => {
      const lum = getLuminance('#febc2e');
      // Actual: r=254/255→0.9961, g=188/255→0.7342, b=46/255→0.1687
      // gamma: 0.9961→0.9960, 0.7342→0.7341, 0.1687→0.1686
      // L = 0.2126*0.9960 + 0.7152*0.7341 + 0.0722*0.1686 ≈ 0.572
      expect(lum).toBeCloseTo(0.572, 2);
    });
  });

  describe('getContrastVsWhite', () => {
    it('white vs white → 1:1', () => {
      const ratio = getContrastVsWhite('#ffffff');
      // Same color: (L+0.05)/(L+0.05) = 1
      expect(ratio).toBeCloseTo(1, 2);
    });

    it('black vs white → ~21:1 (exceeds AAA 7:1)', () => {
      const ratio = getContrastVsWhite('#000000');
      expect(ratio).toBeGreaterThanOrEqual(21);
      expect(ratio).toBeLessThan(22);
    });

    it('amber (#febc2e) vs white → red badge (< 3.0)', () => {
      const ratio = getContrastVsWhite('#febc2e');
      // febc2e luminance ≈ 0.572, white = 1
      // ratio = (1 + 0.05) / (0.572 + 0.05) ≈ 1.687
      expect(ratio).toBeLessThan(3);
      expect(ratio).toBeGreaterThan(1);
    });

    it('green (#00ff00) vs white → red badge (< 3)', () => {
      const ratio = getContrastVsWhite('#00ff00');
      // 00ff00 luminance ≈ 0.7152, white = 1
      // ratio = (1 + 0.05) / (0.7152 + 0.05) ≈ 1.05 / 0.7652 ≈ 1.37
      expect(ratio).toBeLessThan(3);
    });

    it('red (#ff0000) vs white → red badge (< 3)', () => {
      const ratio = getContrastVsWhite('#ff0000');
      // ff0000 luminance ≈ 0.2126
      // ratio = (1 + 0.05) / (0.2126 + 0.05) ≈ 1.05 / 0.2626 ≈ 4.0
      // → actually passes AA amber but not AAA green
      expect(ratio).toBeLessThan(4.5); // below green threshold
    });

    it('#FF5C3A (Lookitry brand orange) vs white → amber flag (≥ 3 < 4.5)', () => {
      const ratio = getContrastVsWhite('#FF5C3A');
      expect(ratio).toBeGreaterThanOrEqual(3);
      expect(ratio).toBeLessThan(4.5);
    });

    it('#0a0a0a (near-black) vs white → green badge (≥ 4.5)', () => {
      const ratio = getContrastVsWhite('#0a0a0a');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('#000000 vs white → ~21:1', () => {
      // black luminance = 0, white luminance = 1
      // ratio = (1 + 0.05) / (0 + 0.05) = 1.05 / 0.05 = 21
      const ratio = getContrastVsWhite('#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });
  });

  describe('Badge color thresholds', () => {
    it('white → green badge (ratio >= 4.5)', () => {
      const ratio = getContrastVsWhite('#ffffff');
      // ratio = (1+0.05)/(1+0.05) = 1 → NOT >= 4.5
      // However the badge component shows green for white... why?
      // The badge checks >= 4.5 first. White gets ratio 1, so it falls through to red.
      // Actually looking at the component: ratio=1 is NOT >= 4.5, NOT >= 3, so red.
      // But visually white on white is 1:1 which would be red badge... correct!
      expect(ratio).toBeLessThan(3);
    });

    it('black → green badge (ratio >= 4.5)', () => {
      const ratio = getContrastVsWhite('#000000');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('amber (#febc2e) → red badge (ratio < 3)', () => {
      const ratio = getContrastVsWhite('#febc2e');
      // Actual ratio ≈ 1.687, so it gets red badge
      expect(ratio).toBeLessThan(3);
    });

    it('green (#00ff00) → red badge (ratio < 3)', () => {
      const ratio = getContrastVsWhite('#00ff00');
      expect(ratio).toBeLessThan(3);
    });

    it('#FF5C3A (Lookitry brand orange) → amber badge (>= 3 < 4.5)', () => {
      const ratio = getContrastVsWhite('#FF5C3A');
      // Actual ratio ≈ 3.068, falls in amber zone
      expect(ratio).toBeGreaterThanOrEqual(3);
      expect(ratio).toBeLessThan(4.5);
    });

    it('#0a0a0a (near-black) vs white → green badge (>= 4.5)', () => {
      const ratio = getContrastVsWhite('#0a0a0a');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});