import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExploreFilters } from '@/components/explore/ExploreFilters';
import { ExploreGrid } from '@/components/explore/ExploreGrid';

const mockCollections = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Robinhood Genesis Pass',
    symbol: 'RHG',
    imageUrl: '',
    floorPriceEth: '1.25',
    bestOfferWei: '800000000000000000',
    poolSizeWei: '5000000000000000000',
    offerCount: 4,
    activeLoansCount: 2,
    isVerifiedErc721: true,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Sherwood Forest Rangers',
    symbol: 'SFR',
    imageUrl: '',
    floorPriceEth: '0.65',
    bestOfferWei: '400000000000000000',
    poolSizeWei: '2000000000000000000',
    offerCount: 0,
    activeLoansCount: 1,
    isVerifiedErc721: true,
  },
];

describe('TICKET-90: Gondi 1:1 Explore Directory, View Mode Switcher, & Advanced Filters', () => {
  it('TS-01: ExploreFilters renders search, keyboard shortcut hints, sort dropdown, and view mode toggle', () => {
    const handleSearch = vi.fn();
    const handleToggleOffers = vi.fn();
    const handleSortChange = vi.fn();
    const handleViewModeChange = vi.fn();

    render(
      <ExploreFilters
        search=""
        onSearchChange={handleSearch}
        hasOffersOnly={false}
        onToggleHasOffers={handleToggleOffers}
        sortBy="volume"
        onSortChange={handleSortChange}
        viewMode="grid"
        onViewModeChange={handleViewModeChange}
        totalCount={42}
      />
    );

    expect(screen.getByPlaceholderText('Search collection name, symbol, or 0x...')).toBeDefined();
    expect(screen.getByLabelText(/grid view/i)).toBeDefined();
    expect(screen.getByLabelText(/table view/i)).toBeDefined();
    expect(screen.getByRole('combobox', { name: /sort collections/i })).toBeDefined();
    expect(screen.getByText('42 Collections')).toBeDefined();
  });

  it('TS-02: ExploreFilters toggles view mode between grid and table', () => {
    const handleViewModeChange = vi.fn();

    render(
      <ExploreFilters
        search=""
        onSearchChange={vi.fn()}
        hasOffersOnly={false}
        onToggleHasOffers={vi.fn()}
        viewMode="grid"
        onViewModeChange={handleViewModeChange}
        totalCount={2}
      />
    );

    const tableButton = screen.getByLabelText(/table view/i);
    fireEvent.click(tableButton);
    expect(handleViewModeChange).toHaveBeenCalledWith('table');
  });

  it('TS-03: ExploreGrid renders 1:1 skeleton cards when isLoading is true in grid mode', () => {
    render(<ExploreGrid collections={[]} isLoading={true} viewMode="grid" />);

    const skeletons = screen.getAllByTestId('explore-skeleton-card');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('TS-04: ExploreGrid renders table view when viewMode is table', () => {
    render(<ExploreGrid collections={mockCollections} isLoading={false} viewMode="table" />);

    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
    expect(screen.getByText('Sherwood Forest Rangers')).toBeDefined();
  });
});
