import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OfferComparisonList } from '@/components/borrow/OfferComparisonList';

describe('TICKET-78: Borrow Open Catalog & Empty-Offer Fallback State', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TS-01: OfferComparisonList renders empty-offer fallback when no offers are available', () => {
    render(
      <OfferComparisonList
        offers={[]}
        collectionAddress="0x1234567890123456789012345678901234567890"
        onSelectOffer={vi.fn()}
      />
    );

    expect(screen.getByText('No offers available for this collection.')).toBeDefined();
    expect(screen.getByText('Explore Other Collections')).toBeDefined();
    expect(screen.getByText('Create Lending Offer')).toBeDefined();
  });

  it('TS-02: OfferComparisonList renders active offers when available', () => {
    const mockOffers = [
      {
        offerId: 1,
        chainId: 46630,
        lender: '0x1111111111111111111111111111111111111111',
        collection: '0x2222222222222222222222222222222222222222',
        principalWei: '1000000000000000000',
        termInterestBps: 500,
        feeBpsSnapshot: 250,
        durationSeconds: 604800,
        expiresAt: '2000000000',
        status: 'open' as const,
        blockNumber: 100,
        txHash: '0xabc',
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <OfferComparisonList
        offers={mockOffers}
        collectionAddress="0x2222222222222222222222222222222222222222"
        onSelectOffer={vi.fn()}
      />
    );

    expect(screen.getByText('Best Offer')).toBeDefined();
    expect(screen.getByText('1.00 ETH')).toBeDefined();
    expect(screen.getByText('Borrow this Offer')).toBeDefined();
  });
});
