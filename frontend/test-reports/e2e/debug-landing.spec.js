// Debug landing page
const { test, expect } = require('@playwright/test');

test('Debug landing page content', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const content = await page.evaluate(() => {
    return {
      bodyLength: document.body.innerHTML.length,
      hasHero: document.body.innerHTML.includes('hero') || document.body.innerHTML.includes('Hero'),
      hasCTA: document.body.innerHTML.includes('Probar') || document.body.innerHTML.includes('Comenzar'),
      hasNav: document.body.innerHTML.includes('nav') || document.querySelector('nav') !== null,
    };
  });
  
  console.log('Landing body length:', content.bodyLength);
  console.log('Has Hero:', content.hasHero);
  console.log('Has CTA buttons:', content.hasCTA);
  console.log('Has Nav:', content.hasNav);
  
  await page.screenshot({ path: './test-reports/screenshots/debug_landing.png', fullPage: true });
  expect(content.bodyLength).toBeGreaterThan(1000);
});
