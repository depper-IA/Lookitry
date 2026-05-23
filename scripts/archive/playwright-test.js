const { chromium } = require('/home/travis/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const BRAND_SLUG = 'demo';
const results = { tests: [], screenshots: [], errors: [] };

async function capture(page, name) {
  const dir = './test-reports/screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const path = `${dir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log('  📸 ' + path);
  results.screenshots.push(path);
  return path;
}

async function runTests() {
  console.log('\n🎯 UX Testing para Lookitry Widget\n' + '='.repeat(50));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  ❌ Console error:', msg.text());
  });

  try {
    // ═══════════════════════════════════════════
    // 1. USER TESTING FLOW
    // ═══════════════════════════════════════════
    console.log('\n📋 1. USER TESTING FLOW\n');
    
    console.log('🔹 Step 1: Landing Page');
    let start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    let loadTime = Date.now() - start;
    console.log('  ⏱️  Load time: ' + loadTime + 'ms');
    await capture(page, '01_landing_desktop');
    
    const landingOk = await page.locator('body').isVisible();
    results.tests.push({ name: 'Landing Page', status: landingOk ? 'PASS' : 'FAIL', loadTime });
    
    console.log('\n🔹 Step 2: Widget /marca/' + BRAND_SLUG);
    start = Date.now();
    await page.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'networkidle' });
    loadTime = Date.now() - start;
    console.log('  ⏱️  Load time: ' + loadTime + 'ms');
    await capture(page, '02_widget_desktop');
    
    await page.waitForTimeout(3000);
    
    const widgetOk = await page.evaluate(() => {
      return document.body && document.body.innerHTML.length > 1000;
    });
    results.tests.push({ name: 'Widget Page', status: widgetOk ? 'PASS' : 'FAIL', loadTime });
    
    const hasLoader = await page.locator('.animate-spin').isVisible().catch(() => false);
    console.log('  Initial loader visible: ' + hasLoader);
    
    console.log('\n🔹 Step 3: Checkout Page');
    start = Date.now();
    await page.goto(BASE_URL + '/checkout', { waitUntil: 'networkidle' });
    loadTime = Date.now() - start;
    console.log('  ⏱️  Load time: ' + loadTime + 'ms');
    await capture(page, '03_checkout_desktop');
    
    const checkoutOk = await page.locator('body').isVisible();
    results.tests.push({ name: 'Checkout Page', status: checkoutOk ? 'PASS' : 'FAIL', loadTime });

    // ═══════════════════════════════════════════
    // 2. MOBILE TESTING
    // ═══════════════════════════════════════════
    console.log('\n📱 2. MOBILE TESTING\n');
    
    const viewports = [
      { name: 'mobile375', width: 375, height: 667 },
      { name: 'tablet768', width: 768, height: 1024 },
    ];
    
    for (const vp of viewports) {
      console.log('🔹 Viewport: ' + vp.name + ' (' + vp.width + 'x' + vp.height + ')');
      
      const mobileContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const mobilePage = await mobileContext.newPage();
      
      start = Date.now();
      await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
      loadTime = Date.now() - start;
      console.log('  ⏱️  Load time: ' + loadTime + 'ms');
      await capture(mobilePage, '04_landing_' + vp.name);
      
      const noOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 10;
      });
      console.log('  No horizontal overflow: ' + noOverflow);
      
      await mobilePage.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(2000);
      await capture(mobilePage, '05_widget_' + vp.name);
      
      results.tests.push({ 
        name: 'Mobile ' + vp.name, 
        status: noOverflow ? 'PASS' : 'FAIL', 
        loadTime,
        viewport: vp.name 
      });
      
      await mobileContext.close();
    }

    // ═══════════════════════════════════════════
    // 3. UI CHECKLIST
    // ═══════════════════════════════════════════
    console.log('\n✅ 3. UI CHECKLIST\n');
    
    await page.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('🔹 Plan Badge:');
    const badgeVisible = await page.locator('[class*="badge"], [class*="plan"], [class*="tag"]').first().isVisible().catch(() => false);
    console.log('  Badge visible: ' + badgeVisible);
    results.tests.push({ name: 'UI - Plan Badge', status: badgeVisible ? 'PASS' : 'FAIL' });
    await capture(page, '06_ui_badge');
    
    console.log('\n🔹 IA Generation Loader:');
    const freshPage = await context.newPage();
    await freshPage.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'load' });
    const loaderVisible = await freshPage.locator('.animate-spin, [class*="spinner"], [class*="loader"]').first().isVisible().catch(() => false);
    console.log('  Loader during load: ' + loaderVisible);
    results.tests.push({ name: 'UI - IA Loader', status: loaderVisible ? 'PASS' : 'FAIL' });
    await freshPage.close();
    
    console.log('\n🔹 Brand Colors (#FF5C3A):');
    const brandColors = await page.evaluate(() => {
      const orangeElements = Array.from(document.querySelectorAll('*')).filter(el => {
        return getComputedStyle(el).backgroundColor.includes('255, 92, 58');
      });
      const blackElements = Array.from(document.querySelectorAll('*')).filter(el => {
        return getComputedStyle(el).backgroundColor.includes('10, 10, 10');
      });
      return { orangeFound: orangeElements.length > 0, blackFound: blackElements.length > 0 };
    });
    console.log('  Orange accent: ' + brandColors.orangeFound);
    console.log('  Black background: ' + brandColors.blackFound);
    results.tests.push({ name: 'UI - Brand Colors', status: brandColors.orangeFound || brandColors.blackFound ? 'PASS' : 'FAIL' });
    
    console.log('\n🔹 Responsive Breakpoints:');
    const breakpoints = [
      { name: '320px', width: 320, height: 568 },
      { name: '375px', width: 375, height: 667 },
      { name: '768px', width: 768, height: 1024 },
      { name: '1024px', width: 1024, height: 768 },
      { name: '1440px', width: 1440, height: 900 },
    ];
    
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(300);
      const noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 50;
      });
      console.log('  ' + bp.name + ': ' + (noOverflow ? '✅' : '❌'));
      results.tests.push({ name: 'UI - Responsive ' + bp.name, status: noOverflow ? 'PASS' : 'FAIL' });
    }
    await capture(page, '07_ui_responsive');
    
    // ═══════════════════════════════════════════
    // GENERATE REPORT
    // ═══════════════════════════════════════════
    console.log('\n' + '='.repeat(50));
    console.log('📊 REPORTE FINAL\n');
    console.log('='.repeat(50));
    
    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    
    console.log('\n✅ PASSED: ' + passed);
    console.log('❌ FAILED: ' + failed);
    console.log('\nTests detail:');
    results.tests.forEach(t => {
      console.log('  ' + (t.status === 'PASS' ? '✅' : '❌') + ' ' + t.name + (t.loadTime ? ' (' + t.loadTime + 'ms)' : ''));
    });
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      results.errors.forEach(e => console.log('  • ' + e));
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, total: results.tests.length },
      tests: results.tests,
      screenshots: results.screenshots,
      errors: results.errors,
    };
    
    if (!fs.existsSync('./test-reports')) fs.mkdirSync('./test-reports', { recursive: true });
    fs.writeFileSync('./test-reports/ux-testing-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report: ./test-reports/ux-testing-report.json');
    
    const overall = failed === 0 ? '✅ PASS' : '⚠️ NEEDS ATTENTION';
    console.log('\n' + '='.repeat(50));
    console.log('🏆 OVERALL: ' + overall);
    console.log('='.repeat(50));
    
    await browser.close();
    return failed === 0;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    results.errors.push(error.message);
    await browser.close();
    return false;
  }
}

runTests().then(success => process.exit(success ? 0 : 1));
