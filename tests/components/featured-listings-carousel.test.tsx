import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeaturedListingsCarousel } from '@/components/home/FeaturedListingsCarousel';
import type { MarketCollectionItem } from '@/components/markets/MarketsTable';

const mockCollections: MarketCollectionItem[] = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Robinhood Genesis',
    symbol: 'RHG',
    floorPriceEth: '1.25',
    bestOfferWei: '1000000000000000000',
    poolSizeWei: '5000000000000000000',
    offerCount: 4,
    activeLoansCount: 2,
    isVerified: true,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Pledge Founders',
    symbol: 'PFN',
    floorPriceEth: '0.85',
    bestOfferWei: '0',
    poolSizeWei: '0',
    offerCount: 0,
    activeLoansCount: 0,
    isVerified: true,
  },
];

describe('FeaturedListingsCarousel Component', () => {
  it('renders carousel header, live badge, and collection items', () => {
    render(<FeaturedListingsCarousel collections={mockCollections} />);

    expect(screen.getByText(/trending markets & offers/i)).toBeDefined();
    expect(screen.getByText(/live escrow/i)).toBeDefined();
    expect(screen.getByText('Robinhood Genesis')).toBeDefined();
    expect(screen.getByText('Pledge Founders')).toBeDefined();
    expect(screen.getByText('4 Offers')).toBeDefined();
  });

  it('filters items when clicking filter chips', () => {
    render(<FeaturedListingsCarousel collections={mockCollections} />);

    const activeOffersChip = screen.getByRole('button', { name: /active offers/i });
    fireEvent.click(activeOffersChip);

    expect(screen.getByText('Robinhood Genesis')).toBeDefined();
    expect(screen.queryByText('Pledge Founders')).toBeNull();

    const inLoanChip = screen.getByRole('button', { name: /in loan/i });
    fireEvent.click(inLoanChip);

    expect(screen.getByText('Robinhood Genesis')).toBeDefined();

    const allChip = screen.getByRole('button', { name: /all listings/i });
    fireEvent.click(allChip);

    expect(screen.getByText('Pledge Founders')).toBeDefined();
  });

  it('handles scroll button interactions gracefully', () => {
    render(<FeaturedListingsCarousel collections={mockCollections} />);

    const scrollRightBtn = screen.getByRole('button', { name: /scroll right/i });
    const scrollLeftBtn = screen.getByRole('button', { name: /scroll left/i });

    expect(scrollRightBtn).toBeDefined();
    expect(scrollLeftBtn).toBeDefined();

    fireEvent.click(scrollRightBtn);
    fireEvent.click(scrollLeftBtn);
  });
});
