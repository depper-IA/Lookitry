const { chromium } = require('playwright');

async function analyzeLayout(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const metrics = await page.evaluate(() => ({
    viewport: { w: window.innerWidth, h: window.innerHeight },
    body: { w: document.body.scrollWidth, h: document.body.scrollHeight }
  }));

  console.log(`\n=== ${viewport.width}x${viewport.height} ===`);
  console.log(`Viewport: ${metrics.viewport.w}x${metrics.viewport.h}`);
  console.log(`Body: ${metrics.body.w}x${metrics.body.h}`);
  console.log(`No scroll: ${metrics.body.w === metrics.viewport.w && metrics.body.h === metrics.viewport.h}`);

  // Get panels
  const leftPanel = await page.$('.hidden.lg\\:flex > div:first-child');
  const rightPanel = await page.$('.hidden.lg\\:flex > div:last-child');

  if (leftPanel) {
    const leftBox = await leftPanel.boundingBox();
    console.log(`Left panel: ${Math.round(leftBox.width)}px`);
  }
  if (rightPanel) {
    const rightBox = await rightPanel.boundingBox();
    console.log(`Right panel: ${Math.round(rightBox.width)}px`);
  }

  // Check form
  const formCard = await page.$('.min-h-screen.flex.items-center.justify-center > div');
  if (formCard) {
    const cardBox = await formCard.boundingBox();
    console.log(`Form card: ${Math.round(cardBox.width)}px`);
  }

  // Verify fit
  const allFit = metrics.body.w <= metrics.viewport.w && metrics.body.h <= metrics.viewport.h;
  console.log(`FIT IN VIEWPORT: ${allFit ? 'YES' : 'NO'}`);

  return allFit;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');

  const results = [];
  results.push(await analyzeLayout(page, { width: 1366, height: 768 }));
  results.push(await analyzeLayout(page, { width: 1440, height: 900 }));

  await browser.close();

  console.log('\n=== FINAL RESULT ===');
  console.log(`All viewports fit: ${results.every(r => r) ? 'PASS' : 'FAIL'}`);
  process.exit(results.every(r => r) ? 0 : 1);
})();
