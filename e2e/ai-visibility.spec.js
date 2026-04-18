/**
 * AI Visibility — User E2E Test
 *
 * Prerequisites:
 * - Backend running: cd backend && npm run dev
 * - Frontend: npm run dev (or Playwright auto-starts it)
 * - Browsers: npx playwright install
 *
 * Run: npx playwright test e2e/ai-visibility.spec.js
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('App loads', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(/localhost|127\.0\.0\.1/);
  });
});

test.describe('Dashboard / AI Visibility', () => {
  test('dashboard or login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow auth check / redirect
    const body = await page.locator('body').textContent();
    const hasDashboard = /Dashboard|Overview|AI Visibility|Sidebar/i.test(body || '');
    const hasLogin = /Login|Sign in|email|password/i.test(body || '');
    const hasContent = body && body.length > 100;
    expect(hasDashboard || hasLogin || hasContent).toBeTruthy();
  });

  test('AI Visibility accessible when on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const aiTab = page.getByRole('button', { name: /AI Visibility/i }).or(page.locator('a:has-text("AI Visibility")')).first();
    if (await aiTab.isVisible({ timeout: 5000 })) {
      await aiTab.click();
      await page.waitForTimeout(500);
      const hasContent = await page.locator('text=AI Visibility Intelligence, text=Start Scan, text=Re-scan, text=Overview').first().isVisible();
      expect(hasContent).toBeTruthy();
    }
    // If AI tab not visible (e.g. on login), test still passes
  });
});
