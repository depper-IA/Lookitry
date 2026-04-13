// Debug test to capture actual page content
const { test, expect } = require('@playwright/test');

test('Debug widget content', async ({ page }) => {
  await page.goto('http://localhost:3000/marca/demo');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const content = await page.evaluate(() => {
    const body = document.body;
    return {
      bodyLength: body.innerHTML.length,
      bodyText: body.innerText.substring(0, 1000),
      bodyClasses: body.className,
      hasTryOn: body.innerHTML.includes('tryon') || body.innerHTML.includes('TryOn'),
      hasProducts: body.innerHTML.includes('product') || body.innerHTML.includes('Product'),
      hasUpload: body.innerHTML.includes('upload') || body.innerHTML.includes('upload'),
      firstElements: Array.from(body.querySelectorAll('*')).slice(0, 20).map(el => ({
        tag: el.tagName,
        class: String(el.className || '').substring(0, 50),
        text: String(el.innerText || '').substring(0, 30)
      }))
    };
  });
  
  console.log('Body HTML length:', content.bodyLength);
  console.log('Has TryOn components:', content.hasTryOn);
  console.log('Has Product components:', content.hasProducts);
  console.log('Has Upload components:', content.hasUpload);
  console.log('First elements:', JSON.stringify(content.firstElements, null, 2));
  
  await page.screenshot({ path: './test-reports/screenshots/debug_widget.png', fullPage: true });
  expect(content.bodyLength).toBeGreaterThan(100);
});
