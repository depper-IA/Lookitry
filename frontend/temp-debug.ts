import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  
  await page.goto('https://lookitry.com/pruebalo/kevida', { waitUntil: 'domcontentloaded' });
  
  // Wait for 5 seconds to let page load
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-widget.png', fullPage: true });
  
  // Get all visible text
  const visibleText = await page.evaluate(() => {
    return Array.from(document.body.querySelectorAll('*'))
      .filter(el => el.children.length === 0 && el.textContent?.trim())
      .map(el => el.textContent?.trim())
      .filter(Boolean)
      .slice(0, 20);
  });
  
  console.log('Visible text snippets:', visibleText);
  
  // Check for specific elements
  const hasKevida = await page.evaluate(() => {
    return document.body.innerText.includes('Kevida');
  });
  console.log('Contains "Kevida":', hasKevida);
  
  // Get widget container
  const widgetHtml = await page.evaluate(() => {
    const widget = document.querySelector('[data-testid="tryon-widget"]') || 
                   document.querySelector('.tryon-widget') ||
                   document.body;
    return widget.outerHTML.substring(0, 2000);
  });
  
  console.log('Widget HTML (first 2000 chars):', widgetHtml);
  
  await browser.close();
})();