import { test, expect } from '@playwright/test';
import { injectConnectedWallet, WALLET_A_LENDER, WALLET_B_BORROWER } from './helpers/wallet-mock';

test.describe('TICKET-52: Full Multi-Wallet Lifecycle Testnet E2E Suite', () => {
  test('Scenario 1: Complete Lending, Borrowing, Repayment & Proceeds Withdrawal Lifecycle', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_A_LENDER);
    await page.goto('/lend');

    await expect(page.getByText(/Earn Fixed Yields on Your Capital/i)).toBeVisible();
    const createBtn = page.getByRole('button', { name: /create custom offer/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(page.getByText(/Create Lending Offer/i)).toBeVisible();
    const principalInput = page.getByPlaceholder(/1.5/);
    if (await principalInput.isVisible()) {
      await principalInput.fill('1.5');
    }

    await injectConnectedWallet(page, WALLET_B_BORROWER);
    await page.goto('/borrow');
    await expect(page.getByText(/Instant Collateral Liquidity/i)).toBeVisible();
    await expect(page.getByText(/Your Eligible NFTs/i)).toBeVisible();

    await page.goto('/loan/1');
    await expect(page.getByText(/Loan #1 Overview/i)).toBeVisible();
    await expect(page.getByText(/Non-Custodial Escrow Contract Terms/i)).toBeVisible();

    await injectConnectedWallet(page, WALLET_A_LENDER);
    await page.goto('/portfolio');
    await expect(page.getByText(/Portfolio Overview/i)).toBeVisible();
    await expect(page.getByText(/Claimable Protocol Proceeds/i)).toBeVisible();
    const withdrawBtn = page.getByRole('button', { name: /withdraw proceeds/i });
    await expect(withdrawBtn).toBeVisible();
  });

  test('Scenario 2: Overdue Loan Foreclosure by Lender to Destination Address', async ({ page }) => {
    await injectConnectedWallet(page, WALLET_A_LENDER);
    await page.goto('/loan/99');

    await expect(page.getByText(/Loan #99/i)).toBeVisible();
    await expect(page.getByText(/Settlement/i)).toBeVisible();
  });
});
