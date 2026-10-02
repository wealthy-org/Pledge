import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import LoanDetailPage from '@/app/loan/[id]/page';
import { LoanCountdown } from '@/components/loan/LoanCountdown';
import { LoanTermsCard } from '@/components/loan/LoanTermsCard';
import { LoanActionButtons } from '@/components/loan/LoanActionButtons';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import type { LoanItem } from '@/types/api';

const mockBorrower = '0xfB5870428d00B1a18274737609825b74c8C12e2B';
const mockLender = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
const mockThirdParty = '0x1234567890123456789012345678901234567890';

const mockActiveLoan: LoanItem = {
  loanId: 1,
  offerId: 4,
  chainId: TESTNET_CHAIN_ID,
  lender: mockLender,
  borrower: mockBorrower,
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
};

const mockOverdueLoan: LoanItem = {
  ...mockActiveLoan,
  loanId: 99,
  dueAt: '2026-09-01T10:00:00Z',
};

let currentConnectedAddress: string | undefined = mockBorrower;

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: currentConnectedAddress,
    isConnected: Boolean(currentConnectedAddress),
    chainId: 46630,
  }),
  usePublicClient: () => ({
    simulateContract: vi.fn().mockResolvedValue({ request: {} }),
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
    getBalance: vi.fn().mockResolvedValue(10000000000000000000n),
  }),
  useWalletClient: () => ({
    data: {
      writeContract: vi.fn().mockResolvedValue('0x7777777777777777777777777777777777777777777777777777777777777777'),
    },
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

describe('TICKET-39: Loan Detail Page & Components', () => {
  beforeEach(() => {
    currentConnectedAddress = mockBorrower;
  });

  describe('TS-01: LoanTermsCard & Collateral Display', () => {
    it('renders collateral details, financial terms breakdown, and address links', () => {
      render(
        <LoanTermsCard
          loan={mockActiveLoan}
          collectionName="Robinhood Genesis Pass"
          imageUrl="https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
        />
      );

      expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
      expect(screen.getByText(/#42/i)).toBeDefined();
      expect(screen.getByText('1.00 ETH')).toBeDefined();
      expect(screen.getByText('0.04 ETH')).toBeDefined();
      expect(screen.getByText('1.04 ETH')).toBeDefined();
      expect(screen.getByText(/0xfB58\.\.\.2e2B/i)).toBeDefined();
      expect(screen.getByText(/0x0207\.\.\.Fe8d/i)).toBeDefined();

      const txLink = screen.getByRole('link', { name: /view on blockscout/i });
      expect(txLink).toBeDefined();
      expect(txLink.getAttribute('href')).toContain(mockActiveLoan.txHash);
    });
  });

  describe('TS-02: LoanCountdown Component', () => {
    it('renders countdown timer for active loan before deadline', () => {
      render(
        <LoanCountdown
          dueAt="2026-10-08T10:00:00Z"
          status="active"
          currentTime="2026-10-02T10:00:00Z"
        />
      );

      expect(screen.getByText(/time remaining/i)).toBeDefined();
      expect(screen.getByText(/6d/i)).toBeDefined();
    });

    it('displays OVERDUE status when current time has surpassed dueAt', () => {
      render(
        <LoanCountdown
          dueAt="2026-09-01T10:00:00Z"
          status="active"
          currentTime="2026-10-02T10:00:00Z"
        />
      );

      expect(screen.getByText(/overdue/i)).toBeDefined();
    });

    it('displays final status message without countdown when loan is resolved', () => {
      render(
        <LoanCountdown
          dueAt="2026-09-01T10:00:00Z"
          status="repaid"
          currentTime="2026-10-02T10:00:00Z"
        />
      );

      expect(screen.getByText(/loan repaid/i)).toBeDefined();
    });
  });

  describe('TS-03 & TS-04: LoanActionButtons Role-Based Authorization', () => {
    it('enables Repay Loan button for borrower before due date', () => {
      const handleRepay = vi.fn();
      const handleForeclose = vi.fn();

      render(
        <LoanActionButtons
          loan={mockActiveLoan}
          userAddress={mockBorrower}
          isOverdue={false}
          onRepay={handleRepay}
          onForeclose={handleForeclose}
        />
      );

      const repayBtn = screen.getByRole('button', { name: /repay loan/i });
      expect(repayBtn).toBeDefined();
      expect(repayBtn.hasAttribute('disabled')).toBe(false);

      fireEvent.click(repayBtn);
      expect(handleRepay).toHaveBeenCalled();
    });

    it('disables Repay button for borrower if loan is overdue', () => {
      render(
        <LoanActionButtons
          loan={mockOverdueLoan}
          userAddress={mockBorrower}
          isOverdue={true}
          onRepay={vi.fn()}
          onForeclose={vi.fn()}
        />
      );

      const repayBtn = screen.queryByRole('button', { name: /repay loan/i });
      if (repayBtn) {
        expect(repayBtn.hasAttribute('disabled')).toBe(true);
      } else {
        expect(screen.getByText(/overdue/i)).toBeDefined();
      }
    });

    it('enables Foreclose Collateral button for lender when loan is overdue', () => {
      const handleForeclose = vi.fn();

      render(
        <LoanActionButtons
          loan={mockOverdueLoan}
          userAddress={mockLender}
          isOverdue={true}
          onRepay={vi.fn()}
          onForeclose={handleForeclose}
        />
      );

      const forecloseBtn = screen.getByRole('button', { name: /foreclose collateral/i });
      expect(forecloseBtn).toBeDefined();
      expect(forecloseBtn.hasAttribute('disabled')).toBe(false);

      fireEvent.click(forecloseBtn);
      expect(handleForeclose).toHaveBeenCalled();
    });

    it('disables Foreclose button for lender before due date', () => {
      render(
        <LoanActionButtons
          loan={mockActiveLoan}
          userAddress={mockLender}
          isOverdue={false}
          onRepay={vi.fn()}
          onForeclose={vi.fn()}
        />
      );

      const forecloseBtn = screen.queryByRole('button', { name: /foreclose collateral/i });
      if (forecloseBtn) {
        expect(forecloseBtn.hasAttribute('disabled')).toBe(true);
      } else {
        expect(screen.getByText(/not yet overdue/i)).toBeDefined();
      }
    });

    it('displays observer message for third party wallets', () => {
      render(
        <LoanActionButtons
          loan={mockActiveLoan}
          userAddress={mockThirdParty}
          isOverdue={false}
          onRepay={vi.fn()}
          onForeclose={vi.fn()}
        />
      );

      expect(screen.getByText(/observer mode/i)).toBeDefined();
    });
  });

  describe('TS-05 & TS-06: Dynamic Loan Detail Page Integration', () => {
    it('renders complete loan page with details, countdown and actions for existing loan ID', async () => {
      const pagePromise = Promise.resolve({ id: '1' });
      render(await LoanDetailPage({ params: pagePromise }));

      expect(screen.getAllByText(/loan #1/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
      expect(screen.getByText('1.00 ETH')).toBeDefined();
    });

    it('renders EmptyState 404 for invalid loan ID', async () => {
      const pagePromise = Promise.resolve({ id: '999999' });
      render(await LoanDetailPage({ params: pagePromise }));

      expect(screen.getByText(/loan not found/i)).toBeDefined();
    });
  });
});
