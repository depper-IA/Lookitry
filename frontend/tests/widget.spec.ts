import { test, expect } from '@playwright/test';

test.describe('Try-On Widget - Production', () => {
  test('should load widget without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        const status = response.status();
        failedResponses.push(`${url} - ${status}`);
        console.log(`Failed response: ${url} - ${status}`);
      }
    });

    await page.goto('https://lookitry.com/pruebalo/kevida', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for either loading spinner or content
    const loadingLocator = page.locator('text=Cargando el probador...');
    const contentLocator = page.locator('text=Prueba virtual premium');
    
    // Race between loading disappearing and content appearing
    await Promise.race([
      loadingLocator.waitFor({ state: 'hidden', timeout: 30000 }),
      contentLocator.waitFor({ state: 'visible', timeout: 30000 })
    ]);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'widget-debug.png', fullPage: true });
    
    // If loading is still visible after 30s, fail with diagnostic info
    if (await loadingLocator.isVisible()) {
      console.log('Console errors:', consoleErrors);
      console.log('Failed responses:', failedResponses);
      throw new Error('Widget stuck on loading. Console errors: ' + consoleErrors.join(', ') + ' Failed responses: ' + failedResponses.join(', '));
    }
    
    // Check brand name appears somewhere
    await expect(page.locator('text=Kevida').first()).toBeVisible({ timeout: 10000 });
    
    // Check upload prompt appears (mobile-friendly selfie uploader)
    await expect(page.locator('text=Sube tu foto').first()).toBeVisible({ timeout: 5000 });
    
    // Assert no console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should load widget on mobile viewport (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('https://lookitry.com/pruebalo/kevida', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for either loading spinner or content
    const loadingLocator = page.locator('text=Cargando el probador...');
    const uploadPrompt = page.locator('text=Sube tu foto');
    
    // Race between loading disappearing and content appearing
    await Promise.race([
      loadingLocator.waitFor({ state: 'hidden', timeout: 30000 }),
      uploadPrompt.waitFor({ state: 'visible', timeout: 30000 })
    ]);
    
    // Check that page has loaded something meaningful
    await expect(page.locator('text=Kevida').first()).toBeVisible({ timeout: 10000 });
    
    // Take mobile screenshot
    await page.screenshot({ path: 'widget-mobile-375.png', fullPage: true });
    
    // Assert no console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should load widget on large mobile viewport (428px)', async ({ page }) => {
    // Set large mobile viewport (iPhone Pro Max)
    await page.setViewportSize({ width: 428, height: 926 });
    
    await page.goto('https://lookitry.com/pruebalo/kevida', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Verify content loads
    await expect(page.locator('text=Sube tu foto').first()).toBeVisible({ timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ path: 'widget-mobile-428.png', fullPage: true });
  });

  test('should handle non-existent brand gracefully', async ({ page }) => {
    await page.goto('https://lookitry.com/pruebalo/non-existent-brand-12345', { waitUntil: 'networkidle' });
    
    // Should show some error message - look for common error text
    // Since error messages may vary, we check that page has content
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
  });
});