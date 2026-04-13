#!/usr/bin/env node
// UX Testing Script - Simplified version
const { chromium } = require('playwright');
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
  
  // Enable request logging for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  ❌ Console error:', msg.text());
  });

  try {
    // ═══════════════════════════════════════════
    // 1. USER TESTING FLOW
    // ═══════════════════════════════════════════
    console.log('\n📋 1. USER TESTING FLOW\n');
    
    // Step 1: Landing Page
    console.log('🔹 Step 1: Landing Page');
    let start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    let loadTime = Date.now() - start;
    console.log('  ⏱️  Load time: ' + loadTime + 'ms');
    await capture(page, '01_landing_desktop');
    
    const landingOk = await page.locator('body').isVisible();
    results.tests.push({ name: 'Landing Page', status: landingOk ? 'PASS' : 'FAIL', loadTime });
    
    // Step 2: Widget (marca)
    console.log('\n🔹 Step 2: Widget /marca/' + BRAND_SLUG);
    start = Date.now();
    await page.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'networkidle' });
    loadTime = Date.now() - start;
    console.log('  ⏱️  Load time: ' + loadTime + 'ms');
    await capture(page, '02_widget_desktop');
    
    // Wait for widget to load
    await page.waitForTimeout(3000);
    
    const widgetOk = await page.evaluate(() => {
      const body = document.body;
      return body && body.innerHTML.length > 1000;
    });
    results.tests.push({ name: 'Widget Page', status: widgetOk ? 'PASS' : 'FAIL', loadTime });
    
    // Check for loader during load
    const hasLoader = await page.locator('.animate-spin').isVisible().catch(() => false);
    console.log('  Initial loader visible: ' + hasLoader);
    
    // Step 3: Checkout
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
      { name: 'mobile375', width: 375, height: 667, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' },
      { name: 'tablet768', width: 768, height: 1024 },
    ];
    
    for (const vp of viewports) {
      console.log('🔹 Viewport: ' + vp.name + ' (' + vp.width + 'x' + vp.height + ')');
      
      const mobileContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: vp.userAgent,
        isMobile: vp.userAgent ? true : false,
      });
      const mobilePage = await mobileContext.newPage();
      
      start = Date.now();
      await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
      loadTime = Date.now() - start;
      console.log('  ⏱️  Load time: ' + loadTime + 'ms');
      await capture(mobilePage, '04_landing_' + vp.name);
      
      // Check for horizontal overflow
      const noOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 10;
      });
      console.log('  No horizontal overflow: ' + noOverflow);
      
      // Test widget on mobile
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
    
    // Reload widget page for UI checks
    await page.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check: Badge de plan visible
    console.log('🔹 Plan Badge:');
    const badgeVisible = await page.locator('[class*="badge"], [class*="plan"], [class*="tag"], [class*="PRO"], [class*="BASIC"]').first().isVisible().catch(() => false);
    console.log('  Badge visible: ' + badgeVisible);
    results.tests.push({ name: 'UI - Plan Badge', status: badgeVisible ? 'PASS' : 'FAIL' });
    await capture(page, '06_ui_badge');
    
    // Check: Loader durante carga
    console.log('\n🔹 IA Generation Loader:');
    // Need to navigate fresh to catch loader
    const freshPage = await context.newPage();
    freshPage.on('load', () => console.log('  Page loaded'));
    await freshPage.goto(BASE_URL + '/marca/' + BRAND_SLUG, { waitUntil: 'load' });
    const loaderVisible = await freshPage.locator('.animate-spin, [class*="spinner"], [class*="loader"]').first().isVisible().catch(() => false);
    console.log('  Loader during load: ' + loaderVisible);
    results.tests.push({ name: 'UI - IA Loader', status: loaderVisible ? 'PASS' : 'FAIL' });
    await freshPage.close();
    
    // Check: Colores de marca
    console.log('\n🔹 Brand Colors (#FF5C3A):');
    const brandColors = await page.evaluate(() => {
      const orangeElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = getComputedStyle(el);
        return style.backgroundColor.includes('255, 92, 58') || style.borderColor.includes('255, 92, 58');
      });
      const blackElements = Array.from(document.querySelectorAll('*')).filter(el => {
        return getComputedStyle(el).backgroundColor.includes('10, 10, 10');
      });
      return {
        orangeFound: orangeElements.length > 0,
        blackFound: blackElements.length > 0
      };
    });
    console.log('  Orange accent (#FF5C3A): ' + brandColors.orangeFound);
    console.log('  Black background (#0a0a0a): ' + brandColors.blackFound);
    results.tests.push({ name: 'UI - Brand Colors', status: brandColors.orangeFound || brandColors.blackFound ? 'PASS' : 'FAIL' });
    
    // Check: Responsive breakpoints
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
    
    // Save report
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
