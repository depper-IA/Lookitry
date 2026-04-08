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
    
    // Check brand name appears somewhere (there are multiple)
    await expect(page.locator('text=Kevida').first()).toBeVisible({ timeout: 10000 });
    
    // Check products are displayed
    await expect(page.locator('text=Uña')).toBeVisible({ timeout: 5000 });
    
    // Assert no console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should handle non-existent brand gracefully', async ({ page }) => {
    await page.goto('https://lookitry.com/pruebalo/non-existent-brand-12345', { waitUntil: 'networkidle' });
    
    // Should show error message (the widget shows a specific error)
    await expect(page.locator('text=No encontramos esta tienda')).toBeVisible({ timeout: 10000 });
  });

  test('complete flow with mocked generation', async ({ page }) => {
    // Intercept the generation API call
    await page.route('**/api/pruebalo/kevida/generate', async route => {
      // Simulate a successful generation response
      const mockResponse = {
        imageUrl: 'https://minio.wilkiedevs.com/images/generations/test-mock.jpg',
        generationId: 'mock-generation-id',
        processingTime: 5000,
        reused: false
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });

    await page.goto('https://lookitry.com/pruebalo/kevida', { waitUntil: 'networkidle' });
    
    // Wait for loading to finish
    await expect(page.locator('text=Cargando el probador...')).not.toBeVisible({ timeout: 15000 });
    
    // Step 1: Upload a selfie (mock file)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-selfie.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Wait for image editor to appear (or step to change)
    // Depending on the flow, the widget might go directly to select step
    await expect(page.locator('text=Elige un producto')).toBeVisible({ timeout: 10000 });
    
    // Step 2: Select a product (click on first product)
    const firstProduct = page.locator('button:has-text("Uña")').first();
    await firstProduct.click();
    
    // Step 3: Click generate button
    const generateButton = page.locator('button:has-text("Probarme esto")').first();
    await generateButton.click();
    
    // Wait for generating step (text "Generando...") then result
    await expect(page.locator('text=Resultado listo')).toBeVisible({ timeout: 10000 });
    
    // Verify result image appears
    await expect(page.locator('img[src*="test-mock.jpg"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle generation error gracefully', async ({ page }) => {
    // Intercept API call to simulate error
    await page.route('**/api/pruebalo/kevida/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' })
      });
    });

    await page.goto('https://lookitry.com/pruebalo/kevida', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Cargando el probador...')).not.toBeVisible({ timeout: 15000 });
    
    // Upload mock file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-selfie.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    await expect(page.locator('text=Elige un producto')).toBeVisible({ timeout: 10000 });
    
    // Select product
    await page.locator('button:has-text("Uña")').first().click();
    
    // Click generate
    await page.locator('button:has-text("Probarme esto")').first().click();
    
    // Should show error message
    await expect(page.locator('text=Algo salió mal')).toBeVisible({ timeout: 10000 });
  });
});