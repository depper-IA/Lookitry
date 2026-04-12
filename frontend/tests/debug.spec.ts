import { test, expect } from '@playwright/test';

test('Debug widget loading', async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  const allRequests: string[] = [];
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('request', request => {
    const url = request.url();
    if (url.includes('pruebalo') || url.includes('api')) {
      console.log(`[REQUEST] ${request.method()} ${url}`);
      allRequests.push(`${request.method()} ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('pruebalo') || url.includes('api')) {
      console.log(`[RESPONSE ${status}] ${url}`);
    }
    if (status >= 400) {
      console.log(`[FAILED ${status}] ${url}`);
      failedResponses.push(`${url} - ${status}`);
      // Try to get response body
      response.text().then(body => {
        console.log(`[FAILED BODY] ${body.substring(0, 200)}`);
      }).catch(() => {});
    }
  });

  console.log('Navigating to https://lookitry.com/pruebalo/kevida...');
  await page.goto('https://lookitry.com/pruebalo/kevida', { 
    waitUntil: 'commit',
    timeout: 60000 
  });
  
  console.log('Page loaded, waiting for content...');
  
  // Wait for any element that indicates loading or content
  const loadingLocator = page.locator('text=Cargando el probador...');
  const errorLocator = page.locator('text=No encontramos esta tienda');
  const brandLocator = page.locator('text=Kevida');
  
  // Check if loading appears
  console.log('Checking for loading indicator...');
  const loadingVisible = await loadingLocator.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`Loading indicator visible: ${loadingVisible}`);
  
  if (loadingVisible) {
    console.log('Waiting for loading to disappear (max 30s)...');
    try {
      await loadingLocator.waitFor({ state: 'hidden', timeout: 30000 });
      console.log('Loading disappeared!');
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e);
      console.log('Loading never disappeared:', error);
      console.log('Console errors:', consoleErrors);
      console.log('Failed responses:', failedResponses);
      console.log('All relevant requests:', allRequests);
      
      // Take screenshot
      await page.screenshot({ path: 'debug-loading-stuck.png', fullPage: true });
      console.log('Screenshot saved to debug-loading-stuck.png');
      
      // Also check page HTML
      const html = await page.content();
      console.log('Page HTML (first 2000 chars):', html.substring(0, 2000));
      
      throw new Error('Widget stuck on loading');
    }
  }
  
  // Check for error state
  const errorVisible = await errorLocator.isVisible({ timeout: 5000 }).catch(() => false);
  if (errorVisible) {
    console.log('Error state shown:', await errorLocator.textContent());
  }
  
  // Check for brand name
  const brandVisible = await brandLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`Brand name visible: ${brandVisible}`);
  
  if (brandVisible) {
    console.log('Widget loaded successfully!');
  } else {
    console.log('Widget not loaded as expected');
    console.log('Console errors:', consoleErrors);
    console.log('Failed responses:', failedResponses);
    await page.screenshot({ path: 'debug-no-brand.png', fullPage: true });
  }
  
  // Also check window.API_URL if accessible
  const apiUrl = await page.evaluate(() => {
    return (window as any).NEXT_PUBLIC_API_URL || 'not found';
  }).catch(() => 'evaluation failed');
  console.log(`Window NEXT_PUBLIC_API_URL: ${apiUrl}`);
  
  // Additional debug: take screenshot and list elements
  await page.screenshot({ path: 'debug-widget-final.png', fullPage: true });
  console.log('Screenshot saved to debug-widget-final.png');
  
  // List all buttons and their text
  const buttonTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(btn => btn.textContent?.trim())
      .filter(Boolean);
  });
  console.log('Buttons on page:', buttonTexts);
  
  // List all text content with "Kevida"
  const allText = await page.evaluate(() => document.body.innerText);
  if (allText.includes('Kevida')) {
    console.log('Found "Kevida" in page text');
  } else {
    console.log('WARNING: "Kevida" NOT found in page text');
  }
});