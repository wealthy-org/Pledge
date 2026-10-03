import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketsTable } from '@/components/markets/MarketsTable';

const mockCollections = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Robinhood Genesis Pass',
    symbol: 'RHG',
    floorPriceEth: '1.25',
    bestOfferWei: '800000000000000000',
    poolSizeWei: '5000000000000000000',
    offerCount: 4,
    activeLoansCount: 2,
    maxLtvBps: 7500,
    priceChange24hPct: 4.8,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Sherwood Forest Rangers',
    symbol: 'SFR',
    floorPriceEth: '0.65',
    bestOfferWei: '400000000000000000',
    poolSizeWei: '2000000000000000000',
    offerCount: 0,
    activeLoansCount: 1,
    maxLtvBps: 6500,
    priceChange24hPct: -2.3,
  },
];

describe('TICKET-89: Gondi 1:1 Markets Table Columns, Sparklines, & Skeletons', () => {
  it('TS-01: renders 1:1 table columns including 24H change, top bid, sales volume, and 7D floor', () => {
    render(<MarketsTable collections={mockCollections} />);

    expect(screen.getByText('#')).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /collection/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /^floor/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /24h change/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /top bid/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /sales volume/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /active wallets/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /7d floor/i })).toBeDefined();
  });

  it('TS-02: formats 24H change with appropriate positive (+) and negative (-) badges', () => {
    render(<MarketsTable collections={mockCollections} />);

    expect(screen.getByText('+4.8%')).toBeDefined();
    expect(screen.getByText('-2.3%')).toBeDefined();
  });

  it('TS-03: renders 1:1 cell skeletons with shimmer effect when isLoading is true', () => {
    render(<MarketsTable collections={[]} isLoading={true} />);

    const skeletons = screen.getAllByTestId('table-cell-skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });
});
