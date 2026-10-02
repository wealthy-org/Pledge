import { test, expect } from '@playwright/test';

test.describe('Pledge Protocol E2E Smoke Tests', () => {
  test('renders landing page and displays connect wallet button', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pledge/);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Robinhood Chain');
    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await expect(connectButton).toBeVisible();
  });
});
