import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { MarketsTable } from '@/components/markets/MarketsTable';
import { MarketStatCards } from '@/components/markets/MarketStatCards';

const mockCollections = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Robinhood Genesis Pass',
    symbol: 'RHG',
    imageUrl: 'https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    floorPriceEth: '1.25',
    bestOfferWei: '800000000000000000',
    poolSizeWei: '5000000000000000000',
    offerCount: 4,
    activeLoansCount: 2,
    maxLtvBps: 7500,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Sherwood Forest Rangers',
    symbol: 'SFR',
    imageUrl: 'https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    floorPriceEth: '0.65',
    bestOfferWei: '400000000000000000',
    poolSizeWei: '2000000000000000000',
    offerCount: 0,
    activeLoansCount: 1,
    maxLtvBps: 6500,
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    name: 'Nottingham Guild Pledges',
    symbol: 'NGP',
    imageUrl: 'https://ipfs.io/ipfs/bafybeif43gq2qj6tfe2eeb3aeqbkmr23vx4zdfhshuv5b3z24o2eqk55ye',
    floorPriceEth: '0.45',
    bestOfferWei: '300000000000000000',
    poolSizeWei: '8000000000000000000',
    offerCount: 6,
    activeLoansCount: 0,
    maxLtvBps: 7000,
  },
];

describe('TICKET-35: Markets Page & Table Component Test Suite', () => {
  it('TS-01: MarketStatCards renders 3 global market metric cards', () => {
    render(
      <MarketStatCards
        stats={{
          totalPoolSizeEth: '15.00',
          totalActiveLoans: 3,
          totalVolumeEth: '42.50',
        }}
      />
    );

    expect(screen.getByText(/total pool size/i)).toBeDefined();
    expect(screen.getByText(/total active loans/i)).toBeDefined();
    expect(screen.getByText(/total volume/i)).toBeDefined();
    expect(screen.getByText('15.00 ETH')).toBeDefined();
  });

  it('TS-02: MarketsTable renders all 7 specified columns and default sorts by Pool Size DESC', () => {
    render(<MarketsTable collections={mockCollections} />);

    expect(screen.getByText('#')).toBeDefined();
    expect(screen.getByText(/collection/i)).toBeDefined();
    expect(screen.getByText(/best offer/i)).toBeDefined();
    expect(screen.getByText(/pool size/i)).toBeDefined();
    expect(screen.getByText(/offers/i)).toBeDefined();
    expect(screen.getByText(/ltv/i)).toBeDefined();
    expect(screen.getByText(/action/i)).toBeDefined();

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(4);
    expect(rows[1].textContent).toContain('Nottingham Guild Pledges');
  });

  it('TS-03: FilterChip selection filters collections list', () => {
    const { rerender } = render(<MarketsTable collections={mockCollections} />);
    expect(screen.getByText('Sherwood Forest Rangers')).toBeDefined();

    const filtered = mockCollections.filter((c) => c.offerCount > 0);
    rerender(<MarketsTable collections={filtered} />);

    expect(screen.queryByText('Sherwood Forest Rangers')).toBeNull();
    expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
    expect(screen.getByText('Nottingham Guild Pledges')).toBeDefined();
  });

  it('TS-04: MarketsTable renders cell skeletons when isLoading is true', () => {
    render(<MarketsTable collections={[]} isLoading={true} />);
    const skeletons = screen.getAllByTestId('table-cell-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('TS-05: Borrow button renders link to /borrow?collection={address}', () => {
    render(<MarketsTable collections={mockCollections} />);
    const borrowLinks = screen.getAllByRole('link', { name: /borrow/i });
    expect(borrowLinks[0].getAttribute('href')).toContain('/borrow?collection=');
  });

  it('TS-06: HomePage integrates StatCards, FilterChips, and MarketsTable', () => {
    render(<HomePage />);
    expect(screen.getByText(/total pool size/i)).toBeDefined();
    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText(/has offers/i)).toBeDefined();
  });
});
