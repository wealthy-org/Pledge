import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import CollectionDetailPage from '@/app/collection/[address]/page';
import { CollectionHeader } from '@/components/collection/CollectionHeader';
import { CollectionOffersTable } from '@/components/collection/CollectionOffersTable';
import { CollectionLoanHistoryTable } from '@/components/collection/CollectionLoanHistoryTable';
import { CollectionRiskNotes } from '@/components/collection/CollectionRiskNotes';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import type { OfferItem, LoanItem } from '@/types/api';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

const mockCollection = {
  id: '0x75599f7385dcdbe2ab3b3b0b8d4a3e2c8f02494d',
  name: 'Nottingham Guild Pledges',
  symbol: 'NGP',
  contractAddress: '0x75599F7385dCdbE2aB3b3b0B8d4A3E2C8f02494D' as `0x${string}`,
  defaultDurations: [7, 14, 30] as [7, 14, 30],
  addresses: {
    [TESTNET_CHAIN_ID]: '0x75599F7385dCdbE2aB3b3b0B8d4A3E2C8f02494D' as `0x${string}`,
  },
};

const mockOffers: OfferItem[] = [
  {
    offerId: 1,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: mockCollection.contractAddress,
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
  {
    offerId: 2,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: mockCollection.contractAddress,
    principalWei: '2000000000000000000',
    termInterestBps: 700,
    feeBpsSnapshot: 200,
    durationSeconds: 1209600,
    expiresAt: '2026-10-20T00:00:00Z',
    status: 'open',
    blockNumber: 105,
    txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    createdAt: '2026-10-01T13:00:00Z',
  },
];

const mockLoans: LoanItem[] = [
  {
    loanId: 1,
    offerId: 4,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
    collection: mockCollection.contractAddress,
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
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
    collection: mockCollection.contractAddress,
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

describe('TICKET-38: Collection Detail Page & Components', () => {
  describe('TS-01: CollectionHeader', () => {
    it('renders collection identity, badges, explorer link and order book stats', () => {
      render(
        <CollectionHeader
          collection={mockCollection}
          stats={{
            bestOfferWei: '2000000000000000000',
            poolSizeWei: '3500000000000000000',
            offerCount: 2,
            aprRange: '21.10% - 26.07%',
            activeLoansCount: 1,
          }}
        />
      );

      expect(screen.getAllByText(mockCollection.name).length).toBeGreaterThan(0);
      expect(screen.getAllByText(mockCollection.symbol).length).toBeGreaterThan(0);
      expect(screen.getByText(/Verified/i)).toBeDefined();
      expect(screen.getByText('2.00 ETH')).toBeDefined();
      expect(screen.getByText('3.50 ETH')).toBeDefined();
      expect(screen.getByText('21.10% - 26.07%')).toBeDefined();

      const explorerLink = screen.getByRole('link', { name: /view on blockscout/i });
      expect(explorerLink).toBeDefined();
      expect(explorerLink.getAttribute('href')).toContain(mockCollection.contractAddress);
    });
  });

  describe('TS-02 & TS-03: CollectionOffersTable', () => {
    it('sorts offers by principal DESC and highlights the top offer', () => {
      const handleBorrow = vi.fn();
      render(
        <CollectionOffersTable
          offers={mockOffers}
          onBorrow={handleBorrow}
        />
      );

      const rows = screen.getAllByTestId('collection-offer-row');
      expect(rows.length).toBe(2);

      expect(rows[0].getAttribute('data-best-offer')).toBe('true');
      expect(rows[1].getAttribute('data-best-offer')).toBe('false');

      expect(rows[0].textContent).toContain('2.00 ETH');
      expect(rows[1].textContent).toContain('1.50 ETH');

      expect(screen.getAllByText(/annualized/i).length).toBeGreaterThanOrEqual(1);

      const borrowButtons = screen.getAllByRole('button', { name: /borrow/i });
      fireEvent.click(borrowButtons[0]);
      expect(handleBorrow).toHaveBeenCalledWith(expect.objectContaining({ offerId: 2 }));
    });
  });

  describe('TS-04: CollectionLoanHistoryTable', () => {
    it('renders loan history entries with borrower address, status badge, and tx link', () => {
      render(<CollectionLoanHistoryTable loans={mockLoans} />);

      expect(screen.getByText('#42')).toBeDefined();
      expect(screen.getByText('#101')).toBeDefined();
      expect(screen.getByText('1.00 ETH')).toBeDefined();
      expect(screen.getByText('0.50 ETH')).toBeDefined();
      expect(screen.getAllByText(/active/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/repaid/i).length).toBeGreaterThanOrEqual(1);

      const txLinks = screen.getAllByRole('link', { name: /tx/i });
      expect(txLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TS-05: CollectionRiskNotes', () => {
    it('renders risk assessment banner if notes are present', () => {
      render(
        <CollectionRiskNotes
          collectionName="Robinhood Genesis Pass"
          notes="High liquidity Genesis Tier pass."
        />
      );

      expect(screen.getByText(/curated risk assessment/i)).toBeDefined();
      expect(screen.getByText('High liquidity Genesis Tier pass.')).toBeDefined();
    });

    it('renders nothing when notes are absent', () => {
      const { container } = render(
        <CollectionRiskNotes collectionName="Robinhood Genesis Pass" />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('TS-06 & TS-07: Dynamic Collection Page Integration', () => {
    it('renders full collection detail view with tabs and allows switching tabs', async () => {
      const pagePromise = Promise.resolve({ address: mockCollection.contractAddress });
      render(await CollectionDetailPage({ params: pagePromise }));

      expect(screen.getByRole('heading', { level: 1, name: /Nottingham Guild Pledges/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /offers/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /active loans/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /history/i })).toBeDefined();

      const offersTab = screen.getByRole('tab', { name: /offers/i });
      expect(offersTab.getAttribute('aria-selected')).toBe('true');

      const activeLoansTab = screen.getByRole('tab', { name: /active loans/i });
      fireEvent.click(activeLoansTab);
      expect(activeLoansTab.getAttribute('aria-selected')).toBe('true');

      const historyTab = screen.getByRole('tab', { name: /history/i });
      fireEvent.click(historyTab);
      expect(historyTab.getAttribute('aria-selected')).toBe('true');
    });

    it('renders 404 EmptyState when collection address is invalid or not found', async () => {
      const pagePromise = Promise.resolve({ address: '0x000000000000000000000000000000000000dead' });
      render(await CollectionDetailPage({ params: pagePromise }));

      expect(screen.getByText(/collection not found/i)).toBeDefined();
    });
  });
});
