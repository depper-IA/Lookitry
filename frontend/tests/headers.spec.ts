import { test, expect } from '@playwright/test';

test('Check CSP headers', async ({ page }) => {
  const response = await page.goto('https://lookitry.com/pruebalo/kevida');
  const headers = response?.headers();
  console.log('All headers:', headers);
  
  const cspHeader = headers?.['content-security-policy'] || headers?.['Content-Security-Policy'];
  console.log('CSP header:', cspHeader);
  
  // Also check for multiple CSP headers
  const allHeaders = Object.entries(headers || {});
  allHeaders.forEach(([key, value]) => {
    if (key.toLowerCase().includes('security')) {
      console.log(`Security header: ${key}=${value}`);
    }
  });
});