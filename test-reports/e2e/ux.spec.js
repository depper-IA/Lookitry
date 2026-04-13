// UX E2E Test using Playwright
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const BRAND_SLUG = 'demo';

test.describe('Lookitry UX Testing', () => {
  
  // ═══════════════════════════════════════════
  // 1. USER TESTING FLOW
  // ═══════════════════════════════════════════
  test.describe('User Testing Flow', () => {
    
    test('Step 1: Landing Page loads', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      console.log(`Landing Page load time: ${loadTime}ms`);
      await expect(page.locator('body')).toBeVisible();
      await page.screenshot({ path: './test-reports/screenshots/01_landing.png', fullPage: true });
    });
    
    test('Step 2: Widget page loads', async ({ page }) => {
      const start = Date.now();
      await page.goto(`${BASE_URL}/marca/${BRAND_SLUG}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      console.log(`Widget load time: ${loadTime}ms`);
      await page.waitForTimeout(3000); // Wait for async config load
      await expect(page.locator('body')).toBeVisible();
      await page.screenshot({ path: './test-reports/screenshots/02_widget.png', fullPage: true });
    });
    
    test('Step 3: Checkout page loads', async ({ page }) => {
      const start = Date.now();
      await page.goto(`${BASE_URL}/checkout`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      console.log(`Checkout load time: ${loadTime}ms`);
      await page.screenshot({ path: './test-reports/screenshots/03_checkout.png', fullPage: true });
    });
  });
  
  // ═══════════════════════════════════════════
  // 2. MOBILE TESTING
  // ═══════════════════════════════════════════
  test.describe('Mobile Testing', () => {
    
    test('Mobile 375px - Landing', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 10;
      });
      
      await page.screenshot({ path: './test-reports/screenshots/04_mobile375_landing.png', fullPage: true });
      expect(noOverflow).toBe(true);
    });
    
    test('Mobile 375px - Widget', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/marca/${BRAND_SLUG}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const widgetVisible = await page.locator('body').isVisible();
      await page.screenshot({ path: './test-reports/screenshots/05_mobile375_widget.png', fullPage: true });
      expect(widgetVisible).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════
  // 3. UI CHECKLIST
  // ═══════════════════════════════════════════
  test.describe('UI Checklist', () => {
    
    test('Plan Badge visible', async ({ page }) => {
      await page.goto(`${BASE_URL}/marca/${BRAND_SLUG}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const badge = page.locator('[class*="badge"], [class*="plan"], [class*="tag"]').first();
      const badgeVisible = await badge.isVisible().catch(() => false);
      
      await page.screenshot({ path: './test-reports/screenshots/06_ui_badge.png', fullPage: true });
      console.log(`Plan badge visible: ${badgeVisible}`);
    });
    
    test('IA Loader during load', async ({ page }) => {
      // Fresh page to catch initial loader
      const loaderPage = await page.context().newPage();
      await loaderPage.goto(`${BASE_URL}/marca/${BRAND_SLUG}`, { waitUntil: 'load' });
      
      const loader = loaderPage.locator('.animate-spin, [class*="spinner"]').first();
      const loaderVisible = await loader.isVisible().catch(() => false);
      
      await loaderPage.screenshot({ path: './test-reports/screenshots/07_ui_loader.png', fullPage: true });
      console.log(`IA loader visible: ${loaderVisible}`);
      await loaderPage.close();
    });
    
    test('Brand colors applied', async ({ page }) => {
      await page.goto(`${BASE_URL}/marca/${BRAND_SLUG}`);
      await page.waitForLoadState('networkidle');
      
      const brandColors = await page.evaluate(() => {
        const orange = Array.from(document.querySelectorAll('*')).filter(el => 
          getComputedStyle(el).backgroundColor.includes('255, 92, 58')
        );
        const black = Array.from(document.querySelectorAll('*')).filter(el => 
          getComputedStyle(el).backgroundColor.includes('10, 10, 10')
        );
        return { orange: orange.length > 0, black: black.length > 0 };
      });
      
      console.log(`Brand colors: Orange=${brandColors.orange}, Black=${brandColors.black}`);
      expect(brandColors.orange || brandColors.black).toBe(true);
    });
    
    test('Responsive breakpoints', async ({ page }) => {
      await page.goto(`${BASE_URL}/marca/${BRAND_SLUG}`);
      
      const breakpoints = [320, 375, 768, 1024, 1440];
      const results = [];
      
      for (const width of breakpoints) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(300);
        
        const noOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth <= window.innerWidth + 50;
        });
        results.push({ width, pass: noOverflow });
        console.log(`${width}px: ${noOverflow ? 'PASS' : 'FAIL'}`);
      }
      
      await page.screenshot({ path: './test-reports/screenshots/08_ui_responsive.png', fullPage: true });
      expect(results.every(r => r.pass)).toBe(true);
    });
  });
});
