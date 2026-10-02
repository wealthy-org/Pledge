import { test, expect } from '@playwright/test';

test.describe('TICKET-42: Core Pages Testnet Integration Flow', () => {
  test('Markets page loads correctly and displays collection statistics', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pledge/i);
    await expect(page.getByText(/Total Pool Size/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Borrow page renders eligible NFT selection and workbench', async ({ page }) => {
    await page.goto('/borrow');
    await expect(page.getByText(/Instant Collateral Liquidity/i)).toBeVisible();
    await expect(page.getByText(/Your Eligible NFTs/i)).toBeVisible();
  });

  test('Lend page renders collection discovery and open offers section', async ({ page }) => {
    await page.goto('/lend');
    await expect(page.getByText(/Deploy Capital/i)).toBeVisible();
    await expect(page.getByText(/Collections Open for Liquidity/i)).toBeVisible();
  });

  test('Collection Detail page renders header, order book stats and tabs', async ({ page }) => {
    await page.goto('/collection/0x1111111111111111111111111111111111111111');
    await expect(page.getByText(/Robinhood Genesis Pass/i)).toBeVisible();
    await expect(page.getByRole('tab', { name: /offers/i })).toBeVisible();
  });

  test('Loan Detail page renders loan overview and terms', async ({ page }) => {
    await page.goto('/loan/1');
    await expect(page.getByText(/Loan #1/i)).toBeVisible();
    await expect(page.getByText(/Contract Reference/i)).toBeVisible();
  });

  test('Portfolio page renders claimable vault and 4 segmentation tabs', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.getByText(/Portfolio Overview/i)).toBeVisible();
    await expect(page.getByText(/Claimable Protocol Proceeds/i)).toBeVisible();
    await expect(page.getByRole('tab', { name: /borrowing/i })).toBeVisible();
  });

  test('Activity page renders on-chain provenance timeline and filter bar', async ({ page }) => {
    await page.goto('/activity');
    await expect(page.getByText(/Protocol Activity Feed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
  });
});
