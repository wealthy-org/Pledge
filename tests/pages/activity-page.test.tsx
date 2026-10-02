import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ActivityPage from '@/app/activity/page';
import { ActivityItemRow } from '@/components/activity/ActivityItem';
import { ActivityFilterBar } from '@/components/activity/ActivityFilterBar';
import { ActivityStream } from '@/components/activity/ActivityStream';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import type { ActivityItem } from '@/types/api';

const mockActivities: ActivityItem[] = [
  {
    id: 1,
    eventType: 'OfferCreated',
    contractAddress: '0x1111111111111111111111111111111111111111',
    blockNumber: 105,
    txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    timestamp: '2026-10-01T13:00:00Z',
    data: {
      offerId: 2,
      lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
      principalWei: '2000000000000000000',
      termInterestBps: 700,
      durationSeconds: 1209600,
    },
  },
  {
    id: 2,
    eventType: 'LoanStarted',
    contractAddress: '0x1111111111111111111111111111111111111111',
    blockNumber: 90,
    txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    timestamp: '2026-10-01T10:00:00Z',
    data: {
      loanId: 1,
      offerId: 4,
      borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
      tokenId: '42',
      principalWei: '1000000000000000000',
    },
  },
  {
    id: 3,
    eventType: 'LoanRepaid',
    contractAddress: '0x2222222222222222222222222222222222222222',
    blockNumber: 70,
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    timestamp: '2026-09-17T10:00:00Z',
    data: {
      loanId: 2,
      borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
      repaymentAmountWei: '515000000000000000',
    },
  },
];

vi.mock('@/hooks/api/useActivity', () => ({
  useActivity: (params?: { eventType?: string; collection?: string }) => {
    let items = mockActivities;
    if (params?.eventType && params.eventType !== 'all') {
      items = items.filter((a) => a.eventType === params.eventType);
    }
    if (params?.collection && params.collection !== 'all') {
      items = items.filter((a) => a.contractAddress.toLowerCase() === params.collection?.toLowerCase());
    }
    return {
      data: { activity: items, total: items.length, nextCursor: null },
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn(),
    };
  },
}));

describe('TICKET-41: Activity Feed Page Suite', () => {
  describe('TS-01: ActivityItemRow Component', () => {
    it('renders event type badge, actor, principal ETH, and explorer proof link', () => {
      render(
        <ActivityItemRow
          activity={mockActivities[0]}
          chainId={TESTNET_CHAIN_ID}
        />
      );

      expect(screen.getByText('Offer Created')).toBeDefined();
      expect(screen.getByText(/0x0207\.\.\.Fe8d/i)).toBeDefined();
      expect(screen.getByText('2.00 ETH')).toBeDefined();

      const txLink = screen.getByRole('link', { name: /view transaction on blockscout/i });
      expect(txLink).toBeDefined();
      expect(txLink.getAttribute('href')).toContain(mockActivities[0].txHash);
    });
  });

  describe('TS-02: ActivityFilterBar Component', () => {
    it('allows changing event type filters', () => {
      const handleTypeChange = vi.fn();
      const handleCollectionChange = vi.fn();

      render(
        <ActivityFilterBar
          selectedType="all"
          selectedCollection="all"
          onTypeChange={handleTypeChange}
          onCollectionChange={handleCollectionChange}
        />
      );

      const repaidChip = screen.getByRole('button', { name: /repayments/i });
      fireEvent.click(repaidChip);
      expect(handleTypeChange).toHaveBeenCalledWith('LoanRepaid');
    });
  });

  describe('TS-03: ActivityStream & Load More Pagination', () => {
    it('renders list of activity rows and triggers onLoadMore', () => {
      const handleLoadMore = vi.fn();
      render(
        <ActivityStream
          activities={mockActivities}
          hasMore={true}
          onLoadMore={handleLoadMore}
        />
      );

      const rows = screen.getAllByTestId('activity-row');
      expect(rows.length).toBe(3);

      const loadMoreBtn = screen.getByRole('button', { name: /load more/i });
      fireEvent.click(loadMoreBtn);
      expect(handleLoadMore).toHaveBeenCalled();
    });
  });

  describe('TS-04: Integrated Activity Feed Page', () => {
    it('renders complete activity page with filters and responds to filter selection', () => {
      render(<ActivityPage />);

      expect(screen.getByText(/protocol activity feed/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /all/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /repayments/i })).toBeDefined();

      const rowsBefore = screen.getAllByTestId('activity-row');
      expect(rowsBefore.length).toBeGreaterThanOrEqual(1);

      const repaymentsFilter = screen.getByRole('button', { name: /repayments/i });
      fireEvent.click(repaymentsFilter);

      const filteredRows = screen.getAllByTestId('activity-row');
      expect(filteredRows.length).toBe(1);
      expect(filteredRows[0].textContent).toContain('Loan Repaid');
    });
  });
});
