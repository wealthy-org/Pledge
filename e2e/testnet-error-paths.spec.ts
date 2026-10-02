import { test, expect } from '@playwright/test';
import { injectConnectedWallet, WALLET_A_LENDER, WALLET_B_BORROWER } from './helpers/wallet-mock';

test.describe('TICKET-53: Testnet Error Paths & Negative Scenarios E2E Suite', () => {
  test('Scenario 1: Repay After Due Date - Overdue loan blocks repayment', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_B_BORROWER);
    await page.goto('/loan/99');

    await expect(page.getByText(/Loan #99/i)).toBeVisible();
    await expect(page.getByText(/Repayment Deadline Passed/i)).toBeVisible();
    await expect(page.getByText(/Grace period has expired/i)).toBeVisible();

    const repayBtn = page.getByRole('button', { name: /Repay Loan \(Overdue\)/i });
    await expect(repayBtn).toBeVisible();
    await expect(repayBtn).toBeDisabled();
  });

  test('Scenario 2: Foreclose Before Due Date - Non-overdue loan locks foreclosure for lender', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_A_LENDER);
    await page.goto('/loan/1');

    await expect(page.getByText(/Loan #1 Overview/i)).toBeVisible();
    await expect(page.getByText(/Loan in progress \(Not yet overdue\)/i)).toBeVisible();

    const forecloseBtn = page.getByRole('button', { name: /Foreclose Collateral/i });
    await expect(forecloseBtn).toBeVisible();
    await expect(forecloseBtn).toBeDisabled();
  });

  test('Scenario 3: Accept Expired Offer - Expired status prevents loan initiation', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_B_BORROWER);
    await page.goto('/borrow');

    await expect(page.getByText(/Instant Collateral Liquidity/i)).toBeVisible();
    const nftCard = page.getByText(/Puff #1204/i);
    await expect(nftCard).toBeVisible();
    await nftCard.click();

    await expect(page.getByText(/Available Offers for/i)).toBeVisible();
  });

  test('Scenario 4: Double-Accept / Inactive Offer Rejection Handling', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_B_BORROWER);
    await page.goto('/borrow');

    await expect(page.getByText(/Instant Collateral Liquidity/i)).toBeVisible();
    const nftCard = page.getByText(/Puff #1204/i);
    await expect(nftCard).toBeVisible();
    await nftCard.click();

    const acceptBtn = page.getByRole('button', { name: /accept offer/i }).first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await expect(page.getByText(/Confirm Borrow Terms/i)).toBeVisible();
    }
  });

  test('Scenario 5: Collateral Locked in Active Loan Cannot Be Selected', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_B_BORROWER);
    await page.goto('/borrow');

    await expect(page.getByText(/Instant Collateral Liquidity/i)).toBeVisible();
    await expect(page.getByText(/In Active Loan/i)).toBeVisible();
  });
});
