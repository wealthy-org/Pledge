import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalSearch } from '@/components/ui/GlobalSearch';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockCollectionsWithCuration = [
  {
    address: '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496',
    name: 'Robinhood Genesis Pass',
    symbol: 'RHG',
    imageUrl: '',
    poolSizeWei: '0',
    offerCount: 0,
    activeLoansCount: 0,
    isCurated: true,
  },
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    name: 'Bored Ape Yacht Club',
    symbol: 'BAYC',
    imageUrl: '',
    poolSizeWei: '0',
    offerCount: 0,
    activeLoansCount: 0,
    isCurated: false,
  },
];

vi.mock('@/hooks/api/useCollections', () => ({
  useCollections: () => ({
    data: {
      collections: mockCollectionsWithCuration,
    },
    isLoading: false,
  }),
}));

describe('GlobalSearch Curation Badge Accuracy Test Suite', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders Market Collections header when query is empty instead of claiming all are Curated', () => {
    render(<GlobalSearch isOpen={true} onClose={mockClose} />);
    expect(screen.getByText('Market Collections')).toBeDefined();
    expect(screen.queryByText('Curated Collections')).toBeNull();
  });

  it('accurately distinguishes Curated badge from Explore badge', () => {
    render(<GlobalSearch isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('Robinhood Genesis Pass')).toBeDefined();
    expect(screen.getByText('Bored Ape Yacht Club')).toBeDefined();

    const curatedBadges = screen.getAllByText('Curated');
    expect(curatedBadges.length).toBe(1);

    const exploreBadges = screen.getAllByText('Explore');
    expect(exploreBadges.length).toBe(1);
  });
});
