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
  {
    address: '0x3333333333333333333333333333333333333333',
    name: 'Sherwood Forest Rangers',
    symbol: 'SFR',
    floorPriceEth: '0.55',
    bestOfferWei: '200000000000000000',
    poolSizeWei: '1000000000000000000',
    offerCount: 2,
    activeLoansCount: 1,
    isVerified: true,
  },
  {
    address: '0x4444444444444444444444444444444444444444',
    name: 'Nottingham Guild',
    symbol: 'NTG',
    floorPriceEth: '0.45',
    bestOfferWei: '150000000000000000',
    poolSizeWei: '3000000000000000000',
    offerCount: 3,
    activeLoansCount: 0,
    isVerified: true,
  },
  {
    address: '0x5555555555555555555555555555555555555555',
    name: 'CryptoPunks V1',
    symbol: 'PUNK',
    floorPriceEth: '25.0',
    bestOfferWei: '20000000000000000000',
    poolSizeWei: '50000000000000000000',
    offerCount: 5,
    activeLoansCount: 2,
    isVerified: true,
  },
];

describe('FeaturedListingsCarousel Component', () => {
  it('renders carousel header, live badge, and collection items', () => {
    render(<FeaturedListingsCarousel collections={mockCollections} />);

    expect(screen.getByText(/trending markets & offers/i)).toBeDefined();
    expect(screen.getByText(/live escrow/i)).toBeDefined();
    expect(screen.getAllByText('Robinhood Genesis').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pledge Founders').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 Offers').length).toBeGreaterThan(0);
  });

  it('filters items when clicking filter chips', () => {
    render(<FeaturedListingsCarousel collections={mockCollections} />);

    const activeOffersChip = screen.getByRole('button', { name: /active offers/i });
    fireEvent.click(activeOffersChip);

    expect(screen.getAllByText('Robinhood Genesis').length).toBeGreaterThan(0);
    expect(screen.queryByText('Pledge Founders')).toBeNull();

    const inLoanChip = screen.getByRole('button', { name: /in loan/i });
    fireEvent.click(inLoanChip);

    expect(screen.getAllByText('Robinhood Genesis').length).toBeGreaterThan(0);

    const allChip = screen.getByRole('button', { name: /all listings/i });
    fireEvent.click(allChip);

    expect(screen.getAllByText('Pledge Founders').length).toBeGreaterThan(0);
  });

  it('handles scroll and play/stop button interactions gracefully for >=5 items', () => {
    render(<FeaturedListingsCarousel collections={mockCollections} />);

    const stopButton = screen.getByRole('button', { name: /stop scrolling/i });
    expect(stopButton).toBeDefined();

    fireEvent.click(stopButton);

    const startButton = screen.getByRole('button', { name: /start scrolling/i });
    expect(startButton).toBeDefined();

    fireEvent.click(startButton);
    expect(screen.getByRole('button', { name: /stop scrolling/i })).toBeDefined();

    const scrollRightBtn = screen.getByRole('button', { name: /scroll right/i });
    const scrollLeftBtn = screen.getByRole('button', { name: /scroll left/i });

    expect(scrollRightBtn).toBeDefined();
    expect(scrollLeftBtn).toBeDefined();

    fireEvent.click(scrollRightBtn);
    fireEvent.click(scrollLeftBtn);
  });

  it('toggles watchlist on card star button click', () => {
    render(<FeaturedListingsCarousel collections={mockCollections.slice(0, 2)} />);

    const starBtns = screen.getAllByRole('button', { name: /add to watchlist/i });
    expect(starBtns.length).toBeGreaterThan(0);
    fireEvent.click(starBtns[0]);
  });
});


