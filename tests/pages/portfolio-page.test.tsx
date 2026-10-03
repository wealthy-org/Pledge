import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import PortfolioPage from '@/app/portfolio/page';
import { ClaimableProceedsBanner } from '@/components/portfolio/ClaimableProceedsBanner';
import { BorrowingTab } from '@/components/portfolio/BorrowingTab';
import { OffersTab } from '@/components/portfolio/OffersTab';
import { LendingTab } from '@/components/portfolio/LendingTab';
import { HistoryTab } from '@/components/portfolio/HistoryTab';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import type { LoanItem, OfferItem } from '@/types/api';

const mockUserAddress = '0xfB5870428d00B1a18274737609825b74c8C12e2B';
const mockLenderAddress = '0x02070747E2436d46f56A691F605A7c03332DFe8d';

const mockLoans: LoanItem[] = [
  {
    loanId: 1,
    offerId: 4,
    chainId: TESTNET_CHAIN_ID,
    lender: mockLenderAddress,
    borrower: mockUserAddress,
    collection: '0x1111111111111111111111111111111111111111',
    tokenId: '42',
    principalWei: '1000000000000000000',
    interestWei: '40000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '2026-10-01T10:00:00Z',
    dueAt: '2026-10-08T10:00:00Z',
    status: 'active',
    blockNumber: 90,
    txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  },
  {
    loanId: 2,
    offerId: 6,
    chainId: TESTNET_CHAIN_ID,
    lender: mockUserAddress,
    borrower: '0x3333333333333333333333333333333333333333',
    collection: '0x2222222222222222222222222222222222222222',
    tokenId: '101',
    principalWei: '500000000000000000',
    interestWei: '15000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '2026-09-10T10:00:00Z',
    dueAt: '2026-09-17T10:00:00Z',
    status: 'repaid',
    blockNumber: 70,
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
  },
];

const mockOffers: OfferItem[] = [
  {
    offerId: 1,
    chainId: TESTNET_CHAIN_ID,
    lender: mockUserAddress,
    collection: '0x1111111111111111111111111111111111111111',
    principalWei: '1500000000000000000',
    termInterestBps: 500,
    feeBpsSnapshot: 200,
    durationSeconds: 604800,
    expiresAt: '2026-10-15T00:00:00Z',
    status: 'open',
    blockNumber: 100,
    txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    createdAt: '2026-10-01T12:00:00Z',
  },
];

let connectedAccount: string | undefined = mockUserAddress;

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: connectedAccount,
    isConnected: Boolean(connectedAccount),
    chainId: 46630,
  }),
  useAccount: () => ({
    address: connectedAccount,
    isConnected: Boolean(connectedAccount),
    chainId: 46630,
  }),
  useBalance: () => ({
    data: {
      value: 2500000000000000000n,
      formatted: '2.50',
      symbol: 'ETH',
      decimals: 18,
    },
    isLoading: false,
  }),
  usePublicClient: () => ({
    simulateContract: vi.fn().mockResolvedValue({ request: {} }),
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
  }),
  useWalletClient: () => ({
    data: {
      writeContract: vi.fn().mockResolvedValue('0x3333333333333333333333333333333333333333333333333333333333333333'),
    },
  }),
}));

vi.mock('@/hooks/api/usePortfolio', () => ({
  usePortfolio: () => ({
    data: {
      claimableWei: '520000000000000000',
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/api/useInvalidateQueries', () => ({
  useInvalidateProtocolQueries: () => ({
    invalidateAll: vi.fn(),
    invalidateOffers: vi.fn(),
    invalidateLoans: vi.fn(),
    invalidatePortfolio: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('TICKET-40: Portfolio Page & Proceeds Claim Suite', () => {
  beforeEach(() => {
    connectedAccount = mockUserAddress;
  });

  describe('TS-01: ClaimableProceedsBanner', () => {
    it('renders claimable balance and enables withdraw button when balance > 0', () => {
      const handleWithdraw = vi.fn();
      render(
        <ClaimableProceedsBanner
          claimableWei="520000000000000000"
          onWithdraw={handleWithdraw}
        />
      );

      expect(screen.getByText('0.52 ETH')).toBeDefined();
      const withdrawBtn = screen.getByRole('button', { name: /withdraw proceeds/i });
      expect(withdrawBtn.hasAttribute('disabled')).toBe(false);

      fireEvent.click(withdrawBtn);
      expect(handleWithdraw).toHaveBeenCalled();
    });

    it('disables withdraw button when claimable balance is zero (TS-03)', () => {
      render(
        <ClaimableProceedsBanner
          claimableWei="0"
          onWithdraw={vi.fn()}
        />
      );

      expect(screen.getByText('0.00 ETH')).toBeDefined();
      const withdrawBtn = screen.getByRole('button', { name: /withdraw proceeds/i });
      expect(withdrawBtn.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('TS-02: Individual Tabs Components', () => {
    it('renders BorrowingTab with active user loans and Repay action', () => {
      render(<BorrowingTab loans={mockLoans} userAddress={mockUserAddress} />);

      expect(screen.getAllByText('#42').length).toBeGreaterThan(0);
      expect(screen.getByText('1.00 ETH')).toBeDefined();
      expect(screen.getByRole('button', { name: /repay/i })).toBeDefined();
    });

    it('renders OffersTab with open offers and Cancel action', () => {
      const handleCancel = vi.fn();
      render(
        <OffersTab
          offers={mockOffers}
          userAddress={mockUserAddress}
          onCancelOffer={handleCancel}
        />
      );

      expect(screen.getByText('1.50 ETH')).toBeDefined();
      const cancelBtn = screen.getByRole('button', { name: /cancel offer/i });
      expect(cancelBtn).toBeDefined();

      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledWith(expect.objectContaining({ offerId: 1 }));
    });

    it('renders LendingTab with loans funded by user', () => {
      render(<LendingTab loans={mockLoans} userAddress={mockLenderAddress} />);

      expect(screen.getAllByText('#42').length).toBeGreaterThan(0);
      expect(screen.getByText('1.00 ETH')).toBeDefined();
    });

    it('renders HistoryTab with completed loans & offers', () => {
      render(
        <HistoryTab
          loans={mockLoans}
          offers={mockOffers}
          userAddress={mockUserAddress}
        />
      );

      expect(screen.getAllByText(/repaid/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TS-03: Integrated Portfolio Page View & Tab Switching', () => {
    it('renders portfolio page with 4 tabs and allows tab switching without page reload', () => {
      render(<PortfolioPage />);

      expect(screen.getByText(/portfolio overview/i)).toBeDefined();
      expect(screen.getByRole('tab', { name: /borrowing/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /offers/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /lending/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /history/i })).toBeDefined();

      const offersTab = screen.getByRole('tab', { name: /offers/i });
      fireEvent.click(offersTab);
      expect(offersTab.getAttribute('aria-selected')).toBe('true');

      const lendingTab = screen.getByRole('tab', { name: /lending/i });
      fireEvent.click(lendingTab);
      expect(lendingTab.getAttribute('aria-selected')).toBe('true');

      const historyTab = screen.getByRole('tab', { name: /history/i });
      fireEvent.click(historyTab);
      expect(historyTab.getAttribute('aria-selected')).toBe('true');
    });
  });
});
