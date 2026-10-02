import { test, expect } from '@playwright/test';

test.describe('TICKET-30: Responsive Layout Viewport Tests', () => {
  test('renders desktop layout with 3-panel components on 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const sidebar = page.locator('aside[aria-label="Sidebar Navigation"]');
    await expect(sidebar).toBeVisible();

    const activityFeed = page.locator('aside[aria-label="Activity Feed"]');
    await expect(activityFeed).toBeVisible();

    const mobileNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await expect(mobileNav).toBeHidden();
  });

  test('renders mobile bottom navigation bar on 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const sidebar = page.locator('aside[aria-label="Sidebar Navigation"]');
    await expect(sidebar).toBeHidden();

    const mobileNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await expect(mobileNav).toBeVisible();
  });
});
