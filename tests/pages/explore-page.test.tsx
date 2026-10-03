import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExploreCard } from '@/components/explore/ExploreCard';
import { ExploreFilters } from '@/components/explore/ExploreFilters';
import { ExploreGrid } from '@/components/explore/ExploreGrid';

describe('TICKET-79: Dedicated Explore Page & Directory Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TS-01: ExploreCard renders collection info, copy button, and offer badges', () => {
    const mockCollection = {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Sherwood Foresters',
      symbol: 'SFF',
      imageUrl: 'https://example.com/sff.png',
      bestOfferWei: '1500000000000000000',
      poolSizeWei: '5000000000000000000',
      offerCount: 3,
      activeLoansCount: 1,
      isVerifiedErc721: true,
      isDuplicateName: true,
    };

    render(<ExploreCard collection={mockCollection} />);

    expect(screen.getByText('Sherwood Foresters')).toBeDefined();
    expect(screen.getByText('SFF')).toBeDefined();
    expect(screen.getByText('0x1234...7890')).toBeDefined();
    expect(screen.getByText('3 Offers')).toBeDefined();
    expect(screen.getByText('1.50 ETH')).toBeDefined();
    expect(screen.getByText('5.00 ETH')).toBeDefined();
    expect(screen.getByText(/Periksa alamat kontrak untuk menghindari peniruan nama/i)).toBeDefined();
  });

  it('TS-02: ExploreFilters handles search and toggle callbacks', () => {
    const onSearchChange = vi.fn();
    const onToggleHasOffers = vi.fn();

    render(
      <ExploreFilters
        search="test"
        onSearchChange={onSearchChange}
        hasOffersOnly={false}
        onToggleHasOffers={onToggleHasOffers}
        totalCount={42}
      />
    );

    const input = screen.getByPlaceholderText('Cari nama koleksi, simbol, atau 0x...');
    fireEvent.change(input, { target: { value: 'birds' } });
    expect(onSearchChange).toHaveBeenCalledWith('birds');

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggleHasOffers).toHaveBeenCalledWith(true);
  });

  it('TS-03: ExploreGrid renders empty state when no items exist', () => {
    render(<ExploreGrid collections={[]} isLoading={false} />);
    expect(screen.getByText('Tidak Ada Koleksi Ditemukan')).toBeDefined();
  });
});
