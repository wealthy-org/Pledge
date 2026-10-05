import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ItemDetailClient } from '@/app/item/[collection]/[tokenId]/ItemDetailClient';

const collection = '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9';

describe('ItemDetailClient Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then item metadata', async () => {
    const mockItem = {
      collection,
      tokenId: '77',
      chainId: 46630,
      metadata: {
        name: 'Cyber Punk #77',
        description: 'A futuristic cyber warrior',
        imageUrl: 'https://img.test/77.png',
        attributes: [{ trait_type: 'Armor', value: 'Titanium' }],
      },
      activeLoan: null,
      bestOffer: {
        offerId: 10,
        principalWei: '1500000000000000000',
        termInterestBps: 500,
        durationSeconds: '604800',
        expiresAt: '1800000000',
        lender: '0x1111111111111111111111111111111111111111',
      },
      openOffersCount: 3,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    });

    render(<ItemDetailClient collection={collection} tokenId="77" />);

    await waitFor(() => {
      expect(screen.getByText('Cyber Punk #77')).toBeDefined();
    });

    expect(screen.getByText('A futuristic cyber warrior')).toBeDefined();
    expect(screen.getByText('1.500 ETH')).toBeDefined();
    expect(screen.getByText('Available for Borrowing')).toBeDefined();
    expect(screen.getByText('Armor')).toBeDefined();
    expect(screen.getByText('Titanium')).toBeDefined();
  });

  it('renders active loan banner when NFT is locked in escrow', async () => {
    const mockItem = {
      collection,
      tokenId: '88',
      chainId: 46630,
      metadata: {
        name: 'Escrowed NFT #88',
        description: 'Currently collateralized',
        imageUrl: '',
        attributes: [],
      },
      activeLoan: {
        loanId: 99,
        offerId: 12,
        principalWei: '2000000000000000000',
        interestWei: '100000000000000000',
        dueAt: '1800000000',
        borrower: '0x2222222222222222222222222222222222222222',
        lender: '0x1111111111111111111111111111111111111111',
        status: 'active',
      },
      bestOffer: null,
      openOffersCount: 0,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    });

    render(<ItemDetailClient collection={collection} tokenId="88" />);

    await waitFor(() => {
      expect(screen.getByText('Escrowed NFT #88')).toBeDefined();
    });

    expect(screen.getByText(/Currently Escrowed in Loan #99/i)).toBeDefined();
    expect(screen.getByText('View Active Loan Terms →')).toBeDefined();
  });
});
