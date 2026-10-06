import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketsTable } from '@/components/markets/MarketsTable';
import { NFTGrid } from '@/components/borrow/NFTGrid';
import { BorrowingTab } from '@/components/portfolio/BorrowingTab';
import { HistoryTab } from '@/components/portfolio/HistoryTab';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('TICKET-69: Shimmer Skeleton Loading States Test Suite', () => {
  it('renders per-cell shimmer skeleton for MarketsTable when isLoading is true', () => {
    render(<MarketsTable collections={[]} isLoading={true} />);

    const skeletons = screen.getAllByTestId('table-cell-skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('renders card skeletons for NFTGrid when isLoading is true', () => {
    render(<NFTGrid nfts={[]} selectedNft={null} onSelectNft={() => {}} isLoading={true} />);

    const skeletonCards = screen.getAllByTestId('nft-card-skeleton');
    expect(skeletonCards.length).toBe(15);
  });

  it('renders skeleton cards for BorrowingTab when isLoading is true', () => {
    render(<BorrowingTab loans={[]} isLoading={true} />);

    const skeletons = screen.getAllByTestId('borrowing-skeleton-card');
    expect(skeletons.length).toBe(3);
  });

  it('renders skeleton rows for HistoryTab when isLoading is true', () => {
    render(<HistoryTab loans={[]} offers={[]} isLoading={true} />);

    const skeletons = screen.getAllByTestId('history-skeleton-row');
    expect(skeletons.length).toBe(4);
  });
});
