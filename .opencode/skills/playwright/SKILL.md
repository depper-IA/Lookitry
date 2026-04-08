---
name: playwright
description: "Playwright end-to-end testing and browser automation for Lookitry. Use when testing UI components, automating web interactions, verifying frontend functionality, running smoke tests, or taking screenshots for visual regression. Make sure to use this skill whenever the user mentions testing, test, e2e, playwright, browser automation, screenshot testing, or visual verification for Lookitry's frontend or dashboard. Essential for verifying UI changes before deployment and running integration tests on flows like login, checkout, try-on widget, or any user interaction."
---

# Playwright - End-to-End Testing and Browser Automation

Playwright is a globally installed npm package (`@playwright/test`) that enables reliable browser testing.

## When to Use This Skill

Use Playwright when:
- **Testing UI components** — Verify buttons, forms, modals, navbar, dropdowns work correctly
- **End-to-end testing** — Test complete user flows (login, checkout, try-on widget)
- **Browser automation** — Automate repetitive web interactions
- **Visual verification** — Take screenshots to verify UI renders correctly
- **API testing** — Test REST/GraphQL endpoints with browser context
- **Accessibility testing** — Run a11y audits on rendered pages
- **Smoke tests** — Quick verification that pages load without errors
- **Regression testing** — Verify UI hasn't changed after code modifications

## Quick Start

### Verify Installation
```bash
npx playwright --version
# Expected: Version 1.59.1 or higher
```

### Run a Simple Test
```bash
cd frontend
npx playwright test
```

### Take a Screenshot
```bash
npx playwright screenshot http://localhost:3000 screenshot.png
```

## Test Patterns

### Basic Component Test
```typescript
import { test, expect } from '@playwright/test';

test('navbar renders and mega menu works', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Verify navbar elements
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('text=Productos Pro')).toBeVisible();
  
  // Hover to open mega menu
  await page.hover('text=Productos Pro');
  await expect(page.locator('text=Mini-Landing Pro')).toBeVisible();
});
```

### Login Flow Test
```typescript
test('login flow works end-to-end', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('text=Bienvenido')).toBeVisible();
});
```

### Widget Try-On Test
```typescript
test('try-on widget generates result', async ({ page }) => {
  await page.goto('http://localhost:3000/pruebalo/test-brand');
  
  // Upload selfie
  const selfie = page.locator('input[type="file"]');
  await selfie.setInputFiles('test-selfie.jpg');
  
  // Select product
  await page.click('text=Select Product');
  await page.click('text=Example Product');
  
  // Generate
  await page.click('text=Try On');
  
  // Wait for result (polling)
  await expect(page.locator('.result-image')).toBeVisible({ timeout: 60000 });
});
```

### Element Interactions
```typescript
// Click
await page.click('button#submit');

// Fill input
await page.fill('input[name="email"]', 'test@example.com');

// Select dropdown
await page.selectOption('select#country', 'CO');

// Hover (opens dropdowns, tooltips)
await page.hover('.dropdown-trigger');

// Drag and drop
await page.dragAndDrop('.source', '.target');
```

### Assertions
```typescript
// Visibility
await expect(page.locator('.success-message')).toBeVisible();

// Content
await expect(page.locator('h1')).toHaveText('Welcome');

// URL
await expect(page).toHaveURL(/\/dashboard/);

// Contain text
await expect(page.locator('.error')).toContainText('Invalid email');

// Network response
await expect(page.locator('.status')).toHaveText('Success', { timeout: 10000 });
```

### Network Interceptions
```typescript
await page.route('**/api/**', route => {
  // Mock API response
  route.fulfill({ 
    body: JSON.stringify({ success: true, data: {} }) 
  });
});
```

## Debugging

### Run Tests with Browser Visible
```bash
npx playwright test --headed
```

### Slow Motion (see animations)
```bash
npx playwright test --slowmo=1000
```

### Debug with Inspector
```bash
npx playwright test --debug
```

### View Trace on Failure
```bash
npx playwright show-trace trace.zip
```

## Lookitry-Specific Commands

### Start Dev Server for Testing
```bash
cd frontend
npm run dev
# Wait for "Ready" message
```

### Run All Tests
```bash
cd frontend
npx playwright test
```

### Run Specific Test File
```bash
cd frontend
npx playwright test tests/navbar.spec.ts
```

### Run Tests Matching Pattern
```bash
cd frontend
npx playwright test --grep "mega menu"
```

### Generate Test Report
```bash
cd frontend
npx playwright test --reporter=html
# Opens HTML report
```

## Environment

| Component | URL/Value |
|-----------|-----------|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| Playwright Version | 1.59.1 |
| Chromium | Installed and ready |
| Project Root | frontend/ |

## Common Test Cases for Lookitry

1. **Navbar mega menu opens on hover**
2. **Login form validates email format**
3. **Checkout flow completes successfully**
4. **Widget uploads selfie and generates result**
5. **Dashboard loads with user data**
6. **Products list displays correctly**
7. **Mobile menu opens and closes**

## Notes

- Playwright is globally installed, no need to install per-project
- Chromium browser is configured and ready
- All Lookitry agents have access via `npx playwright`
- Tests can be run from any directory using the global installation
- Use `{ timeout: 10000 }` for async operations that may take time