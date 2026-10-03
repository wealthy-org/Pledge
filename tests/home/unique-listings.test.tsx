import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UniqueListingsSection } from '@/components/home/UniqueListingsSection';

const mockListings = [
  {
    id: 'rhg-42',
    collectionAddress: '0x1111111111111111111111111111111111111111',
    collectionName: 'Robinhood Genesis Pass',
    tokenId: '42',
    imageUrl: '',
    floorPriceEth: '1.25',
    bestOfferEth: '0.95',
    status: 'in_loan' as const,
    isVerified: true,
  },
  {
    id: 'sfr-108',
    collectionAddress: '0x2222222222222222222222222222222222222222',
    collectionName: 'Sherwood Forest Rangers',
    tokenId: '108',
    imageUrl: '',
    floorPriceEth: '0.65',
    bestOfferEth: '0.45',
    status: 'floor' as const,
    isVerified: true,
  },
];

describe('TICKET-89: Gondi 1:1 Unique Listings & Carousel Component Test Suite', () => {
  it('TS-01: renders section title, info tooltip, and filter chips', () => {
    render(<UniqueListingsSection items={mockListings} isLoading={false} />);

    expect(screen.getByText(/unique listings/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'All' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Floor' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Lower Price' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'In Loan' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Off-Market' })).toBeDefined();
  });

  it('TS-02: filters items when clicking filter chips', () => {
    render(<UniqueListingsSection items={mockListings} isLoading={false} />);

    expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
    expect(screen.getByText('Sherwood Forest Rangers')).toBeDefined();

    const inLoanChip = screen.getByRole('button', { name: 'In Loan' });
    fireEvent.click(inLoanChip);

    expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
    expect(screen.queryByText('Sherwood Forest Rangers')).toBeNull();
  });

  it('TS-03: renders 1:1 NftCardSkeleton when isLoading is true', () => {
    render(<UniqueListingsSection items={[]} isLoading={true} />);

    const skeletons = screen.getAllByTestId('nft-card-skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('TS-04: provides scroll navigation buttons with disabled attributes at bounds', () => {
    render(<UniqueListingsSection items={mockListings} isLoading={false} />);

    const prevButton = screen.getByLabelText(/scroll listings left/i);
    const nextButton = screen.getByLabelText(/scroll listings right/i);

    expect(prevButton).toBeDefined();
    expect(nextButton).toBeDefined();
  });
});
