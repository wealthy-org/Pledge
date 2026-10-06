import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';

vi.mock('@/hooks/useSafeChainId', () => ({
  useSafeChainId: () => 46630,
}));

vi.mock('wagmi', () => ({
  useConnection: () => ({ address: '0x1111111111111111111111111111111111111111', isConnected: true }),
  useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', isConnected: true }),
  useChainId: () => 46630,
}));

vi.mock('@/hooks/useWatchlist', () => ({
  useWatchlist: () => ({
    watchlist: [],
    toggleWatchlist: vi.fn(),
    isWatchlisted: () => false,
  }),
}));

const mockCollections: MarketCollectionItem[] = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Active Collection Alpha',
    symbol: 'ALPHA',
    bestOfferWei: '1000000000000000000',
    poolSizeWei: '2000000000000000000',
    offerCount: 2,
    activeLoansCount: 1,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Zero Offers Collection Beta',
    symbol: 'BETA',
    bestOfferWei: undefined,
    poolSizeWei: '0',
    offerCount: 0,
    activeLoansCount: 0,
  },
];

vi.mock('@/hooks/useUnifiedCollectionSearch', () => ({
  useUnifiedCollectionSearch: () => ({
    collections: mockCollections,
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

describe('TICKET-80: Markets Page Active Offers Filter & Explore Link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Markets page header distinguishing active markets and linking to explore', () => {
    render(<HomePage />);
    expect(screen.getByText('Lending Markets')).toBeDefined();
    expect(screen.getByText('Explore All Collections')).toBeDefined();
  });

  it('renders all collections in table by default', () => {
    render(<HomePage />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Active Collection Alpha')).toBeDefined();
    expect(within(table).getByText('Zero Offers Collection Beta')).toBeDefined();
  });

  it('allows toggling to view only collections with active offers', () => {
    render(<HomePage />);
    const hasOffersButton = screen.getByRole('button', { name: /Has offers \(/i });
    fireEvent.click(hasOffersButton);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Active Collection Alpha')).toBeDefined();
    expect(within(table).queryByText('Zero Offers Collection Beta')).toBeNull();
  });

  it('renders MarketsTable with empty state when no collections match', () => {
    render(<MarketsTable collections={[]} isLoading={false} />);
    expect(screen.getByText('No collections match your filter')).toBeDefined();
    expect(screen.getByText('Browse All Collections')).toBeDefined();
  });
});
