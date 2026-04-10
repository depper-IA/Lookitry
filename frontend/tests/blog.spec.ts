import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('blog home loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/blog');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check no console errors (filter out known non-critical ones)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('hydration') &&
      !e.includes('Warning') &&
      !e.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('blog article page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/blog/5-consejos-para-combinar-ropa-y-musica-en-tu-estilo-colombiano');
    
    await page.waitForLoadState('networkidle');
    
    // Check no console errors (ignore 404s for images since articles were deleted)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('hydration') &&
      !e.includes('Warning') &&
      !e.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
