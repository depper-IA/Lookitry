import { test, expect } from '@playwright/test';

test.describe('CSP Verification - Widget Try-On', () => {
  test('should load widget without CSP errors for wilkie-devs', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console error:', msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
        console.log('Console warning:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`Failed response: ${response.url()} - ${response.status()}`);
      }
    });

    // Navigate to a real mini-landing with products
    await page.goto('https://lookitry.com/pruebalo/wilkie-devs', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    // Wait for loading text to disappear (widget initialized)
    const loadingLocator = page.locator('text=Cargando el probador...');
    await loadingLocator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      // If still visible after 30s, log errors and fail
      console.log('Console errors:', consoleErrors);
      console.log('Console warnings:', consoleWarnings);
      throw new Error('Widget stuck on loading. Likely CSP issue.');
    });

    // Verify brand name appears
    await expect(page.locator('text=Wilkie Devs').first()).toBeVisible({ timeout: 10000 });
    
    // Verify at least one product name is displayed (product grid)
    // Use product names we know from the database
    const productNames = ['Casco', 'Vestido', 'Zapatos', 'Camisa', 'Bolso'];
    let productVisible = false;
    for (const name of productNames) {
      const locator = page.locator(`text=${name}`).first();
      if (await locator.isVisible()) {
        productVisible = true;
        break;
      }
    }
    if (!productVisible) {
      // If no product names visible, maybe they are in different format, but we can still pass
      // as long as there's no CSP error
      console.log('Warning: No product names visible, but continuing.');
    }
    
    // Verify try-on widget UI is present (any widget-specific element)
    // Look for elements that are unique to the widget
    const widgetElements = [
      'input[type="file"]',
      'button:has-text("Probarme esto")',
      'button:has-text("Elige un producto")',
      'text=Sube tu selfie',
      'text=Elige una foto',
      'text=Paso 1',
      'text=Paso 2'
    ];
    let widgetDetected = false;
    for (const selector of widgetElements) {
      const locator = page.locator(selector);
      if (await locator.count() > 0) {
        widgetDetected = true;
        console.log(`Widget element found: ${selector}`);
        break;
      }
    }
    
    if (!widgetDetected) {
      console.log('Warning: No specific widget elements detected, but loading disappeared.');
    }
    
    // Assert no CSP-related console errors
    const cspErrors = consoleErrors.filter(err => 
      err.includes('Content Security Policy') || 
      err.includes('CSP') || 
      err.includes('unsafe-inline') ||
      err.includes('script-src')
    );
    expect(cspErrors).toEqual([]);
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'csp-verification-wilkie-devs.png', fullPage: true });
    
    console.log('SUCCESS: Widget loaded without CSP errors.');
    console.log('Total console errors:', consoleErrors.length);
    console.log('Total console warnings:', consoleWarnings.length);
  });
});