// playwright.config.js - Minimal config for UX testing
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test-reports/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  reporter: [['list']],
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-375', use: { viewport: { width: 375, height: 667 }, isMobile: true } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 }, isMobile: true } },
  ],
});
