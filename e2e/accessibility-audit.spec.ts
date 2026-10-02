import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/borrow',
  '/lend',
  '/collection/0x7Bd29408F11D2bFC23c34f18275bBf23bB716Bc7',
  '/loan/1',
  '/portfolio',
  '/activity',
];

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  for (const route of ROUTES) {
    test(`route "${route}" passes axe-core WCAG 2.1 AA audit with zero violations`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('skip-to-content link is accessible via keyboard and focuses main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(focused).toBe('#main-content');
  });
});
